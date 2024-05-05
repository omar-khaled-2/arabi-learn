import {config} from 'dotenv'

config()

export  const getS3ObjectUrl = (key: string) => `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${key}`