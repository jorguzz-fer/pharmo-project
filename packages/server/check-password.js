const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPassword() {
    try {
        // Buscar "Lab 1"
        const clinica = await prisma.clinica.findFirst({
            where: {
                OR: [
                    { nome_fantasia: { contains: 'Lab 1', mode: 'insensitive' } },
                    { email: 'fer.jorge@gmail.com' }
                ]
            },
            select: {
                id: true,
                nome_fantasia: true,
                email: true,
                senha_hash: true,
                reset_token: true,
                reset_token_expires: true,
                updated_at: true
            }
        });

        if (!clinica) {
            console.log('❌ Clínica "Lab 1" não encontrada no banco LOCAL');
            console.log('⚠️  Você está testando em PRODUÇÃO, então o banco local não tem os dados.');
            console.log('');
            console.log('Para verificar em produção, você precisaria:');
            console.log('1. Acessar o banco de dados de produção');
            console.log('2. Ou verificar fazendo login com a nova senha');
            return;
        }

        console.log('\n✅ Clínica encontrada no banco LOCAL:\n');
        console.log('ID:', clinica.id);
        console.log('Nome:', clinica.nome_fantasia);
        console.log('Email:', clinica.email);
        console.log('Última atualização:', clinica.updated_at);
        console.log('');
        console.log('Senha Hash:', clinica.senha_hash ? '✅ EXISTE' : '❌ NÃO EXISTE');
        console.log('Reset Token:', clinica.reset_token ? '⚠️ Ainda tem token' : '✅ Token limpo');

        if (clinica.senha_hash) {
            console.log('');
            console.log('✅ SENHA FOI GRAVADA COM SUCESSO!');
            console.log('Hash (primeiros 30 chars):', clinica.senha_hash.substring(0, 30) + '...');
            console.log('');
            console.log('🔐 Para testar se funciona:');
            console.log('1. Acesse https://app.pharmopet.com.br/clinica/login');
            console.log('2. Use o email: fer.jorge@gmail.com');
            console.log('3. Use a senha que você acabou de definir');
        } else {
            console.log('\n❌ SENHA NÃO FOI GRAVADA!');
        }
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPassword();
