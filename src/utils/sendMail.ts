import { mailTransporter } from '@/config/mail'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}


export const sendEmail = async ({ to, subject, html }: SendEmailOptions) => {

  await mailTransporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  })
}
