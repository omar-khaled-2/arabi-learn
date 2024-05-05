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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
const express_1 = __importDefault(require("express"));
const redis_1 = require("redis");
const skill_1 = __importDefault(require("./models/skill"));
const question_1 = __importDefault(require("./models/question"));
const constants_1 = require("./constants");
const exceljs_1 = __importDefault(require("exceljs"));
const client_s3_1 = require("@aws-sdk/client-s3");
const utilties_1 = require("./utilties");
const TraceFont_1 = __importDefault(require("./solutation validators/TraceFont"));
const ArabicOcr_1 = __importDefault(require("./solutation validators/ArabicOcr"));
const DotDetector_1 = __importDefault(require("./solutation validators/DotDetector"));
const MCQ_1 = __importDefault(require("./solutation validators/MCQ"));
const Checkbox_1 = __importDefault(require("./solutation validators/Checkbox"));
(0, dotenv_1.config)();
const port = +process.env.PORT;
console.log(1);
const generateToken = () => {
    return Date.now().toString(36);
};
const getTokenFromRequest = (request) => {
    return request.headers.token;
};
const app = (0, express_1.default)();
const s3Client = new client_s3_1.S3Client();
app.use(express_1.default.json());
let redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL
});
redisClient.connect().then(() => {
    console.log("Connected to redis");
});
redisClient.on("error", (err) => {
    console.log(err);
});
redisClient.on("end", () => {
    console.log("Disconnected from redis");
});
mongoose_1.default.connect(process.env.MONGODB_URL)
    .then(() => {
    console.log("mongoDB connected");
});
app.get("/", (req, res) => {
    res.send("hello");
});
app.get("/skills", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const skills = yield skill_1.default.find();
    res.json(skills);
}));
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { skillId, participants } = req.body;
    const skill = yield skill_1.default.findById(skillId);
    if (!skill)
        throw new Error("skill not found");
    const token = generateToken();
    yield redisClient.hSet(`quiz:${token}:state`, {
        questionIndex: -1,
        skillId,
        difficulty: 0,
        maxDifficulty: skill.maxDifficulty
    });
    yield redisClient.lPush(`quiz:${token}:participants`, participants.map(p => p + ",1"));
    res.json({ token });
}));
app.get("/question", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = getTokenFromRequest(req);
    const questionIndex = yield redisClient.hGet(`quiz:${token}:state`, "questionIndex");
    const difficulty = yield redisClient.hGet(`quiz:${token}:state`, "difficulty");
    const skillId = yield redisClient.hGet(`quiz:${token}:state`, "skillId");
    const question = yield question_1.default.findOne({ skillId, difficulty }).skip(Number(questionIndex));
    if (!question)
        throw new Error("question not found");
    const expireAt = new Date(new Date().getTime() + 3 * constants_1.MINUTE);
    res.json({ question: {
            id: question.id,
            text: question.text,
            image: question.image ? (0, utilties_1.getS3ObjectUrl)(question.image) : undefined,
            placeholder: question.placeholder ? (0, utilties_1.getS3ObjectUrl)(question.placeholder) : undefined,
            audio: question.audio ? (0, utilties_1.getS3ObjectUrl)(question.audio) : undefined,
            type: question.type,
            options: question.options.map(option => ({ id: option.id, text: option.text })),
        }, expireAt });
}));
app.post("/timeout", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = getTokenFromRequest(req);
    yield redisClient.hIncrBy(`quiz:${token}:result`, "wrongAnswers", 1);
    res.sendStatus(200);
}));
app.get("/participant", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = getTokenFromRequest(req);
    const participant = yield redisClient.hGet(`quiz:${token}:state`, "participant");
    const difficulty = +(yield redisClient.hGet(`quiz:${token}:state`, "difficulty"));
    res.json({ name: participant, difficulty });
}));
app.post("/answer", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = getTokenFromRequest(req);
    const questionIndex = +(yield redisClient.hGet(`quiz:${token}:state`, "questionIndex"));
    const difficulty = yield redisClient.hGet(`quiz:${token}:state`, "difficulty");
    const skillId = yield redisClient.hGet(`quiz:${token}:state`, "skillId");
    const question = yield question_1.default.findOne({ skillId, difficulty }).skip(questionIndex);
    if (question == null)
        throw new Error("question not found");
    let isCorrect = false;
    if (question.type == "font tracing") {
        const points = req.body.points;
        isCorrect = yield TraceFont_1.default.instace.validate(question, points);
    }
    else if (question.type == "writing") {
        const points = req.body.points;
        isCorrect = yield ArabicOcr_1.default.instace.validate(question, points);
    }
    else if (question.type == "dots") {
        const points = req.body.points;
        isCorrect = DotDetector_1.default.instace.validate(question, points);
    }
    else if (question.type == "mcq") {
        const answer = req.body.answer;
        isCorrect = MCQ_1.default.instace.validate(question, answer);
    }
    else if (question.type == "checkbox") {
        const answers = req.body.answers;
        isCorrect = Checkbox_1.default.instace.validate(question, answers);
    }
    if (isCorrect)
        redisClient.hIncrBy(`quiz:${token}:result`, "correctAnswers", 1);
    else
        redisClient.hIncrBy(`quiz:${token}:result`, "wrongAnswers", 1);
    return res.json({ isCorrect });
}));
app.get("/next", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = getTokenFromRequest(req);
    const currentParticipant = yield redisClient.hGet(`quiz:${token}:state`, "participant");
    if (currentParticipant != null) {
        const questionIndex = +(yield redisClient.hGet(`quiz:${token}:state`, "questionIndex"));
        const difficulty = +(yield redisClient.hGet(`quiz:${token}:state`, "difficulty"));
        const skillId = yield redisClient.hGet(`quiz:${token}:state`, "skillId");
        const questionCount = yield question_1.default.countDocuments({ skillId, difficulty });
        const hasNextQuestion = questionIndex < questionCount - 1;
        if (hasNextQuestion) {
            yield redisClient.hSet(`quiz:${token}:state`, "questionIndex", questionIndex + 1);
            return res.json({ next: "question" });
        }
    }
    if (currentParticipant != null) {
        const result = yield redisClient.hGetAll(`quiz:${token}:result`);
        const difficulty = +(yield redisClient.hGet(`quiz:${token}:state`, "difficulty"));
        const maxDifficulty = +(yield redisClient.hGet(`quiz:${token}:state`, "maxDifficulty"));
        if (+result.correctAnswers < +result.wrongAnswers)
            yield redisClient.lPush(`quiz:${token}:participants`, `${currentParticipant},${difficulty}`);
        else if (difficulty < maxDifficulty)
            yield redisClient.lPush(`quiz:${token}:participants`, `${currentParticipant},${difficulty + 1}`);
        yield redisClient.lPush(`quiz:${token}:results`, JSON.stringify(result));
    }
    const str = yield redisClient.lPop(`quiz:${token}:participants`);
    const hasNextParticipant = str != null;
    if (hasNextParticipant) {
        const arr = str.split(",");
        const participant = arr[0];
        const difficulty = +arr[1];
        yield redisClient.multi()
            .hSet(`quiz:${token}:state`, "participant", participant)
            .hSet(`quiz:${token}:state`, "difficulty", difficulty)
            .hSet(`quiz:${token}:state`, "questionIndex", -1)
            .hSet(`quiz:${token}:result`, {
            participant,
            correctAnswers: 0,
            wrongAnswers: 0,
            difficulty,
            duration: 0
        })
            .exec();
        return res.json({ next: "participant" });
    }
    yield redisClient.multi()
        .del(`quiz:${token}:state`)
        .del(`quiz:${token}:participants`)
        .del(`quiz:${token}:result`)
        .exec();
    return res.json({ next: "results" });
}));
app.get("/result", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = getTokenFromRequest(req);
    const resultsJSONString = yield redisClient.lRange(`quiz:${token}:results`, 0, -1);
    yield redisClient.del(`quiz:${token}:results`);
    const results = resultsJSONString.map(result => JSON.parse(result));
    const participantAnswerCount = new Map();
    const participantCorrectAnswerCount = new Map();
    const workbook = new exceljs_1.default.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    worksheet.columns = [
        { header: 'Name', key: 'name', width: 32 },
        { header: 'Difficulty', key: 'difficulty', width: 10 },
        { header: 'Correct Answers', key: 'correct', width: 15 },
        { header: 'Wrong Answers', key: 'wrong', width: 15 },
        { header: 'Accuracy', key: 'accuracy', width: 10 },
    ];
    for (const result of results) {
        if (!participantAnswerCount.has(result.participant)) {
            participantAnswerCount.set(result.participant, 0);
            participantCorrectAnswerCount.set(result.participant, 0);
        }
        participantAnswerCount.set(result.participant, participantAnswerCount.get(result.participant) + result.correctAnswers + result.wrongAnswers);
        participantCorrectAnswerCount.set(result.participant, participantCorrectAnswerCount.get(result.participant) + result.correctAnswers);
        const row = {
            name: result.participant,
            difficulty: +result.difficulty,
            correct: +result.correctAnswers,
            wrong: +result.wrongAnswers,
            accuracy: +result.correctAnswers / (+result.correctAnswers + +result.wrongAnswers)
        };
        worksheet.addRow(row);
    }
    const buffer = yield workbook.xlsx.writeBuffer();
    const key = `reports/${token}.xlsx`;
    const setReportCommand = new client_s3_1.PutObjectCommand({
        Body: buffer,
        Bucket: process.env.BUCKET_NAME,
        Key: key
    });
    yield s3Client.send(setReportCommand);
    const reportUrl = (0, utilties_1.getS3ObjectUrl)(key);
    const participants = Array.from(participantAnswerCount.keys());
    participants.sort((a, b) => {
        return participantCorrectAnswerCount.get(b) / participantAnswerCount.get(b) - participantCorrectAnswerCount.get(a) / participantAnswerCount.get(a);
    });
    const winners = participants.slice(0, 3);
    res.json({ winners, reportUrl });
}));
app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Server is listening on port " + port);
}));
