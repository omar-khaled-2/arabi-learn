import { Document, ObjectId, Schema, model } from "mongoose";
import SkillModel from "./skill";
import SoluationValidators from "../data/SoluationValidators";
import ArabicOCR from "../solutation validators/ArabicOcr";
import TraceFont from "../solutation validators/TraceFont";
import DotDetector from "../solutation validators/DotDetector";
import { getS3ObjectUrl } from "../utilties";


export interface BaseQuestion{
    id:string;
    text: string;

}

export interface Option{
    id:string;
    text: string;
    isCorrect: boolean;
}
export interface Question extends BaseQuestion{
    difficulty:number;
    skillId: string;
    type: string;
    placeholder?: string;
    image?: string;
    audio:string;
    points: string;
    expectedWord?: string;
    options: Option[];

    dots: number[];
    
}




export interface QuestionDocument extends Document , Omit<Question,"id"> {
    isCorrect: (answer: Buffer | string) => Promise<boolean>;
}


export interface OptionDocument extends Document , Omit<Option,"id"> {
}





const optionSchema = new Schema<Option>({
    text: {type: String, required: true},
    isCorrect: {type: Boolean, required: true},
})

optionSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.isCorrect;
        delete ret.__v;
        return ret;
    },
})

const questionSchema = new Schema<QuestionDocument>({
    text: {type: String, required: true},
    difficulty: {type: Number, required: true},
    type: {type: String, required:true},
    skillId: {type: String, required: true},
    placeholder: {type: String},
    image: {type: String},
    audio: {type: String},
    points: {type: String},
    expectedWord: {type: String},
    options: {type: [optionSchema]},
    dots: {type: [Number]},
});





questionSchema.set("toJSON", {
    transform: (doc, ret) => {
        if(ret.image)
            ret.image = getS3ObjectUrl(ret.image)
        if(ret.placeholder)
            ret.placeholder = getS3ObjectUrl(ret.placeholder)
        if(ret.audio)
            ret.audio = getS3ObjectUrl(ret.audio)
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },  
})







const QuestionModel = model<QuestionDocument>('Question', questionSchema);



export default QuestionModel;

