"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getS3ObjectUrl = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const getS3ObjectUrl = (key) => `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${key}`;
exports.getS3ObjectUrl = getS3ObjectUrl;
