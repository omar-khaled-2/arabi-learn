import { Message, connection } from "websocket";
import Game from "./Game";

import GameObserver from "./GameObserver";

import GameFactory from "./GameFactory";
import Participant from "./data/Participant";
import {baseQuestionSerializer} from "./serializers/questions";
import QuestionModel, { Question } from "./models/question";
import SkillModel from "./models/skill";
import * as tf from "@tensorflow/tfjs-node";
import sharp from "sharp";
import SoluationValidators from "./data/SoluationValidators";
import {Workbook} from 'exceljs'


function getCurrentTimeString() {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    return `${hours}:${minutes}:${seconds}-${day}--${month}--${year}`;
}


const getAnswerInputType = (question:Question)=>{
    if(question.solutionValidator === SoluationValidators.MULTIPLE_CHOICE)
        return "radio";

    if(question.solutionValidator === SoluationValidators.CHECKBOXS)
        return "checkbox";

    return "image"
}

class ConnectionManager implements GameObserver{

    game?:Game;

    question:Question|null = null





    constructor(private connection:connection){
        this.connection.on("message", this.onMessage.bind(this))
    }

    private onMessage(data: Message){
        if(data.type === 'binary')
            throw new Error("Binary messages not supported")
        const json = JSON.parse(data.utf8Data)



        switch(json.event){        
            case "register":
                this.handleRegister(json)
                break;
            case "ready":
                this.handleReady()
                break
            case "answer":
                this.handleAnswer(json)
                break

            case "next":
                this.handleNext();
                break
        }
        
    }

    private async handleRegister(json:any){
    
        this.game = await GameFactory.createGame(json.participants, json.skillId, this)

    }

    handleReady(){
        if(!this.game)
            throw new Error("Game not started")
        this.game!.ready();
    }

    handleNext(){
        if(!this.game)
            throw new Error("Game not started")
        this.game!.next();
    }

    async handleAnswer(json:any){
        
        if(json['image'] !== undefined){
            const base64Data = json['image'].replace(/^data:image\/\w+;base64,/, '');
            const content = Buffer.from(base64Data, 'base64')
            this.game!.asnwer(content)
           
        }else if(json['answers'] !== undefined){
            console.log(json['answers'],json['answers'].split(","))
            this.game!.asnwer(json['answers'].split(","))
        }else if(json['answer'] !== undefined){
            this.game!.asnwer(json['answer'])
        }else{
            throw new Error("Invalid answer")
        }




    }

    

    onCorrectAnswer(): void {
        this.connection.sendUTF(JSON.stringify({event:"result",correct:true}))
    }

    onWrongAnswer(): void {
        this.connection.sendUTF(JSON.stringify({event:"result",correct:false}))
    }

    onGameFinished(): void {
        
        this.connection.sendUTF(JSON.stringify({event:"results",results:this.game!.getResults()}))
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Report');
        worksheet.columns = [
            { header: 'Name', key: 'name', width: 30,alignment:{horizontal:"right",vertical:"middle"}},
            { header: 'difficulty', key: 'difficulty', width: 30,alignment:{horizontal:"center",vertical:"middle"} },
            { header: 'duration', key: 'duration', width: 30 ,alignment:{horizontal:"center",vertical:"middle"} },
            { header: 'correct answers', key: 'correct', width: 30 ,alignment:{horizontal:"center",vertical:"middle"} },
            { header: 'wrong answers', key: 'wrong', width: 30 ,alignment:{horizontal:"center",vertical:"middle"} },
            { header: 'accuracy', key: 'accuracy', width: 30 ,alignment:{horizontal:"center",vertical:"middle"} },
            { header: 'average time', key: 'average', width: 30 ,alignment:{horizontal:"center",vertical:"middle"} },
        ];

        for(const result of this.game!.getResults()){
            worksheet.addRow({
                name: result.participant,
                difficulty: result.difficulty,
                duration: result.duration + 1,
                correct: result.correctAnswers,
                wrong: result.wrongAnswers,
                accuracy: `${Math.round((result.correctAnswers / (result.correctAnswers + result.wrongAnswers)) * 100)}%`,
                average: Math.round(result.duration / (result.correctAnswers + result.wrongAnswers))
            })
        }
        workbook.xlsx.writeFile(`reports/${getCurrentTimeString()}.xlsx`)
    }

    onParticipantChange(participant: Participant): void {
        this.connection.sendUTF(JSON.stringify({event:"participant",participant:participant.toJSON()}))
    }

    onQuestionChange(question: Question,expireAt:Date): void {
        this.question = question
    
        this.connection.sendUTF(JSON.stringify({event:"question",expireAt,question:({
            id:question.id,
            text:question.text,
            placeholder:question.placeholder,
            input_type:getAnswerInputType(question),
            options:question.options.map(option => ({
                id:option.id,
                text:option.text
            }))
        })}))
        
    }

 
    

    

}


export default ConnectionManager