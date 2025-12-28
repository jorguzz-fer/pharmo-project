// Script para testar endpoint de follow-ups
// Execute no console do navegador quando estiver logado como admin

async function testFollowUps() {
    const token = localStorage.getItem('pharmo-auth-storage');
    if (!token) {
        console.error('❌ Não autenticado');
        return;
    }

    const parsed = JSON.parse(token);
    const authToken = parsed.state?.token;

    console.log('🔍 Testando endpoint de follow-ups...');
    console.log('Token:', authToken ? '✅ Presente' : '❌ Ausente');

    const API_URL = 'https://api.pharmopet.com.br';

    try {
        const response = await fetch(`${API_URL}/admin/follow-ups`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Status da resposta:', response.status);

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ Erro:', error);
            return;
        }

        const data = await response.json();
        console.log('📦 Dados recebidos:', data);

        // Verificar estrutura
        if (data.paymentFollowUps !== undefined) {
            console.log('✅ Estrutura NOVA (com abas)');
            console.log('   - Payment Follow-ups:', data.paymentFollowUps?.length || 0);
            console.log('   - Pending Approvals:', data.pendingApprovals?.length || 0);
            console.log('   - Summary:', data.summary);
        } else if (Array.isArray(data)) {
            console.log('⚠️ Estrutura ANTIGA (array simples)');
            console.log('   - Total items:', data.length);
        } else {
            console.log('❓ Estrutura desconhecida:', typeof data);
        }

        return data;
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
    }
}

// Executar teste
testFollowUps();
