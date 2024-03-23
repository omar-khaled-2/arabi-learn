import { Document, Schema, model } from "mongoose";
import SkillModel from "./skill";
import SoluationValidators from "../data/SoluationValidators";
import ArabicOCR from "../solutation validators/ArabicOcr";
import TraceFont from "../solutation validators/TraceFont";
import DotDetector from "../solutation validators/DotDetector";


export interface BaseQuestion{
    id:string;
    text: string;

}

export interface DotField{
    count: number;
    top: number;
    left: number;
    right: number;
    bottom: number;
}

export interface Option{
    id:string;
    text: string;
    isCorrect: boolean;
}
export interface Question extends BaseQuestion{
    difficulty:number;
    skillId: string;
    solutionValidator: string;
    placeholder?: string;
    image?: string;
    expectedWord?: string;
    options: Option[];

    dots: DotField[];
    
}




export interface QuestionDocument extends Document , Omit<Question,"id"> {
    isCorrect: (answer: Buffer | string) => Promise<boolean>;
}


export interface OptionDocument extends Document , Omit<Option,"id"> {
}



const dotFieldSchema = new Schema<DotField>({
    count : {type: Number, required: true},
    top: {type: Number, required: true},
    left: {type: Number, required: true},
    right: {type: Number, required: true},
    bottom: {type: Number, required: true},
})

const optionSchema = new Schema<Option>({
    text: {type: String, required: true},
    isCorrect: {type: Boolean, required: true},
})

optionSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },  
})


const questionSchema = new Schema<QuestionDocument>({
    text: {type: String, required: true},
    difficulty: {type: Number, required: true},
    solutionValidator: {type: String, required:true},
    skillId: {type: String, required: true},
    placeholder: {type: String},
    image: {type: String},
    expectedWord: {type: String},
    options: {type: [optionSchema]},
    dots: {type: [dotFieldSchema]},
});


questionSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },  
})

questionSchema.post("save",async (doc) => {
    const skill = await SkillModel.findById(doc.skillId);
    if(!skill)
        throw new Error("skill not found");

    skill.maxDifficulty = Math.max(skill.maxDifficulty, doc.difficulty);
    await skill.save();
})





questionSchema.methods.isCorrect = async function(answer: Buffer | string | string[]): Promise<boolean>{
    if(this.solutionValidator === SoluationValidators.MULTIPLE_CHOICE)
        return (this.options as OptionDocument[]).find(option => option._id == answer)?.isCorrect ?? false;

    if(this.solutionValidator === SoluationValidators.CHECKBOXS)
        return (this.options as OptionDocument[]).every(option => option.isCorrect === (answer as string[]).includes(option.id))

    if(this.solutionValidator === SoluationValidators.ARABIC_OCR)
        return ArabicOCR.instace.validate(answer as Buffer,this.expectedWord!)

    if(this.solutionValidator === SoluationValidators.TRACING_FONT)
        return TraceFont.instace.validate(answer as Buffer,this.placeholder!,this.difficulty)

    if(this.solutionValidator === SoluationValidators.DOT_DETECTOR)
        return DotDetector.instace.validate(answer as Buffer,this.dots!)
    



    return false;
    
};


const QuestionModel = model<QuestionDocument>('Question', questionSchema);



export default QuestionModel;

