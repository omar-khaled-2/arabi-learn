"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Coordinate_1 = __importDefault(require("../Coordinate"));
const client_s3_1 = require("@aws-sdk/client-s3");
const munkres_algorithm_1 = require("munkres-algorithm");
const s3Client = new client_s3_1.S3Client();
class DotDetector {
    constructor() {
        this.DISTANCE_THRESHOLD = 30;
    }
    validate(question, points) {
        if (points.length == 0)
            return false;
        const pointsCoordinates = [];
        const pointCount = [];
        for (let i = points.length - 1; i >= 0; i -= 2) {
            if (points[i] == -1) {
                i++;
                pointsCoordinates.unshift(0, 0);
                pointCount.unshift(0);
                continue;
            }
            pointsCoordinates[0] += points[i - 1];
            pointsCoordinates[1] += points[i];
            pointCount[0]++;
        }
        const dots = [];
        for (let i = 0; i < pointsCoordinates.length; i += 2) {
            const x = Math.round(pointsCoordinates[i] / pointCount[Math.floor(i / 2)]);
            const y = Math.round(pointsCoordinates[i + 1] / pointCount[Math.floor(i / 2)]);
            dots.push(new Coordinate_1.default(x, y));
        }
        const correctDots = [];
        for (let i = 0; i < question.dots.length; i += 2) {
            correctDots.push(new Coordinate_1.default(question.dots[i], question.dots[i + 1]));
        }
        if (correctDots.length != dots.length)
            return false;
        const n = correctDots.length;
        const distances = new Array(n).fill(0).map(() => new Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                distances[i][j] = correctDots[i].getDistance(dots[j]);
            }
        }
        const { assignments } = (0, munkres_algorithm_1.minWeightAssign)(distances);
        for (let i = 0; i < n; i++) {
            if (distances[i][assignments[i]] > this.DISTANCE_THRESHOLD)
                return false;
        }
        return true;
    }
}
DotDetector.instace = new DotDetector();
exports.default = DotDetector;
