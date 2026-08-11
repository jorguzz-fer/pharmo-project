# Análise: Reunião × Implementação atual

Comparação item a item entre o que foi acordado na reunião (transcrição) e o que existe hoje no
código deste repositório.

Legenda: ✅ implementado · 🟡 parcial · ❌ não implementado

Resumo: **o núcleo clínico está pronto** (bulário, IA, motor de precificação, PDF com marca da
clínica, alerta de controlado, painel admin). **Toda a ponta de conversão continua mockada**
(envio ao tutor, pagamento, integração com a operação) e os dois pedidos de maior prazo
(WhatsApp 24h e e-commerce) não foram iniciados.

---

## 1. Front-end rápido de prescrição/orçamento (prioridade nº 1 da reunião)

| # | Pedido na reunião | Status | Onde está |
|---|---|---|---|
| 1.1 | Bulário magistral: vet digita a doença e o sistema puxa as formulações | ✅ | `BularioMagistral` + `GET /bulario/buscar` (busca por `doenca`) + assistente IA com RAG (`ai-assistant.service.ts`) |
| 1.2 | Vet pode acrescentar/alterar algo na formulação | ✅ | `MagistralBuilder.tsx` |
| 1.3 | Variação da dose pelo **peso** do animal | 🟡 | Base existe (`RangeTerapeutico`, `POST /validacao/dosagem`, `LogCiencia`), mas **não está ligada ao wizard** — ver "Pendências críticas" |
| 1.4 | Forma farmacêutica **obrigatória** (cápsula, biscoito, suspensão, pasta…) | ✅ | `StepMedication.tsx` (`register('form', { required: true })`) alimentado por `FormaFarmaceutica`; `RegraExcecao` cobre "não faz em pasta" |
| 1.5 | Explicar ao vet os **benefícios de cada forma** ("dá as opções explicando quais os benefícios") | ❌ | O select mostra só o nome da forma. Nenhum texto de apoio |
| 1.6 | Explicação clínica na tela: por que a fórmula é indicada, mecanismo, efeito terapêutico esperado | 🟡 | A IA gera texto livre; o campo `PrincipioAtivo.texto_palatavel` existe no banco mas **não aparece em nenhuma tela** |
| 1.7 | Alerta de medicamento controlado / antimicrobiano | ✅ | `POST /insumos/verificar-controlado` + alerta em `StepMedication.tsx` + exigência de nº de Notificação de Receita no `create` |
| 1.8 | Campo de doença gravado na prescrição | ❌ | `StepReview.tsx:113` envia `doenca: ''` com um `// TODO` |

## 2. O documento da prescrição

| # | Pedido | Status | Onde está |
|---|---|---|---|
| 2.1 | Dados obrigatórios (tutor, animal, peso, CRMV) | ✅ | `pdf.service.ts` + `StepTutor`/`StepAnimal` |
| 2.2 | Máscara/pré-preenchimento por cliente: logo, endereço e dados da clínica na receita | ✅ | `Clinica.logo_url` + endereço, upload em `clinica-logo.controller.ts`, renderizado no cabeçalho do PDF |
| 2.3 | Carimbo / assinatura | 🟡 | Linha de assinatura + CRMV impressos (assinatura manual). **Assinatura digital homologada (padrão Memed/Vet Smart) não existe** |
| 2.4 | Validade da prescrição (varia por tipo) | ❌ | Sem campo no schema. O PDF imprime `"Válido por 24 horas"` fixo, o que não corresponde a nenhuma regra real |
| 2.5 | Retenção da via de controlado + logística de recolhimento | ❌ | Nada no schema nem no fluxo |
| 2.6 | Etiqueta/carimbo da **PharmoPet** com telefone, para o tutor fechar depois | ❌ | O PDF traz os contatos da clínica, não os da farmácia |

## 3. Envio ao tutor e conversão (modelo Memed)

| # | Pedido | Status | Realidade no código |
|---|---|---|---|
| 3.1 | Tutor recebe a prescrição no celular (SMS/WhatsApp) com link | ❌ | `whatsapp.service.ts` é um stub: só `console.log`. `POST /prescricoes/:id/enviar` apenas muda o status para `SENT` e loga `[WHATSAPP MOCK]` |
| 3.2 | Link público que o tutor abre e pode encaminhar | ❌ | Não existe rota pública. `OrderStatus` está dentro das rotas protegidas do veterinário |
| 3.3 | Preço já sai junto da prescrição | 🟡 | Aparece na tela do vet, mas não chega ao tutor (não há envio) |

> ⚠️ Hoje a tela de sucesso afirma ao veterinário: *"O link de pagamento e a receita foram enviados
> para o WhatsApp do tutor"* (`StepReview.tsx:157`). Isso **não acontece**. É a inconsistência mais
> visível para o usuário final.

