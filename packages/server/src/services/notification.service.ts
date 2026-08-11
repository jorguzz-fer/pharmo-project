import { whatsappService, type EnvioResultado } from './whatsapp.service';

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
}

export const notificationService = new NotificationService();
