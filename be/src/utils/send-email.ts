import {config} from "../config"
import sgMail from '@sendgrid/mail'
import {logger} from "./logger";

sgMail.setApiKey(config.send_grid.api_key as string)
export const SendEmail = {
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
