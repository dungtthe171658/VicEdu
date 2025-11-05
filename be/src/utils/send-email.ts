import {config} from "../config";
import sgMail from '@sendgrid/mail';
import {logger} from "./logger";

let emailEnabled = false;
try {
  const key = (config.send_grid.api_key || '') as string;
  if (key && key.startsWith('SG.')) {
    sgMail.setApiKey(key);
    emailEnabled = true;
  } else {
    logger.warn('SendGrid disabled: missing or invalid API key');
  }
} catch (err) {
  logger.warn('SendGrid initialization failed; email sending disabled');
}
export const SendEmail = {
    sendBasicEmail: async ({ to, subject, text, html }: { to: string, subject: string, text?: string, html?: string }) => {
        try {
            const mailData: any = {
                to,
                from: {
                    email: config.send_grid.email_from as string,
                    name: config.app_name,
                },
                subject,
            };
            if (typeof text === 'string') mailData.text = text;
            // Prefer provided html, fallback to text when available
            if (typeof html === 'string') mailData.html = html;
            else if (typeof text === 'string') mailData.html = text;

            if (!emailEnabled) return false;
            await sgMail.send(mailData);
            logger.log('Email sent to: ', to);
            return true
        } catch (error: any) {
            logger.error(error)
            return false
        }
    },
    sendTemplateEmail: async ({
                                  to,
                                  templateId,
                                  dynamicTemplateData
                              }: { to: string, templateId: string, dynamicTemplateData?: any }) => {
        console.log({
            to,
            from: config.send_grid.email_from,
            fromname: config.app_name,
            templateId,
            dynamicTemplateData: {
                ...dynamicTemplateData
            },
        })

        if (!emailEnabled) return false;
        return sgMail
            .send({
                to,
                from: {
                    email: config.send_grid.email_from as string,
                    name: config.app_name,
                },
                templateId,
                dynamicTemplateData: {
                    ...dynamicTemplateData
                },
            })
            .then(() => {
                logger.log('Email sent to: ', to)
                return true
            })
            .catch((error: any) => {
                logger.error(error)
                return false
            })
    },

    verify_email: async ({email, code}: { email: string, code: string }) => {
        return SendEmail.sendTemplateEmail({
            to: email,
            templateId: config.send_grid.template_id_verify_email as string,
            dynamicTemplateData: {
                code: code,
            }
        })
    },

}
