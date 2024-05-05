"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const dotenv_1 = require("dotenv");
const Coordinate_1 = __importDefault(require("../Coordinate"));
(0, dotenv_1.config)();
const s3Client = new client_s3_1.S3Client();
class TraceFont {
    constructor() {
        this.threshold = 10;
    }
    validate(question, points) {
        return __awaiter(this, void 0, void 0, function* () {
            if (points.length == 0)
                return false;
            const getCorrectPointsBinCommand = new client_s3_1.GetObjectCommand({
                Bucket: process.env.BUCKET_NAME,
                Key: question.points
            });
            const response = yield s3Client.send(getCorrectPointsBinCommand);
            const correctPointsString = yield response.Body.transformToString();
            const correctPoints = JSON.parse(correctPointsString);
            const correctCorrdinates = [];
            for (let i = 0; i < correctPoints.length; i += 2) {
                correctCorrdinates.push(new Coordinate_1.default(correctPoints[i], correctPoints[i + 1]));
            }
            const corrdinates = [];
            for (let i = 0; i < points.length; i += 2) {
                if (points[i] == -1) {
                    i--;
                    continue;
                }
                corrdinates.push(new Coordinate_1.default(points[i], points[i + 1]));
            }
            const visited = new Set();
            let outsides = 0;
            for (let i = 0; i < corrdinates.length; i++) {
                let isOutside = true;
                for (let j = 0; j < correctCorrdinates.length; j++) {
                    if (corrdinates[i].getDistance(correctCorrdinates[j]) > this.threshold)
                        continue;
                    isOutside = false;
                    visited.add(correctCorrdinates[j]);
                }
                if (isOutside)
                    outsides++;
            }
            if (visited.size < correctCorrdinates.length * .7)
                return false;
            if (outsides > corrdinates.length * .3)
                return false;
            return true;
        });
    }
}
TraceFont.instace = new TraceFont();
exports.default = TraceFont;
