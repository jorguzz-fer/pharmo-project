import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.usuarioAdmin.upsert({
        where: { email: 'admin@pharmo.com' },
        update: {},
        create: {
            nome: 'Administrador',
            email: 'admin@pharmo.com',
            senha_hash: adminPassword,
            role: 'ADMIN',
        },
    });
    console.log('✅ Admin user created:', admin.email);

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
