import { QuestionDocument } from "../models/question";

class Checkbox {   
    static readonly instace = new Checkbox() 
    private constructor(){

    }
    validate(question:QuestionDocument,answers:string[]):boolean{
        const correctOptions = question.options.filter(option => option.isCorrect).map(option => option.id);

        if(correctOptions.length != answers.length) return false;


        for(let answer of answers){
            if(correctOptions.indexOf(answer) == -1) return false
        }

        return true;
    }
}

export default Checkbox