export interface EnvioResultado {
    enviado: boolean;
    /** Motivo do não-envio, quando enviado = false */
    motivo?: string;
}

/**
 * Integração com a WhatsApp Cloud API (Meta).
 *
 * Sem credenciais configuradas o serviço NÃO finge ter enviado: retorna
 * enviado=false com o motivo, e quem chamou decide o que dizer ao usuário.
 * Configure WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID para ativar o envio real.
 */
export class WhatsappService {
    private apiUrl: string;
    private token: string;
    private phoneNumberId: string;

    constructor() {
        this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
        this.token = process.env.WHATSAPP_TOKEN || '';
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    }

    get configurado(): boolean {
        return Boolean(this.token && this.phoneNumberId);
    }

    /** Normaliza para o formato E.164 esperado pela API (Brasil: 55 + DDD + número) */
    private normalizarTelefone(telefone: string): string | null {
        const digitos = telefone.replace(/\D/g, '');
        if (digitos.length < 10) return null;
        return digitos.startsWith('55') ? digitos : `55${digitos}`;
    }

    async sendText(to: string, message: string): Promise<EnvioResultado> {
        if (!this.configurado) {
            console.warn('[WHATSAPP] Envio ignorado: WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID não configurados');
            return { enviado: false, motivo: 'Integração de WhatsApp não configurada' };
        }

        const destino = this.normalizarTelefone(to);
        if (!destino) {
            return { enviado: false, motivo: 'Telefone do destinatário inválido' };
        }

        try {
            const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: destino,
                    type: 'text',
                    text: { body: message },
                }),
            });

            if (!response.ok) {
                const corpo = await response.text().catch(() => '');
                console.error(`[WHATSAPP] Falha ${response.status}: ${corpo}`);
                return { enviado: false, motivo: `WhatsApp recusou o envio (HTTP ${response.status})` };
            }

            return { enviado: true };
        } catch (error: any) {
            console.error('[WHATSAPP] Erro de rede:', error?.message);
            return { enviado: false, motivo: 'Falha de comunicação com o WhatsApp' };
        }
    }

    async sendPrescriptionLink(to: string, tutorName: string, link: string): Promise<EnvioResultado> {
        const message = `Olá ${tutorName}, sua receita digital da Pharmo está pronta! Acesse e faça seu pedido aqui: ${link}`;
        return this.sendText(to, message);
    }

    async sendPaymentConfirmation(to: string, tutorName: string, orderId: string): Promise<EnvioResultado> {
        const message = `Olá ${tutorName}, confirmamos o pagamento do seu pedido #${orderId}. Em breve iniciaremos a manipulação! 🐾`;
        return this.sendText(to, message);
    }
}

export const whatsappService = new WhatsappService();
