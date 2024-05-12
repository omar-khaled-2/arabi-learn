import mongoose from 'mongoose'
import http from 'http'
import { config } from 'dotenv'
import express, { ErrorRequestHandler, Request } from 'express'

import { createClient } from 'redis';
import SkillModel from './models/skill'
import Question from './models/question'
import { HOUR, MINUTE, MONGODB_URL, REGION, SECOND } from './constants'
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
import NotFound from './errors/NotFound';
import ApiException from './errors/ApiException';
import BadRequest from './errors/BadRequest';
import redisClient from './redis';


config();
const port = +process.env.PORT!;





const generateToken = () => {
    return Date.now().toString(36);
}


const getTokenFromRequest = (request:Request) => {
    return request.headers.token as string | null;
}


const app = express()
const s3Client = new S3Client({
    region: REGION,
});
app.use(express.json())






redisClient.connect()


mongoose.connect(MONGODB_URL)
    .then(() => {
        console.log(MONGODB_URL)
    
        console.log("connected to mongodb")
        SkillModel.countDocuments().then(count => console.log(`Found ${count} skills`))
        Question.countDocuments().then(count => console.log(`Found ${count} questions`))
    })



const errorHandler:ErrorRequestHandler = (err,req,res,next) => {
    if(err instanceof ApiException)
        return res.status(err.statusCode).json({
            error:err.message
        })

    res.status(500).json({
        error:"An unexpected error has occurred. Please try again later."
    })
}


app.get("/",(req,res) => {
    res.send("hello")
})


app.get("/skills",async (req,res) => {
    try {
  
        const skills = await SkillModel.find();
        res.json(skills)
    } catch (error) {
        res.sendStatus(500)
    }


})



app.post("/register",async (req,res,next) => {

    try{
        const {skillId,participants} = req.body as {skillId?:string,participants:string[]};
        if(!skillId)
            throw new BadRequest("skill is required");

        if(!participants)
            throw new BadRequest("participants are required");

        if(participants.length === 0)
            throw new BadRequest("at least one participant is required");

        const skill = await SkillModel.findById(skillId);

        
    
        if(!skill)
            throw new NotFound("skill not found");
    
        const token = generateToken();
    
    
        await redisClient.hSet(`quiz:${token}:state`,{
            questionIndex:-1,
            skillId,
            difficulty:0,
            maxDifficulty:skill.maxDifficulty
        });

        await redisClient.expire(`quiz:${token}:state`,3 * HOUR);

        await redisClient.lPush(`quiz:${token}:participants`,participants.map(p => p + ",1"));
    
        await redisClient.expire(`quiz:${token}:participants`,3 * HOUR);
        
     
        res.json({token})
    }catch(err){
        next(err);
    }

})


app.get("/question",async (req,res,next) => {
    try{
        const token = getTokenFromRequest(req);
    
        const state = await redisClient.hGetAll(`quiz:${token}:state`);
        
        const questionIndex = +state.questionIndex;
        const difficulty = +state.difficulty;
        const skillId = state.skillId;

        const totalQuestions = await Question.countBySkillAndDifficulty(skillId,difficulty);



        const question = await Question.findBySkillAndDifficulty(skillId,difficulty,questionIndex);
        

        if(!question)
            throw new NotFound("question not found");




        const expireAt = new Date(new Date().getTime() + 3 * MINUTE * 1000);

    
    
        res.json({question:{
            id:question.id,
            text:question.text,
            image:question.image ? getS3ObjectUrl(question.image) : undefined,
            placeholder:question.placeholder ? getS3ObjectUrl(question.placeholder) : undefined,
            audio:question.audio ? getS3ObjectUrl(question.audio) : undefined,
            type:question.type,
            options:question.options.map(option => ({id:option.id,text:option.text})),
        },expireAt,questionIndex,totalQuestions})
    }catch(err){
        next(err)
    }


})

app.post("/timeout",async (req,res) => {
    try {
        
    const token = getTokenFromRequest(req);

    await redisClient.hIncrBy(`quiz:${token}:result`,"wrongAnswers",1);

    res.sendStatus(200)
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }



})


