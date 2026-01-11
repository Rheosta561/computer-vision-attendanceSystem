import { mailTransporter } from '@/config/mail';
export const sendEmail = async ({ to, subject, html }) => {
    await mailTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
    });
};
