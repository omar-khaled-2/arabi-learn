import { BaseQuestion, Question, QuestionDocument } from "../models/question"
import Serializer from "./serializer"

export const baseQuestionSerializer = (document: any):BaseQuestion => {

    return {
        id:document._id as string,
        text: document.text,
        
        
       
    }
}


