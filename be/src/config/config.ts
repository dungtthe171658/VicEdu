import { config as dotenvConfig } from "dotenv";

dotenvConfig({
  path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env",
});

export const config = {
  node_env: process.env.NODE_ENV,
  production: !process.env.NODE_ENV || process.env.NODE_ENV === "production",
  direct_service: process.env.DIRECT_SERVICE === "true",

  database_url: process.env.MONGO_URI,

  logger: {
    level: process.env.LOGGER_LEVEL ? Number(process.env.LOGGER_LEVEL) : 6, // 0: log, 1: trace, 2: debug, 3: info, 4: warn, 5: fatal, 6: error
  },
  send_grid: {
    api_key: process.env.SENDGRID_API_KEY,
    email_from: process.env.EMAIL_FROM,
    template_id_verify_email: process.env.SENDGRID_TEMPLACE_VERIFY_EMAIL,
  },
  serverPort: process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 8888,
  jwtSecret: process.env.JWT_SECRET ? String(process.env.JWT_SECRET) : "",
  frontend_url: process.env.FE_URL,
  aes: {
    key: process.env.AES_KEY || "",
    iv: process.env.AES_IV || "",
  },
  service_name: process.env.SERVICE_NAME,
  app_name: process.env.APP_NAME,
  gemini: {
    api_key: process.env.GEMINI_API_KEY,
  },
};
