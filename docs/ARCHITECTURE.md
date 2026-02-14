# PharmoPet SaaS - Arquitetura do Sistema

## A) ARQUITETURA DETALHADA

### Decisao de Stack (Justificativa)

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Backend** | Express.js 5 + TypeScript | Ja em uso, equipe familiarizada, pragmatico |
| **ORM** | Prisma 5 | Ja em uso, migrations first-class, type-safe |
| **DB** | PostgreSQL 15 | Ja em uso, robusto, suporta JSON, arrays |
| **Frontend** | React 19 + Vite + Tailwind | Ja em uso, performante, ecossistema maduro |
| **Auth** | JWT + Refresh Token | Simplicidade; Keycloak seria overengineering no MVP |
| **PDF** | PDFKit (server-side) | Leve, sem dependencia de browser, white-label facil |
| **Storage** | Supabase (atual) / MinIO (futuro) | Ja configurado, migrar para MinIO quando self-hosted |
| **Filas** | BullMQ + Redis (Fase 2) | Nao necessario no MVP; adicionar para emails/PDF async |
| **Testes** | Vitest (unit) + Supertest (integration) | Rapido, compativel com TypeScript |
| **Docker** | Docker Compose | Dev local e producao |

### Modulos do Sistema

```
packages/
  server/
    src/
      modules/
        auth/           # Autenticacao (JWT, refresh, roles)
        tenant/         # Multi-tenant (clinicas)
        veterinario/    # CRUD veterinarios
        tutor/          # CRUD tutores
        animal/         # CRUD animais/pacientes
        principio-ativo/# CRUD ativos, ranges, concentracoes
        protocolo/      # Prescricoes prontas (modo A)
        prescricao/     # Motor de prescricao (modo A+B)
        validacao/      # Motor de validacao clinica + logs
        pdf/            # Geracao de PDF white-label
        orcamento/      # [Placeholder] Fase 2
        estoque/        # [Placeholder] Fase 3
        financeiro/     # [Placeholder] Fase 4
        portal-tutor/   # [Placeholder] Fase 6
      shared/
        middleware/      # Auth, tenant, error handler, validation
        utils/           # Helpers (calculo dosagem, conversao unidades)
        errors/          # Classes de erro padronizadas
        types/           # Tipos compartilhados
      prisma/
        schema.prisma
        migrations/
        seed.ts
  client/
    src/
      modules/
        auth/
        dashboard/
        prescricao/
        ativos/
        pacientes/
        configuracoes/
      shared/
        components/
        hooks/
        services/
        store/
```

### Fluxo Multi-Tenant

```
Request -> Auth Middleware (JWT) -> Tenant Middleware (clinica_id do token)
                                          |
                                    Injeta clinica_id no req
                                          |
                                    Controller -> Service -> Repository
                                          |
                                    Todas queries filtram por clinica_id
```

- Cada clinica = 1 tenant
- Isolamento por `clinica_id` em todas as tabelas de dominio
- Usuarios admin da plataforma (super-admin) acessam cross-tenant
- Veterinarios podem pertencer a multiplas clinicas

### Fluxo de Prescricao (Core)

```
1. Vet seleciona paciente (tutor + animal)
2. Escolhe modo:
   A) Protocolo pronto -> carrega formula pre-definida
   B) Formula manual -> seleciona principios ativos
3. Para cada ativo:
   - Seleciona concentracao (dropdown de validas)
   - Define posologia (frequencia + duracao)
   - Sistema calcula total automatico
4. Motor de Validacao:
   - Verifica dose vs range terapeutico (especie + peso)
   - Se OK -> prossegue
   - Se FORA DO RANGE -> exige aceite + motivo
   - Log juridico salvo (quem, quando, dose, range, motivo)
5. Salva prescricao (status: DRAFT)
6. Vet assina -> status: SIGNED
7. Gera PDF white-label
8. Envia ao tutor -> status: SENT
```

---

## B) MODELO DE DADOS (ERD)

### Tabelas Principais (MVP - Prioridade 1)

