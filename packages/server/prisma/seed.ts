import { PrismaClient, Especie, FormaFarmaceutica, UnidadeDose } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ============================================================
  // 1. Super Admin
  // ============================================================
  const adminSenha = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.adminUsuario.upsert({
    where: { email: 'admin@pharmopet.com.br' },
    update: {},
    create: {
      nome: 'Admin PharmoPet',
      email: 'admin@pharmopet.com.br',
      senha_hash: adminSenha,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('Super admin criado:', admin.email);

  // ============================================================
  // 2. Clinica Demo (Tenant)
  // ============================================================
  const clinicaSenha = await bcrypt.hash('clinica123', 12);
  const clinica = await prisma.clinica.upsert({
    where: { cnpj: '12345678000190' },
    update: {},
    create: {
      nome_fantasia: 'Clinica VetCare Demo',
      razao_social: 'VetCare Servicos Veterinarios LTDA',
      cnpj: '12345678000190',
      email: 'contato@vetcare-demo.com.br',
      telefone: '(11) 3456-7890',
      whatsapp: '(11) 99876-5432',
      cep: '01310-100',
      logradouro: 'Av. Paulista',
      numero: '1000',
      complemento: 'Sala 501',
      bairro: 'Bela Vista',
      cidade: 'Sao Paulo',
      estado: 'SP',
      cor_primaria: '#059669',
      cor_secundaria: '#047857',
    },
  });
  console.log('Clinica demo criada:', clinica.nome_fantasia);

  // ============================================================
  // 3. Veterinario + Usuario da Clinica
  // ============================================================
  const vet = await prisma.veterinario.upsert({
    where: { crmv_uf_crmv: { crmv: '12345', uf_crmv: 'SP' } },
    update: {},
    create: {
      nome: 'Dra. Ana Silva',
      cpf: '12345678901',
      crmv: '12345',
      uf_crmv: 'SP',
      email: 'ana.silva@vetcare-demo.com.br',
      telefone: '(11) 98765-4321',
      especialidades: ['Clinica Geral', 'Dermatologia'],
    },
  });

  const vetUsuario = await prisma.clinicaUsuario.upsert({
    where: { email: 'ana.silva@vetcare-demo.com.br' },
    update: {},
    create: {
      clinica_id: clinica.id,
      nome: 'Dra. Ana Silva',
      email: 'ana.silva@vetcare-demo.com.br',
      senha_hash: clinicaSenha,
      role: 'VETERINARIO',
      veterinario_id: vet.id,
    },
  });

  // Admin da clinica
  const adminClinica = await prisma.clinicaUsuario.upsert({
    where: { email: 'admin@vetcare-demo.com.br' },
    update: {},
    create: {
      clinica_id: clinica.id,
      nome: 'Carlos Admin',
      email: 'admin@vetcare-demo.com.br',
      senha_hash: clinicaSenha,
      role: 'ADMIN_CLINICA',
    },
  });
  console.log('Usuarios criados:', vetUsuario.email, adminClinica.email);

  // ============================================================
  // 4. Tutores + Animais
  // ============================================================
  const tutor1 = await prisma.tutor.create({
    data: {
      clinica_id: clinica.id,
      nome: 'Maria Souza',
      cpf: '98765432100',
      email: 'maria@email.com',
      telefone: '(11) 91234-5678',
      whatsapp: '(11) 91234-5678',
      cidade: 'Sao Paulo',
      estado: 'SP',
    },
  });

  const tutor2 = await prisma.tutor.create({
    data: {
      clinica_id: clinica.id,
      nome: 'Joao Pereira',
      cpf: '11122233344',
      email: 'joao@email.com',
      telefone: '(11) 98888-7777',
      cidade: 'Sao Paulo',
      estado: 'SP',
    },
  });

  const rex = await prisma.animal.create({
    data: {
      clinica_id: clinica.id,
      tutor_id: tutor1.id,
      nome: 'Rex',
      especie: 'CANINO',
      raca: 'Labrador',
      sexo: 'MACHO',
      peso_kg: 32.5,
      data_nascimento: new Date('2020-03-15'),
    },
  });

  const mimi = await prisma.animal.create({
    data: {
      clinica_id: clinica.id,
      tutor_id: tutor1.id,
      nome: 'Mimi',
      especie: 'FELINO',
      raca: 'Persa',
      sexo: 'FEMEA',
      peso_kg: 4.2,
      data_nascimento: new Date('2021-07-20'),
    },
  });

  const thor = await prisma.animal.create({
    data: {
      clinica_id: clinica.id,
      tutor_id: tutor2.id,
      nome: 'Thor',
      especie: 'CANINO',
      raca: 'Golden Retriever',
      sexo: 'MACHO',
      peso_kg: 28.0,
      data_nascimento: new Date('2019-11-01'),
    },
  });
  console.log('Tutores e animais criados');

  // ============================================================
  // 5. Principios Ativos (5 com ranges e concentracoes)
  // ============================================================

  // 1. Prednisolona
  const prednisolona = await prisma.principioAtivo.create({
    data: {
      nome_padronizado: 'Prednisolona',
      classe_terapeutica: 'Corticosteroide',
      controlado: false,
      descricao_palatavel: 'Anti-inflamatorio potente usado para alergias, doencas autoimunes e inflamacoes.',
      concentracoes: {
        create: [
          { valor: 5, unidade: 'MG', forma_farmaceutica: 'COMPRIMIDO' },
          { valor: 10, unidade: 'MG', forma_farmaceutica: 'COMPRIMIDO' },
          { valor: 20, unidade: 'MG', forma_farmaceutica: 'COMPRIMIDO' },
          { valor: 5, unidade: 'MG', forma_farmaceutica: 'CAPSULA' },
        ],
      },
      faixas_terapeuticas: {
        create: [
          {
            especie: 'CANINO',
            dose_min_mg_kg: 0.5,
            dose_max_mg_kg: 2.0,
            frequencia_horas: 12,
            fonte_referencia: "Plumb's Veterinary Drug Handbook, 9th Ed.",
            observacoes: 'Anti-inflamatorio: 0.5-1mg/kg; Imunossupressor: 1-2mg/kg',
          },
          {
            especie: 'FELINO',
            dose_min_mg_kg: 0.5,
            dose_max_mg_kg: 2.0,
            frequencia_horas: 12,
            fonte_referencia: "Plumb's Veterinary Drug Handbook, 9th Ed.",
          },
        ],
      },
    },
  });

  // 2. Amoxicilina + Clavulanato
  const amoxiClav = await prisma.principioAtivo.create({
    data: {
      nome_padronizado: 'Amoxicilina + Clavulanato',
      classe_terapeutica: 'Antibiotico',
      controlado: false,
      descricao_palatavel: 'Antibiotico de amplo espectro para infeccoes bacterianas.',
      concentracoes: {
        create: [
          { valor: 50, unidade: 'MG', forma_farmaceutica: 'COMPRIMIDO' },
          { valor: 125, unidade: 'MG', forma_farmaceutica: 'COMPRIMIDO' },
          { valor: 250, unidade: 'MG', forma_farmaceutica: 'COMPRIMIDO' },
          { valor: 50, unidade: 'MG', forma_farmaceutica: 'LIQUIDO' },
        ],
      },
      faixas_terapeuticas: {
        create: [
          {
            especie: 'CANINO',
            dose_min_mg_kg: 12.5,
            dose_max_mg_kg: 25.0,
            frequencia_horas: 12,
            fonte_referencia: 'BSAVA Small Animal Formulary, 10th Ed.',
          },
          {
            especie: 'FELINO',
            dose_min_mg_kg: 12.5,
            dose_max_mg_kg: 25.0,
            frequencia_horas: 12,
            fonte_referencia: 'BSAVA Small Animal Formulary, 10th Ed.',
          },
        ],
      },
    },
  });

  // 3. Omeprazol
  const omeprazol = await prisma.principioAtivo.create({
    data: {
      nome_padronizado: 'Omeprazol',
      classe_terapeutica: 'Inibidor de Bomba de Protons',
      controlado: false,
      descricao_palatavel: 'Protege o estomago reduzindo a producao de acido gastrico.',
      concentracoes: {
        create: [
          { valor: 10, unidade: 'MG', forma_farmaceutica: 'CAPSULA' },
          { valor: 20, unidade: 'MG', forma_farmaceutica: 'CAPSULA' },
        ],
      },
      faixas_terapeuticas: {
        create: [
          {
            especie: 'CANINO',
            dose_min_mg_kg: 0.7,
            dose_max_mg_kg: 1.5,
            frequencia_horas: 24,
            fonte_referencia: "Plumb's Veterinary Drug Handbook",
          },
          {
            especie: 'FELINO',
            dose_min_mg_kg: 0.7,
            dose_max_mg_kg: 1.0,
            frequencia_horas: 24,
            fonte_referencia: "Plumb's Veterinary Drug Handbook",
          },
        ],
      },
    },
  });

  // 4. Gabapentina (controlado)
  const gabapentina = await prisma.principioAtivo.create({
    data: {
      nome_padronizado: 'Gabapentina',
      classe_terapeutica: 'Analgesico / Anticonvulsivante',
      controlado: true,
      descricao_palatavel: 'Medicamento para dor neuropatica e crises convulsivas. Requer receita controlada.',
      concentracoes: {
        create: [
          { valor: 25, unidade: 'MG', forma_farmaceutica: 'CAPSULA' },
          { valor: 50, unidade: 'MG', forma_farmaceutica: 'CAPSULA' },
          { valor: 100, unidade: 'MG', forma_farmaceutica: 'CAPSULA' },
          { valor: 25, unidade: 'MG', forma_farmaceutica: 'LIQUIDO' },
        ],
      },
      faixas_terapeuticas: {
        create: [
          {
            especie: 'CANINO',
            dose_min_mg_kg: 5.0,
            dose_max_mg_kg: 10.0,
            frequencia_horas: 8,
            fonte_referencia: "Plumb's Veterinary Drug Handbook",
            observacoes: 'Iniciar com dose baixa e titular. Monitorar sedacao.',
          },
          {
            especie: 'FELINO',
            dose_min_mg_kg: 3.0,
            dose_max_mg_kg: 10.0,
            frequencia_horas: 8,
            fonte_referencia: "Plumb's Veterinary Drug Handbook",
            observacoes: 'Felinos podem ser mais sensiveis. Evitar formulacoes com xilitol.',
          },
        ],
      },
    },
  });

  // 5. Cefalexina
  const cefalexina = await prisma.principioAtivo.create({
    data: {
      nome_padronizado: 'Cefalexina',
      classe_terapeutica: 'Antibiotico - Cefalosporina 1a geracao',
      controlado: false,
      descricao_palatavel: 'Antibiotico para infeccoes de pele, urinarias e respiratorias.',
      concentracoes: {
        create: [
          { valor: 75, unidade: 'MG', forma_farmaceutica: 'COMPRIMIDO' },
          { valor: 150, unidade: 'MG', forma_farmaceutica: 'COMPRIMIDO' },
          { valor: 300, unidade: 'MG', forma_farmaceutica: 'COMPRIMIDO' },
          { valor: 50, unidade: 'MG', forma_farmaceutica: 'LIQUIDO' },
        ],
      },
      faixas_terapeuticas: {
        create: [
          {
            especie: 'CANINO',
            dose_min_mg_kg: 15.0,
            dose_max_mg_kg: 30.0,
            frequencia_horas: 12,
            fonte_referencia: 'BSAVA Small Animal Formulary',
          },
          {
            especie: 'FELINO',
            dose_min_mg_kg: 15.0,
            dose_max_mg_kg: 30.0,
            frequencia_horas: 12,
            fonte_referencia: 'BSAVA Small Animal Formulary',
          },
        ],
      },
    },
  });

  console.log('5 principios ativos criados com concentracoes e faixas');

  // ============================================================
  // 6. Protocolos (3 prescricoes prontas)
  // ============================================================

  const predConc = await prisma.principioAtivoConcentracao.findFirst({
    where: { principio_ativo_id: prednisolona.id, valor: 5, forma_farmaceutica: 'COMPRIMIDO' },
  });
  const amoxConc = await prisma.principioAtivoConcentracao.findFirst({
    where: { principio_ativo_id: amoxiClav.id, valor: 125, forma_farmaceutica: 'COMPRIMIDO' },
  });
  const omeConc = await prisma.principioAtivoConcentracao.findFirst({
    where: { principio_ativo_id: omeprazol.id, valor: 10, forma_farmaceutica: 'CAPSULA' },
  });
  const cefaConc = await prisma.principioAtivoConcentracao.findFirst({
    where: { principio_ativo_id: cefalexina.id, valor: 150, forma_farmaceutica: 'COMPRIMIDO' },
  });

  // Protocolo 1: Dermatite Bacteriana
  await prisma.protocolo.create({
    data: {
      clinica_id: clinica.id,
      codigo: 'DERM-001',
      nome: 'Protocolo Dermatite Bacteriana',
      descricao: 'Tratamento padrao para piodermite superficial em caes',
      especie_alvo: 'CANINO',
      indicacao: 'Piodermite superficial, dermatite bacteriana',
      itens: {
        create: [
          {
            principio_ativo_id: cefalexina.id,
            concentracao_id: cefaConc?.id,
            dose_mg_kg: 22,
            frequencia_horas: 12,
            duracao_dias: 21,
            observacoes: 'Manter tratamento por minimo 7 dias apos resolucao clinica',
            ordem: 0,
          },
          {
            principio_ativo_id: prednisolona.id,
            concentracao_id: predConc?.id,
            dose_mg_kg: 0.5,
            frequencia_horas: 24,
            duracao_dias: 7,
            observacoes: 'Dose anti-inflamatoria. Reduzir gradualmente.',
            ordem: 1,
          },
        ],
      },
    },
  });

  // Protocolo 2: Gastroenterite
  await prisma.protocolo.create({
    data: {
      clinica_id: clinica.id,
      codigo: 'GI-001',
      nome: 'Protocolo Gastroenterite',
      descricao: 'Tratamento para gastroenterite aguda com infeccao secundaria',
      especie_alvo: 'CANINO',
      indicacao: 'Gastroenterite aguda, vomitos e diarreia',
      itens: {
        create: [
          {
            principio_ativo_id: amoxiClav.id,
            concentracao_id: amoxConc?.id,
            dose_mg_kg: 20,
            frequencia_horas: 12,
            duracao_dias: 10,
            observacoes: 'Administrar com alimento',
            ordem: 0,
          },
          {
            principio_ativo_id: omeprazol.id,
            concentracao_id: omeConc?.id,
            dose_mg_kg: 1.0,
            frequencia_horas: 24,
            duracao_dias: 14,
            observacoes: 'Administrar em jejum, 30min antes da alimentacao',
            ordem: 1,
          },
        ],
      },
    },
  });

  // Protocolo 3: Dor Cronica (global)
  await prisma.protocolo.create({
    data: {
      clinica_id: null,
      codigo: 'DOR-001',
      nome: 'Protocolo Dor Cronica',
      descricao: 'Manejo de dor neuropatica cronica',
      especie_alvo: 'CANINO',
      indicacao: 'Dor cronica, neuropatia, pos-operatorio prolongado',
      itens: {
        create: [
          {
            principio_ativo_id: gabapentina.id,
            dose_mg_kg: 5,
            frequencia_horas: 8,
            duracao_dias: 30,
            observacoes: 'Iniciar com dose baixa. CONTROLADO - requer receita especial.',
            ordem: 0,
          },
          {
            principio_ativo_id: omeprazol.id,
            concentracao_id: omeConc?.id,
            dose_mg_kg: 1.0,
            frequencia_horas: 24,
            duracao_dias: 30,
            observacoes: 'Protecao gastrica durante tratamento prolongado',
            ordem: 1,
          },
        ],
      },
    },
  });

  console.log('3 protocolos criados');

  console.log('\n========================================');
  console.log('Seed completo!');
  console.log('========================================');
  console.log('\nCredenciais de acesso:');
  console.log('Super Admin: admin@pharmopet.com.br / admin123456');
  console.log('Veterinaria: ana.silva@vetcare-demo.com.br / clinica123');
  console.log('Admin Clinica: admin@vetcare-demo.com.br / clinica123');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
