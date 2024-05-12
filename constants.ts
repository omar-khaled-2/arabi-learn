import { config } from "dotenv"

config();

export const REGION = process.env.REGION!
export const BUCKET_NAME = process.env.BUCKET_NAME!
export const MONGODB_URL = process.env.MONGODB_URL!

export const SECOND = 1;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;

