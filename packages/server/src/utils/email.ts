// Helper function to send generic emails
export async function sendEmail(options: {
    to: string;
    subject: string;
    html: string;
}) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        await resend.emails.send({
            from: 'PharmoPet <noreply@pharmopet.com.br>',
            to: options.to,
            subject: options.subject,
            html: options.html
        });
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
