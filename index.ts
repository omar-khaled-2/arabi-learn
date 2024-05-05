import mongoose from 'mongoose'
import http from 'http'
import { config } from 'dotenv'
import express, { Request } from 'express'

import { createClient } from 'redis';
import SkillModel from './models/skill'
import QuestionModel from './models/question'
import { MINUTE } from './constants'
import Excel from 'exceljs'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getS3ObjectUrl } from './utilties'
import TraceFont from './solutation validators/TraceFont'
import ArabicOCR from './solutation validators/ArabicOcr'
import DotDetector from './solutation validators/DotDetector'
import MCQ from './solutation validators/MCQ'
import Checkbox from './solutation validators/Checkbox'
import fs from 'fs'
import fetch from 'node-fetch'


config();
const port = +process.env.PORT!;


console.log(2);



const generateToken = () => {
    return Date.now().toString(36);
}


const getTokenFromRequest = (request:Request) => {
    return request.headers.token as string | null;
}


const app = express()
const s3Client = new S3Client();
app.use(express.json())





let redisClient = createClient({
    url:process.env.REDIS_URL!
    
})
redisClient.connect().then(() => {

    console.log("Connected to redis")
})

redisClient.on("error",(err) => {
    console.log(err)
})

redisClient.on("end",() => {

    console.log("Disconnected from redis")
})

mongoose.connect(process.env.MONGODB_URL!)
.then(() => {
    console.log("mongoDB connected")

});


app.get("/",(req,res) => {

    res.send("hello")
})


app.get("/skills",async (req,res) => {

    const skills = await SkillModel.find();
    res.json(skills)
})



app.post("/register",async (req,res) => {

    const {skillId,participants} = req.body as {skillId:string,participants:string[]};

    const skill = await SkillModel.findById(skillId);

    if(!skill)
        throw new Error("skill not found");

    const token = generateToken();



    await redisClient.hSet(`quiz:${token}:state`,{
        questionIndex:-1,
        skillId,
        difficulty:0,
        maxDifficulty:skill.maxDifficulty
    });

    await redisClient.lPush(`quiz:${token}:participants`,participants.map(p => p + ",1"));



    

    
    res.json({token})
})


app.get("/question",async (req,res) => {
    const token = getTokenFromRequest(req);
    
    const questionIndex = await redisClient.hGet(`quiz:${token}:state`,"questionIndex");
    const difficulty = await redisClient.hGet(`quiz:${token}:state`,"difficulty");
    const skillId = await redisClient.hGet(`quiz:${token}:state`,"skillId");
    const question = await QuestionModel.findOne({skillId,difficulty}).skip(Number(questionIndex))
    if(!question)
        throw new Error("question not found");
    const expireAt = new Date(new Date().getTime() + 3 * MINUTE);

    res.json({question:{
        id:question.id,
        text:question.text,
        image:question.image ? getS3ObjectUrl(question.image) : undefined,
        placeholder:question.placeholder ? getS3ObjectUrl(question.placeholder) : undefined,
        audio:question.audio ? getS3ObjectUrl(question.audio) : undefined,
        type:question.type,
        options:question.options.map(option => ({id:option.id,text:option.text})),
    },expireAt})

})

app.post("/timeout",async (req,res) => {

    const token = getTokenFromRequest(req);

    await redisClient.hIncrBy(`quiz:${token}:result`,"wrongAnswers",1);

    res.sendStatus(200)


})


app.get("/participant",async (req,res) => {
    const token = getTokenFromRequest(req);
    const participant = await redisClient.hGet(`quiz:${token}:state`,"participant");
    const difficulty = +(await redisClient.hGet(`quiz:${token}:state`,"difficulty"))!;
    res.json({name:participant,difficulty})
})

app.post("/answer",async (req,res) => {
    const token = getTokenFromRequest(req);
    const questionIndex = +(await redisClient.hGet(`quiz:${token}:state`,"questionIndex"))!;
    const difficulty = await redisClient.hGet(`quiz:${token}:state`,"difficulty");
    const skillId = await redisClient.hGet(`quiz:${token}:state`,"skillId");
    const question = await QuestionModel.findOne({skillId,difficulty}).skip(questionIndex)

    if(question == null)
        throw new Error("question not found");
    let isCorrect = false;


    if(question.type == "font tracing"){
        const points = req.body.points;
        isCorrect = await TraceFont.instace.validate(question,points);
    }else if(question.type == "writing"){
        const points = req.body.points;
        isCorrect = await ArabicOCR.instace.validate(question,points);
    }else if(question.type == "dots"){
        const points = req.body.points;
        isCorrect = DotDetector.instace.validate(question,points);
    }else if (question.type == "mcq"){
        const answer = req.body.answer;
        isCorrect = MCQ.instace.validate(question,answer);
    }else if(question.type == "checkbox"){
        const answers = req.body.answers;
        isCorrect = Checkbox.instace.validate(question,answers);
    }
        

    if(isCorrect)
        redisClient.hIncrBy(`quiz:${token}:result`,"correctAnswers",1);
    else
        redisClient.hIncrBy(`quiz:${token}:result`,"wrongAnswers",1);
    


    return res.json({isCorrect})



})

