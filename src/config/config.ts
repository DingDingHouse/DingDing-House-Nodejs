import { config as conf } from "dotenv";
import { platform } from "os";
conf();

const _config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.MONGOURL,
  env: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET,
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  companyApiKey: process.env.COMPANY_API_KEY,
  phonenumber: process.env.PHONENUMBER,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  region: process.env.AWS_REGION || '',
  emailSource: process.env.EMAILSOURCE,
  platformName: process.env.PLATFORM_NAME,
  sentToemail: process.env.SENT_TO_EMAIL
};

export const config = Object.freeze(_config);
