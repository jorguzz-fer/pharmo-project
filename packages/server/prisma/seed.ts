import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.usuarioAdmin.upsert({
        where: { email: 'admin@pharmo.com' },
        update: {},
        create: {
            email: 'admin@pharmo.com',
            nome: 'Administrador Principal',
            senha_hash: adminPassword,
            role: UserRole.ADMIN,
        },
    });
    console.log(`👤 Admin user created: ${admin.email}`);

    // 2. Doenças do Bulário (10 exemplos)
    const doencas = [
        {
            doenca: 'Otite Externa',
            principio_ativo: 'Ciprofloxacina + Betametasona + Clotrimazol',
            concentracao: '0.1%',
            posologia: 'Aplicar 5 gotas no ouvido afetado a cada 12 horas por 7 dias.',
            contraindicacoes: 'Ruptura timpânica.',
        },
        {
            doenca: 'Dermatite Atópica',
            principio_ativo: 'Oclacitinib',
            concentracao: '5.4mg',
            posologia: '0.4 a 0.6 mg/kg a cada 12 horas por 14 dias.',
            contraindicacoes: 'Cães com menos de 12 meses.',
        },
        {
            doenca: 'Giardíase',
            principio_ativo: 'Giardicid (Metronidazol + Sulfadimetoxina)',
            concentracao: '50mg/ml',
            posologia: '0.5ml por kg a cada 12 horas por 5 dias.',
            contraindicacoes: 'Fêmeas gestantes.',
        },
        {
            doenca: 'Verminoses Gerais',
            principio_ativo: 'Drontal (Praziquantel + Pirantel + Febantel)',
            concentracao: 'Comprimido 10kg',
            posologia: '1 comprimido para cada 10kg de peso vivo.',
            contraindicacoes: 'Filhotes com menos de 2 semanas.',
        },
        {
            doenca: 'Infecção Bacteriana de Pele',
            principio_ativo: 'Cefalexina',
            concentracao: '250mg',
            posologia: '30mg/kg a cada 12 horas por 7-14 dias.',
            contraindicacoes: 'Animais alérgicos a penicilinas.',
        },
        {
            doenca: 'Dor e Inflamação (Pós-op)',
            principio_ativo: 'Meloxicam',
            concentracao: '0.2%',
            posologia: '0.2mg/kg (dose inicial), depois 0.1mg/kg a cada 24 horas.',
            contraindicacoes: 'Insuficiência renal ou hepática.',
        },
        {
            doenca: 'Sarna Sarcóptica',
            principio_ativo: 'Bravecto (Fluralaner)',
            concentracao: 'Comprimido mastigável',
            posologia: 'Dose única de acordo com o peso.',
            contraindicacoes: 'Hipersensibilidade ao componente.',
        },
        {
            doenca: 'Cardiomiopatia Dilatada',
            principio_ativo: 'Vetmedin (Pimobendan)',
            concentracao: '5mg',
            posologia: '0.25mg/kg a cada 12 horas.',
            contraindicacoes: 'Estenose aórtica.',
        },
        {
            doenca: 'Gastrite Aguda',
            principio_ativo: 'Omeprazol',
            concentracao: '20mg',
            posologia: '1mg/kg a cada 24 horas por 7 dias.',
            contraindicacoes: 'Nenhuma significativa.',
        },
        {
            doenca: 'Ansiedade de Separação',
            principio_ativo: 'Fluoxetina',
            concentracao: '20mg',
            posologia: '1mg/kg a cada 24 horas (uso contínuo).',
            contraindicacoes: 'Histórico de convulsões.',
        },
    ];

    for (const d of doencas) {
        await prisma.bulario.create({
            data: d,
        });
    }
    console.log(`📚 Bulário seeded with ${doencas.length} diseases.`);

    console.log('✅ Seed finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
