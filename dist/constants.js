"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MINUTE = exports.SECOND = exports.AWS_SECRET_ACCESS_KEY = exports.AWS_ACCESS_KEY_ID = exports.BUCKET_NAME = exports.REGION = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.REGION = process.env.REGION;
exports.BUCKET_NAME = process.env.BUCKET_NAME;
exports.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
exports.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
exports.SECOND = 1000;
exports.MINUTE = 60 * exports.SECOND;