## 4. Pagamento

| # | Pedido | Status | Realidade |
|---|---|---|---|
| 4.1 | Gateway / checkout para o vet volante mandar a cobrança | ❌ | `payment.controller.ts` gera link fake (`https://pay.pharmo.com.br/txn_...`) e código PIX fictício. Nenhum SDK de gateway nas dependências |
| 4.2 | Validação de pagamento antes de subir para a operação | 🟡 | `POST /pagamentos/webhook` implementa todo o fluxo (paga → pedido → produção → follow-up), mas sem gateway real e **sem validação de assinatura** do webhook |
| 4.3 | Fluxo de balcão/maquininha na clínica | ❌ | Não há registro de pagamento presencial/manual |

## 5. Preço (motor de precificação)

| # | Pedido | Status | Onde está |
|---|---|---|---|
| 5.1 | Cálculo magistral (insumo × markup, taxa de manipulação, embalagem, desconto do parceiro, adicional entrega/biscoito) | ✅ | `precificacao.service.ts`, condições comerciais por clínica no schema, usado no wizard |
| 5.2 | Preço calculado vira o orçamento | ❌ | **Bug**: `prescricao.controller.ts` grava `mockPrice = 150 + random*100` no `Orcamento`. O valor mostrado ao vet não é o que vai para pagamento |

## 6. Integração com a operação (Prisma Five)

| # | Pedido | Status | Realidade |
|---|---|---|---|
| 6.1 | Pedido pago sobe automaticamente para a produção | ❌ | `prismaFive.service.ts` é mock: retorna `OS-<número aleatório>`. Como o Marcos previu, o sistema é fechado — continua pendente descobrir se há API |
| 6.2 | Painel interno (pedidos, follow-ups, relatórios, clínicas, vets, insumos) | ✅ | Rotas `/admin/*` completas |

## 7. IA no WhatsApp (24h) e canal de dúvidas

| # | Pedido | Status | Realidade |
|---|---|---|---|
| 7.1 | IA no WhatsApp gerando orçamento 24h, conectada ao gateway | ❌ | Não existe webhook de entrada de WhatsApp. A tabela `ConversaIA` existe no schema e **nunca é lida nem escrita** |
| 7.2 | Canal de dúvidas clínicas do veterinário pela IA | 🟡 | Existe dentro do app web (`POST /assistente/consultar`), não no WhatsApp |
| 7.3 | Escalonamento: IA não resolveu → farmacêutico/veterinário humano | ❌ | Sem fila, sem encaminhamento, sem e-mail para o vet interno |

## 8. E-commerce (prioridade declarada, prazo mais longo)

❌ Não iniciado. Nenhum catálogo público, carrinho, checkout ou área do tutor. Coerente com a
prioridade acordada na reunião (o e-commerce ficou explicitamente para depois), mas registrado aqui
porque a reunião pediu que o sistema de prescrição já nascesse **integrável** com ele.

---

## Pendências críticas (quebram o fluxo hoje, não são "features futuras")

1. **Preço aleatório no orçamento** — `prescricao.controller.ts` ignora o motor de precificação e
   grava um valor randômico. O motor está pronto; falta só receber e persistir o valor calculado.
2. **Só o primeiro medicamento é salvo** — `StepReview.tsx` envia `medications[0]` e o `create`
   nunca popula a tabela `PrescricaoMedicamento`. Prescrição com 2+ fórmulas perde o resto.
3. **Validação de dose por peso desligada** — `CienciaModal.tsx` não é importado em lugar nenhum e
   o wizard não chama `POST /validacao/dosagem`. Isso é justamente a "inteligência do peso" que o
   Marcos e o Cleber pediram, e o `LogCiencia` (auditoria jurídica) nunca é gravado.
4. **Mensagem falsa de envio ao tutor** — o vet é informado de um envio por WhatsApp que não ocorre.
5. **Campo `doenca` sempre vazio** — impede relatório por doença e o aprendizado do bulário.

## Sugestão de ordem de ataque

Considerando o prazo da reunião (funcionando em janeiro):

1. Fechar as 5 pendências críticas acima — é o que faz o fluxo atual ser verdadeiro ponta a ponta.
2. Gateway de pagamento real + link público do tutor (destrava o "vet volante" e o Memed-like).
3. Envio real por WhatsApp da prescrição + link de pagamento.
4. Assinatura digital, validade e retenção de via de controlado.
5. Bot de WhatsApp 24h com escalonamento para humano.
6. E-commerce e integração Prisma Five (dependem de decisão externa: API do Prisma Five e logística).
