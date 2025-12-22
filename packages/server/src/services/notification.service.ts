import { whatsappService } from './whatsapp.service';

class NotificationService {
    async notifyPrescriptionCreated(tutorPhone: string, tutorName: string, paymentLink: string) {
        // Logic to format phone number if needed
        await whatsappService.sendPrescriptionLink(tutorPhone, tutorName, paymentLink);
    }

    async notifyPaymentConfirmed(tutorPhone: string, tutorName: string, orderId: string) {
        await whatsappService.sendPaymentConfirmation(tutorPhone, tutorName, orderId);
    }
}

export const notificationService = new NotificationService();
