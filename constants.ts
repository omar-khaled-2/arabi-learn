import { config } from "dotenv"

config();

export const REGION = process.env.REGION!
export const BUCKET_NAME = process.env.BUCKET_NAME!
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
