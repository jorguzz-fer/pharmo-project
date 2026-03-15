import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.usuarioAdmin.upsert({
        where: { email: 'admin@teste.com' },
        update: {
            senha_hash: adminPassword, // Update password if exists
        },
        create: {
            nome: 'Administrador',
            email: 'admin@teste.com',
            senha_hash: adminPassword,
            role: 'ADMIN',
        },
    });
    console.log('✅ Admin user created/updated:', admin.email);

    // Create Test Veterinarian
    const vetPassword = await bcrypt.hash('vet123', 10);
    const vet = await prisma.veterinario.upsert({
        where: { crv: 'SP-12345' },
        update: {},
        create: {
            nome: 'Dr. Fernando Jorge',
            crv: 'SP-12345',
            email: 'vet@pharmo.com',
            telefone: '(11) 98765-4321',
            senha_hash: vetPassword,
        },
    });
    console.log('✅ Veterinarian created:', vet.crv);

    // Create Test Clinic
    const clinicaPassword = await bcrypt.hash('clinica123', 10);
    const clinica = await prisma.clinica.upsert({
        where: { cnpj: '12.345.678/0001-90' },
        update: {
            senha_hash: clinicaPassword,
        },
        create: {
            nome_fantasia: 'Clínica Vet Teste',
            razao_social: 'Clínica Veterinária Teste LTDA',
            cnpj: '12.345.678/0001-90',
            email: 'clinica@teste.com',
            telefone: '(11) 3456-7890',
            whatsapp: '(11) 91234-5678',
            cep: '01310-100',
            logradouro: 'Av. Paulista',
            numero: '1000',
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            estado: 'SP',
            responsavel_legal: 'Fernando Jorge',
            cpf_responsavel: '123.456.789-00',
            senha_hash: clinicaPassword,
            status: 'APROVADA',
        },
    });
    console.log('✅ Clinic created:', clinica.nome_fantasia);

    // Link vet to clinic
    await prisma.clinicaVeterinario.upsert({
        where: {
            clinica_id_veterinario_id: {
                clinica_id: clinica.id,
                veterinario_id: vet.id,
            },
        },
        update: {},
        create: {
            clinica_id: clinica.id,
            veterinario_id: vet.id,
            cargo: 'Veterinário',
            status: 'ativo',
        },
    });
    console.log('✅ Vet linked to clinic');

    console.log('🎉 Seed completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
