import { Schema, model, Document } from "mongoose";
import QuestionModel from "./question";


export interface Skill{
    id: string;
    name: string;
    maxDifficulty: number;
}

export interface SkillDocument extends Document,Omit<Skill,"id">{}

const skillSchema = new Schema<SkillDocument>({
    name: { type: String, required: true },
    maxDifficulty: { type: Number, required: true,default:0 },

});


skillSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },  
})



const SkillModel = model<SkillDocument>('Skill', skillSchema, 'skills');



export default SkillModel;