app.get("/next",async (req,res) => {
    const token = getTokenFromRequest(req);

    const currentParticipant = await redisClient.hGet(`quiz:${token}:state`,"participant");
    
    if(currentParticipant != null){
        const questionIndex = +(await redisClient.hGet(`quiz:${token}:state`,"questionIndex"))!;
        const difficulty = +(await redisClient.hGet(`quiz:${token}:state`,"difficulty"))!;
        const skillId = await redisClient.hGet(`quiz:${token}:state`,"skillId");

    
        const questionCount =  await QuestionModel.countDocuments({skillId,difficulty});

        const hasNextQuestion = questionIndex < questionCount - 1;
        
        if(hasNextQuestion){
            await redisClient.hSet(`quiz:${token}:state`,"questionIndex",questionIndex + 1);
            return res.json({next:"question"});
        }
    }




    if(currentParticipant != null){

        const result = await redisClient.hGetAll(`quiz:${token}:result`);
        const difficulty = +(await redisClient.hGet(`quiz:${token}:state`,"difficulty"))!;
        const maxDifficulty = +(await redisClient.hGet(`quiz:${token}:state`,"maxDifficulty"))!;
        if(+result.correctAnswers < +result.wrongAnswers)
            await redisClient.lPush(`quiz:${token}:participants`,`${currentParticipant},${difficulty}`);
        else if(difficulty < maxDifficulty)
            await redisClient.lPush(`quiz:${token}:participants`,`${currentParticipant},${difficulty + 1}`);
        
        await redisClient.lPush(`quiz:${token}:results`,JSON.stringify(result));
    }
    
    const str = await redisClient.lPop(`quiz:${token}:participants`);

    const hasNextParticipant = str != null;
    if(hasNextParticipant){
        const arr = str!.split(",");
        const participant = arr[0];
        const difficulty = +arr[1];
        await redisClient.multi()
        .hSet(`quiz:${token}:state`,"participant",participant)
        .hSet(`quiz:${token}:state`,"difficulty",difficulty)
        .hSet(`quiz:${token}:state`,"questionIndex",-1)
        .hSet(`quiz:${token}:result`,{
            participant,
            correctAnswers:0,
            wrongAnswers:0,
            difficulty,
            duration:0
        })
        .exec();
        return res.json({next:"participant"});
    }

    await redisClient.multi()
    .del(`quiz:${token}:state`)
    .del(`quiz:${token}:participants`)
    .del(`quiz:${token}:result`)
    .exec();
    return res.json({next:"results"});
})



app.get("/result",async (req,res) => {
    const token = getTokenFromRequest(req);
    const resultsJSONString = await redisClient.lRange(`quiz:${token}:results`,0,-1);
    await redisClient.del(`quiz:${token}:results`);
    const results = resultsJSONString.map(result => JSON.parse(result))
    const participantAnswerCount = new Map<string,number>();
    const participantCorrectAnswerCount = new Map<string,number>();
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    worksheet.columns = [
        { header: 'Name', key: 'name', width: 32 },
        { header: 'Difficulty', key: 'difficulty', width: 10 },

        { header: 'Correct Answers', key: 'correct', width: 15 },
        { header: 'Wrong Answers', key: 'wrong', width: 15 },
        { header: 'Accuracy', key: 'accuracy', width: 10 },

    ];


    for(const result of results){
        if(!participantAnswerCount.has(result.participant)) {
            participantAnswerCount.set(result.participant, 0);
            participantCorrectAnswerCount.set(result.participant, 0);
        }
        participantAnswerCount.set(result.participant, participantAnswerCount.get(result.participant)! + result.correctAnswers + result.wrongAnswers);
        participantCorrectAnswerCount.set(result.participant, participantCorrectAnswerCount.get(result.participant)! + result.correctAnswers);

        const row = {
            name: result.participant,
            difficulty: +result.difficulty,
            correct: +result.correctAnswers,
            wrong: +result.wrongAnswers,
            accuracy: +result.correctAnswers / (+result.correctAnswers + +result.wrongAnswers)
        }

        worksheet.addRow(row)
    }

    const buffer = await workbook.xlsx.writeBuffer() as Buffer;
    

    const key = `reports/${token}.xlsx`;

    const setReportCommand = new PutObjectCommand({
        Body: buffer,
        Bucket: process.env.BUCKET_NAME!,
        Key: key
    })

    
    await s3Client.send(setReportCommand);


    const reportUrl = getS3ObjectUrl(key);




    const participants = Array.from(participantAnswerCount.keys());

    participants.sort((a,b) => {
        return participantCorrectAnswerCount.get(b)! / participantAnswerCount.get(b)! - participantCorrectAnswerCount.get(a)! / participantAnswerCount.get(a)!
    });



    const winners = participants.slice(0,3);


    res.json({winners,reportUrl})
})







app.listen(port, async() => {
    console.log("Server is listening on port " + port);

});

