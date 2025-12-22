export class WhatsappService {
    private apiUrl: string;
    private token: string;

    constructor() {
        this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
        this.token = process.env.WHATSAPP_TOKEN || 'mock_token';
    }

    async sendText(to: string, message: string): Promise<boolean> {
        // Debug log to use private vars (cleaner than @ts-ignore for mock)
        // console.log(`[DEBUG] API: ${this.apiUrl} Token: ${this.token}`);
        console.log(`[WHATSAPP] Sending to ${to}: "${message}" using ${this.apiUrl} and ${this.token}`);
        // In production: axios.post(`${this.apiUrl}/messages`, { ... })
        return true;
    }

    async sendPrescriptionLink(to: string, tutorName: string, link: string): Promise<boolean> {
        const message = `Olá ${tutorName}, sua receita digital da Pharmo está pronta! Acesse e faça seu pedido aqui: ${link}`;
        return this.sendText(to, message);
    }

    async sendPaymentConfirmation(to: string, tutorName: string, orderId: string): Promise<boolean> {
        const message = `Olá ${tutorName}, confirmamos o pagamento do seu pedido #${orderId}. Em breve iniciaremos a manipulação! 🐾`;
        return this.sendText(to, message);
    }
}

export const whatsappService = new WhatsappService();
