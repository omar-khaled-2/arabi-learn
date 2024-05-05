import { QuestionDocument } from "@/models/question";

class MCQ {


      
    static readonly instace = new MCQ()

    

    private constructor(){
  
    }
    validate(question:QuestionDocument,answer:string):boolean{
        const options = question.options;
        for(const option of options)
            if(option.id == answer)
                return option.isCorrect
        return false
    }
}

export default MCQ