app.get("/participant",async (req,res,next) => {
    try {
        const token = getTokenFromRequest(req);
        const participant = await redisClient.hGet(`quiz:${token}:state`,"participant");
        const difficulty = +(await redisClient.hGet(`quiz:${token}:state`,"difficulty"))!;
        res.json({name:participant,difficulty})
    } catch (error) {
        next(error)
    }

})

app.post("/answer",async (req,res) => {
    try {
        const token = getTokenFromRequest(req);
        const state = await redisClient.hGetAll(`quiz:${token}:state`);
        
        const questionIndex = +state.questionIndex;
        const difficulty = +state.difficulty;
        const skillId = state.skillId;

        const question = await Question.findBySkillAndDifficulty(skillId,difficulty,questionIndex);
    
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
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }




})

app.get("/next",async (req,res) => {
    try {
        const token = getTokenFromRequest(req);
        const state = await redisClient.hGetAll(`quiz:${token}:state`)

        const currentParticipant = state.participant;
        

        if(currentParticipant != null){
       
            const questionIndex = +state.questionIndex;
            const difficulty = +state.difficulty;
            const skillId = state.skillId;    
            const questionCount =  await Question.countDocuments({skillId,difficulty});
    
            const hasNextQuestion = questionIndex < questionCount - 1;
            
            if(hasNextQuestion){
                await redisClient.hSet(`quiz:${token}:state`,"questionIndex",questionIndex + 1);
                return res.json({next:"question"});
            }

            const result = await redisClient.hGetAll(`quiz:${token}:result`);
            const maxDifficulty = +state.maxDifficulty;


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


            await redisClient.hSet(`quiz:${token}:state`,"participant",participant);
            await redisClient.hSet(`quiz:${token}:state`,"difficulty",difficulty);
            await redisClient.hSet(`quiz:${token}:state`,"questionIndex",-1);
            await redisClient.hSet(`quiz:${token}:result`,{
                participant,
                correctAnswers:0,
                wrongAnswers:0,
                difficulty,
                duration:0
            })

            await redisClient.expire(`quiz:${token}:result`,HOUR);
      
 
            return res.json({next:"participant"});
        }
    
        await redisClient.del(`quiz:${token}:state`);
        await redisClient.del(`quiz:${token}:result`);
        await redisClient.del(`quiz:${token}:participants`);

        return res.json({next:"results"});
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
 
})



app.get("/result",async (req,res) => {
    try {
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
            participantAnswerCount.set(result.participant, participantAnswerCount.get(result.participant)! + +result.correctAnswers + +result.wrongAnswers);
            participantCorrectAnswerCount.set(result.participant, participantCorrectAnswerCount.get(result.participant)! + +result.correctAnswers);
    
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
    
    
        const participants:{
            name:string,
            score:number,
            rank:number
        }[] = [];

        for(const name of participantAnswerCount.keys()){

            const score = Math.round(participantCorrectAnswerCount.get(name)! / participantAnswerCount.get(name)! * 100);

            participants.push({name,score,rank:0})
        }
    


   
        participants.sort((a,b) => b.score - a.score);

        if(participants.length > 0)
            participants[0].rank = 1;

        for(let i = 1; i < participants.length; i++){
            if(participants[i].score == participants[i - 1].score){
                participants[i].rank = participants[i - 1].rank;
            }else{
                participants[i].rank = i + 1;
            }
        }
    
    
    
        res.json({participants,reportUrl})
    }catch (error) {
        console.log(error)
        res.sendStatus(500)
    }

})



app.post("/exit",async (req,res) => {
    const token = getTokenFromRequest(req);


    await redisClient.del(`quiz:${token}:state`);
    await redisClient.del(`quiz:${token}:result`);
    await redisClient.del(`quiz:${token}:participants`);



    res.sendStatus(200);

})


app.use(errorHandler)



app.listen(port, async() => {
    console.log("Server is listening on port " + port);


});

