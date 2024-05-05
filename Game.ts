import QuestionModel, { QuestionDocument } from "./models/question";
import Queue, { QueueImpl } from "./queue";
import GameObserver from "./GameObserver";
import Participant from "./data/Participant";
import ArabicOCR from "./solutation validators/ArabicOcr";
import TraceFont from "./solutation validators/TraceFont";
import {S3Client,GetObjectCommand} from "@aws-sdk/client-s3"
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, REGION } from "./constants";
import DotDetector from "./solutation validators/DotDetector";


interface Result{
    participant:string,
    correctAnswers:number,
    wrongAnswers:number,
    difficulty:number,
    duration:number
}


const s3Client = new S3Client({region:REGION,credentials:{accessKeyId:AWS_ACCESS_KEY_ID,secretAccessKey:AWS_SECRET_ACCESS_KEY}})
class State{


    constructor(
        public participant:Participant,
        public questionIndex:number = -1,
    ){
        
    }
    

    
}


class QuizGame{

    private queue:Queue<Participant> = new QueueImpl<Participant>();



    private questionStartTime?:number;

    timer?:NodeJS.Timeout;

    private state?:State;
    
    private results:Result[] = [];

   
    
    constructor(
        participants: string[],
        private questions:QuestionDocument[][],
        private observer:GameObserver,

    ) {
        this.queue = QueueImpl.fromArray(participants.map(p => new Participant(p)))
        this.nextParticipant()
    }



    hasNextParticipant(){
        return !this.queue.isEmpty()
    }


    private handleCorrectAnswer(){
        this.results[this.results.length - 1].correctAnswers++;
        this.results[this.results.length - 1].duration += Math.ceil((Date.now() - this.questionStartTime!) / 1000);
        this.observer.onCorrectAnswer()
    }


    private handleWrongAnswer(){
        this.results[this.results.length - 1].wrongAnswers++;
        this.results[this.results.length - 1].duration += Math.ceil((Date.now() - this.questionStartTime!) / 1000);
        this.observer.onWrongAnswer()
    }


    private hasNextQuestion(){
        return this.state!.questionIndex < this.questions[this.state!.participant.difficulty].length - 1
    }

    private nextQuestion(){

        this.state!.questionIndex++;
        const duration = .5 * 60000;
        const expireAt = new Date(new Date().getTime() + duration);
        this.observer.onQuestionChange(this.getCurrentQuestion(),expireAt)
        this.timer = setTimeout(this.handleTimeout.bind(this), duration)
        this.questionStartTime = Date.now();
    }


    private getCurrentQuestion(){

        return this.questions[this.state!.participant.difficulty][this.state!.questionIndex]
    }

    private nextParticipant(){
        this.state = new State(this.queue.dequeue());
        this.results.push({
            participant: this.state!.participant!.name,
            correctAnswers: 0,
            wrongAnswers: 0,
            difficulty: this.state!.participant.difficulty,
            duration: 0
        })

        this.observer.onParticipantChange(this.state!.participant)
        this.nextQuestion();
    }



    private handleTimeout(){
        this.handleWrongAnswer();
    }



    next(){

        if(this.hasNextQuestion())
           return this.nextQuestion()

    

        if(this.results[this.results.length - 1].wrongAnswers > this.results[this.results.length - 1].correctAnswers)
            this.queue.enqueue(this.state!.participant)

        
        else if(this.state!.participant.difficulty < this.questions.length - 1){
            this.state!.participant.levelUp();
            this.queue.enqueue(this.state!.participant)
        }
            
        if(this.hasNextParticipant())
            return this.nextParticipant()


    
        this.observer.onGameFinished()
        
    }


    public ready(){
        
        this.next();
        this.results.push({
            participant: this.state!.participant!.name,
            correctAnswers: 0,
            wrongAnswers: 0,
            difficulty: this.state!.participant.difficulty,
            duration: 0
        })
    }

    public getResults(){
        return this.results
    }

    


   



    async imageAnswer(image:Buffer){

  

        clearTimeout(this.timer);
        const question = this.getCurrentQuestion();

   

        if(question.type == "writing")
            return await ArabicOCR.instace.validate(image,question.expectedWord!)
        if(question.type == "font tracing"){
            const getObjectCommand = new GetObjectCommand({
                Bucket: "quiz-game-assets",
                Key: question.placeholder!
            }) 
            const response = await s3Client.send(getObjectCommand)
            const placeholder = await response.Body!.transformToByteArray();
            return await TraceFont.instace.validate(image,placeholder)
        }

        if(question.type == "dots")
            return await DotDetector.instace.validate(image,question.dots)
        
        throw new Error("Invalid question type")

    }


    async mcqAnswer(correctIndex:number){
        return this.getCurrentQuestion().options[correctIndex].isCorrect;   
    }

    async checkboxAnswer(correctIndices:number[]){
        const options = this.getCurrentQuestion().options
        return options.every((option,index) => option.isCorrect == correctIndices.includes(index))
    }







}


export default QuizGame