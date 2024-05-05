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
const tfjs_node_1 = require("@tensorflow/tfjs-node");
const path_1 = __importDefault(require("path"));
const canvas_1 = require("canvas");
const sharp_1 = __importDefault(require("sharp"));
class ArabicOCR {
    constructor() {
        this.model = null;
        this.words = [
            'أرز', 'أسماء', 'بنت', 'بيت', 'تمساح', 'ثعبان', 'ثعلب', 'ثلج', 'ثمرة', 'جزر',
            'حلم', 'حوت', 'حياة', 'خوخ', 'دار', 'دجاجة', 'درس', 'ديك', 'ذرة', 'ذكي',
            'ذهب', 'رسم', 'رمان', 'ساعة', 'سمكة', 'شارع', 'شجرة', 'شمس', 'شمع', 'شنطة',
            'صحراء', 'صقر', 'طفل', 'ظبي', 'عسل', 'علم', 'عنب', 'غراب', 'فراولة', 'فول',
            'قرد', 'قطة', 'قلم', 'قمر', 'كتاب', 'كلب', 'ماء', 'منضدة', 'موز', 'نار',
            'نجمة', 'ولد', 'يد'
        ];
        (0, tfjs_node_1.loadLayersModel)("file://" + path_1.default.join(__dirname, "..", "ai", "arabic ocr", "model.json"))
            .then((model) => {
            this.model = model;
        });
    }
    validate(question, points) {
        return __awaiter(this, void 0, void 0, function* () {
            if (points.length == 0)
                return false;
            let x1 = 999999;
            let x2 = 0;
            let y1 = 999999;
            let y2 = 0;
            const lineWidth = 5;
            for (let i = 0; i < points.length; i += 2) {
                if (points[i] == -1) {
                    i--;
                    continue;
                }
                x1 = Math.min(x1, points[i]);
                x2 = Math.max(x2, points[i]);
                y1 = Math.min(y1, points[i + 1]);
                y2 = Math.max(y2, points[i + 1]);
            }
            x1 -= lineWidth;
            x2 += lineWidth;
            y1 -= lineWidth;
            y2 += lineWidth;
            for (let i = 0; i < points.length; i += 2) {
                if (points[i] == -1) {
                    i--;
                    continue;
                }
                points[i] = points[i] - x1;
                points[i + 1] = points[i + 1] - y1;
            }
            const width = 150;
            const height = 150;
            const w = x2 - x1 + lineWidth;
            const h = y2 - y1 + lineWidth;
            const canvas = (0, canvas_1.createCanvas)(width, height);
            const ctx = canvas.getContext('2d');
            ctx.scale(width / w, height / h);
            ctx.fillStyle = 'white';
            ctx.strokeStyle = '#fff';
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            let isLine = false;
            for (let i = 0; i < points.length; i += 2) {
                if (points[i] == -1) {
                    i--;
                    isLine = false;
                    ctx.stroke();
                    continue;
                }
                if (isLine) {
                    ctx.lineTo(points[i], points[i + 1]);
                }
                else {
                    ctx.moveTo(points[i], points[i + 1]);
                    isLine = true;
                }
            }
            const buffer = canvas.toBuffer("raw");
            const grayscaleBuffer = Buffer.alloc(width * height);
            for (let i = 0; i < grayscaleBuffer.length; i++) {
                const r = buffer[i * 4];
                const g = buffer[i * 4 + 1];
                const b = buffer[i * 4 + 2];
                grayscaleBuffer[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            }
            (0, sharp_1.default)(grayscaleBuffer, { raw: { width: 150, height: 150, channels: 1 } }).jpeg().toFile("image.jpg");
            const ten = (0, tfjs_node_1.tensor)(grayscaleBuffer).reshape([1, width, height, 1]);
            const result = this.model.predict(ten);
            const index = (yield result.argMax(1).data())[0];
            return this.words[index] == question.expectedWord;
        });
    }
}
ArabicOCR.instace = new ArabicOCR();
exports.default = ArabicOCR;