```
Clinica (tenant)
├── id, nome_fantasia, razao_social, cnpj
├── logo_url, cor_primaria, cor_secundaria (branding)
├── email, telefone, endereco completo
├── status, configuracoes (JSON)
└── created_at, updated_at

ClinicaUsuario (usuarios da clinica)
├── id, clinica_id (FK), nome, email, senha_hash
├── role (ADMIN_CLINICA, VETERINARIO, RECEPCIONISTA, FARMACEUTICO)
├── veterinario_id (FK, nullable - vincula ao perfil profissional)
└── ativo, created_at, updated_at

Veterinario (perfil profissional)
├── id, nome, cpf, crmv, uf_crmv
├── email, telefone, especialidades[]
├── status, assinatura_digital_url
└── created_at, updated_at

Tutor
├── id, clinica_id (FK), nome, cpf, email, telefone
├── endereco, cidade, estado, cep
└── created_at, updated_at

Animal
├── id, tutor_id (FK), clinica_id (FK)
├── nome, especie (ENUM), raca, sexo
├── peso_kg, data_nascimento
├── observacoes, ativo
└── created_at, updated_at

PrincipioAtivo
├── id, nome_padronizado, classe_terapeutica
├── controlado (bool), descricao_palatavel
├── created_at, updated_at
(tabela global, compartilhada entre tenants)

PrincipioAtivoConcentracao
├── id, principio_ativo_id (FK)
├── valor (Decimal), unidade (mg, g, ml, %)
├── forma_farmaceutica (CAPSULE, LIQUID, BISCOITO, etc)
└── ativo (bool)

FaixaTerapeutica
├── id, principio_ativo_id (FK)
├── especie (CANINO, FELINO, EQUINO, etc)
├── peso_min_kg, peso_max_kg (nullable = qualquer peso)
├── dose_min_mg_kg, dose_max_mg_kg
├── frequencia_horas (ex: 8, 12, 24)
├── observacoes
└── fonte_referencia

Protocolo (prescricao pronta - modo A)
├── id, clinica_id (FK, nullable = global)
├── codigo, nome, descricao
├── especie_alvo, indicacao
├── ativo (bool)
└── created_at, updated_at

ProtocoloItem
├── id, protocolo_id (FK)
├── principio_ativo_id (FK)
├── concentracao_id (FK)
├── dose_mg_kg (Decimal)
├── frequencia_horas, duracao_dias
├── observacoes
└── ordem (Int)

Prescricao
├── id, clinica_id (FK), veterinario_id (FK)
├── tutor_id (FK), animal_id (FK)
├── protocolo_id (FK, nullable)
├── diagnostico, observacoes
├── status (DRAFT, VALIDADA, ASSINADA, ENVIADA, CANCELADA)
├── pdf_url
├── created_at, updated_at, signed_at

PrescricaoItem
├── id, prescricao_id (FK)
├── principio_ativo_id (FK)
├── concentracao_id (FK)
├── dose_mg_kg, dose_total_mg
├── frequencia_horas, duracao_dias
├── quantidade_total (calculada)
├── forma_farmaceutica
├── posologia_texto (gerado automaticamente)
├── observacoes, ordem

ValidacaoLog (log juridico auditavel)
├── id, prescricao_id (FK), prescricao_item_id (FK)
├── clinica_id (FK), veterinario_id (FK)
├── tipo (DENTRO_FAIXA, FORA_FAIXA_ACEITO, FORA_FAIXA_REJEITADO)
├── dose_prescrita_mg_kg
├── dose_min_mg_kg, dose_max_mg_kg (range no momento)
├── especie, peso_animal_kg
├── motivo_aceite (texto obrigatorio se fora da faixa)
├── ip_address, user_agent
├── created_at (imutavel, sem updated_at)

UsuarioAdmin (super-admin da plataforma)
├── id, nome, email, senha_hash, role
└── created_at, updated_at

AuditLog (log geral de alteracoes)
├── id, clinica_id (FK, nullable)
├── usuario_id, usuario_tipo
├── entidade, entidade_id, acao
├── dados_anteriores (JSON), dados_novos (JSON)
├── ip_address
└── created_at
```

### Enums

```
Especie: CANINO, FELINO, EQUINO, BOVINO, AVIAR, SILVESTRE, OUTRO
FormaFarmaceutica: CAPSULA, COMPRIMIDO, LIQUIDO, BISCOITO, PASTA, POMADA, OLEO, INJETAVEL, OUTRO
PrescricaoStatus: DRAFT, VALIDADA, ASSINADA, ENVIADA, CANCELADA
ValidacaoTipo: DENTRO_FAIXA, FORA_FAIXA_ACEITO, FORA_FAIXA_REJEITADO
ClinicaUsuarioRole: ADMIN_CLINICA, VETERINARIO, RECEPCIONISTA, FARMACEUTICO
UnidadeDose: MG, G, ML, MCG, UI
```

---

## C) ENDPOINTS DO MVP (Prioridade 1)

### Autenticacao
```
POST   /api/auth/login                    # Login (email + senha)
POST   /api/auth/refresh                  # Refresh token
POST   /api/auth/logout                   # Invalidar refresh token
POST   /api/auth/forgot-password          # Solicitar reset
POST   /api/auth/reset-password           # Resetar senha
GET    /api/auth/me                       # Perfil do usuario logado
```

### Tenant (Clinica)
```
POST   /api/tenants                       # Criar clinica (super-admin)
GET    /api/tenants/:id                   # Dados da clinica
PUT    /api/tenants/:id                   # Atualizar clinica
PATCH  /api/tenants/:id/branding          # Atualizar logo/cores
GET    /api/tenants/:id/config            # Configuracoes do tenant
```

### Usuarios da Clinica
```
POST   /api/usuarios                      # Criar usuario na clinica
GET    /api/usuarios                      # Listar usuarios da clinica
GET    /api/usuarios/:id                  # Detalhe usuario
PUT    /api/usuarios/:id                  # Atualizar usuario
DELETE /api/usuarios/:id                  # Desativar usuario
```

