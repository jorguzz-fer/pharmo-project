import { whatsappService, getPharmoPetWhatsapp, type EnvioResultado } from './whatsapp.service';

class NotificationService {
    async notifyPrescriptionCreated(
        tutorPhone: string | null | undefined,
        tutorName: string,
        paymentLink: string
    ): Promise<EnvioResultado> {
        if (!tutorPhone) {
            return { enviado: false, motivo: 'Tutor não tem telefone cadastrado' };
        }
        return whatsappService.sendPrescriptionLink(tutorPhone, tutorName, paymentLink);
    }

    async notifyPaymentConfirmed(
        tutorPhone: string | null | undefined,
        tutorName: string,
        orderId: string
    ): Promise<EnvioResultado> {
        if (!tutorPhone) {
            return { enviado: false, motivo: 'Tutor não tem telefone cadastrado' };
        }
        return whatsappService.sendPaymentConfirmation(tutorPhone, tutorName, orderId);
    }

    /**
     * Manda para o WhatsApp da PharmoPet a cópia de uma prescrição recém-enviada.
     * É um aviso paralelo: nunca interfere no envio ao tutor.
     */
    async notifyPharmacyNewPrescription(dados: {
        tutor: string;
        animal: string;
        veterinario: string;
        valor?: number | null;
        link: string;
    }): Promise<EnvioResultado> {
        return whatsappService.sendPharmacyPrescriptionCopy(getPharmoPetWhatsapp(), dados);
    }
}

export const notificationService = new NotificationService();
