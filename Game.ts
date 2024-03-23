import QuestionModel, { QuestionDocument } from "./models/question";
import Queue, { QueueImpl } from "./queue";
import GameObserver from "./GameObserver";
import Participant from "./data/Participant";



interface Result{
    participant:string,
    correctAnswers:number,
    wrongAnswers:number,
    difficulty:number,
    duration:number
}


class QuizGame{

    private queue:Queue<Participant> = new QueueImpl<Participant>();
  
    private questionIndex:number = -1;

    private currentParticipant?:Participant;

    private questionStartTime?:number;

    timer?:NodeJS.Timeout;
    

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

        return this.questionIndex < this.questions[this.currentParticipant!.difficulty].length - 1
    }

    private nextQuestion(){

        this.questionIndex++;
        const duration = .5 * 60000;
        const expireAt = new Date(new Date().getTime() + duration);
        this.observer.onQuestionChange(this.questions[this.currentParticipant!.difficulty][this.questionIndex].toJSON(),expireAt)
        this.timer = setTimeout(this.handleTimeout.bind(this), duration)
        this.questionStartTime = Date.now();
    }


    private nextParticipant(){
        this.currentParticipant = this.queue.dequeue();
        this.observer.onParticipantChange(this.currentParticipant);
        
    }



    private handleTimeout(){
        this.handleWrongAnswer();
    }



    next(){

        if(this.hasNextQuestion()){
            this.nextQuestion()
        }else{
    

            if(this.results[this.results.length - 1].wrongAnswers > this.results[this.results.length - 1].correctAnswers)
                this.queue.enqueue(this.currentParticipant!)

            
            else if(this.currentParticipant!.difficulty < this.questions.length - 1){
        
                this.currentParticipant!.levelUp();
                this.queue.enqueue(this.currentParticipant!)
          
            }
            


            if(this.hasNextParticipant()){
                this.nextParticipant()
            }else
                this.observer.onGameFinished()
        }
    }


    public ready(){
        this.questionIndex = -1;
        this.next();
        this.results.push({
            participant: this.currentParticipant!.name,
            correctAnswers: 0,
            wrongAnswers: 0,
            difficulty: this.currentParticipant!.difficulty,
            duration: 0
        })
    }

    public getResults(){
        return this.results
    }

    


   



    async asnwer(image:Buffer){

        clearTimeout(this.timer);
        const question = this.questions[this.currentParticipant!.difficulty][this.questionIndex]
        
        if(await question.isCorrect(image))
            this.handleCorrectAnswer()
        else
            this.handleWrongAnswer()
        

    }









}


export default QuizGame