### Principios Ativos
```
POST   /api/principios-ativos             # Criar ativo
GET    /api/principios-ativos             # Listar (com filtros/busca)
GET    /api/principios-ativos/:id         # Detalhe com concentracoes e ranges
PUT    /api/principios-ativos/:id         # Atualizar ativo
DELETE /api/principios-ativos/:id         # Desativar ativo

POST   /api/principios-ativos/:id/concentracoes     # Adicionar concentracao
PUT    /api/principios-ativos/:id/concentracoes/:cid # Atualizar concentracao
DELETE /api/principios-ativos/:id/concentracoes/:cid # Remover concentracao

POST   /api/principios-ativos/:id/faixas             # Adicionar faixa terapeutica
PUT    /api/principios-ativos/:id/faixas/:fid        # Atualizar faixa
DELETE /api/principios-ativos/:id/faixas/:fid        # Remover faixa
```

### Tutores
```
POST   /api/tutores                       # Criar tutor
GET    /api/tutores                       # Listar (busca por nome/cpf)
GET    /api/tutores/:id                   # Detalhe com animais
PUT    /api/tutores/:id                   # Atualizar tutor
```

### Animais (Pacientes)
```
POST   /api/animais                       # Criar animal
GET    /api/animais                       # Listar (filtro por tutor)
GET    /api/animais/:id                   # Detalhe
PUT    /api/animais/:id                   # Atualizar (peso, etc)
```

### Protocolos (Prescricao Pronta - Modo A)
```
POST   /api/protocolos                    # Criar protocolo
GET    /api/protocolos                    # Listar (filtro por especie)
GET    /api/protocolos/:id                # Detalhe com itens
PUT    /api/protocolos/:id                # Atualizar
DELETE /api/protocolos/:id                # Desativar
```

### Prescricoes (Motor Principal)
```
POST   /api/prescricoes                   # Criar prescricao
GET    /api/prescricoes                   # Listar (filtros: status, data, vet, paciente)
GET    /api/prescricoes/:id               # Detalhe completo
PUT    /api/prescricoes/:id               # Atualizar (somente DRAFT)
DELETE /api/prescricoes/:id               # Cancelar prescricao

POST   /api/prescricoes/:id/validar       # Validar todos os itens contra ranges
POST   /api/prescricoes/:id/aceite        # Aceitar prescricao fora do range
POST   /api/prescricoes/:id/assinar       # Assinar (muda status)
GET    /api/prescricoes/:id/pdf           # Gerar/baixar PDF
POST   /api/prescricoes/:id/enviar        # Enviar ao tutor (email)

POST   /api/prescricoes/calcular          # Calcular totais (preview, sem salvar)
```

### Validacao (Logs Auditaveis)
```
GET    /api/validacoes                    # Listar logs (filtro por periodo, vet, tipo)
GET    /api/validacoes/:prescricaoId      # Logs de uma prescricao
```

---

## D) PLANO DE SPRINTS

### Sprint 1 (Semanas 1-2): Fundacao
- [x] Reestruturar projeto (modulos, middleware, error handling)
- [x] Novo schema Prisma com todas as tabelas do MVP
- [x] Migration + seeds (5 ativos, 3 protocolos)
- [x] Auth com JWT + refresh token + multi-tenant
- [x] Middleware de tenant (injeta clinica_id)
- [x] CRUD Clinica (tenant)
- [x] CRUD Usuarios da Clinica
- **Criterio de aceite**: Login funcional, tenant isolado, CRUD basico

### Sprint 2 (Semanas 3-4): Motor Clinico
- [ ] CRUD Principios Ativos + Concentracoes + Faixas
- [ ] CRUD Tutores + Animais
- [ ] CRUD Protocolos (prescricao pronta)
- [ ] Motor de Prescricao (criar, editar, modo A e B)
- [ ] Calculo automatico (frequencia x duracao = total)
- **Criterio de aceite**: Prescrever com calculo automatico

### Sprint 3 (Semanas 5-6): Validacao + PDF
- [ ] Motor de Validacao (check ranges, alerta, aceite)
- [ ] Log juridico auditavel (ValidacaoLog)
- [ ] Geracao de PDF white-label (PDFKit)
- [ ] Envio por email
- [ ] Testes unitarios e de integracao
- **Criterio de aceite**: Prescricao completa com validacao e PDF

### Sprint 4 (Semanas 7-8): Frontend MVP
- [ ] Telas de login e dashboard
- [ ] Cadastro de ativos (com concentracoes e ranges)
- [ ] Wizard de prescricao (modo A e B)
- [ ] Visualizacao de alertas e aceite
- [ ] Visualizacao e download de PDF
- **Criterio de aceite**: Fluxo completo pelo frontend

### Sprints Futuras (Prioridades 2-7)
- Sprint 5-6: Orcamento + Venda + Ordem de Producao
- Sprint 7-8: Estoque + XML
- Sprint 9-10: Financeiro (dupla tabela de preco)
- Sprint 11+: Portal do Tutor, Assinatura Digital, Lab/IA
