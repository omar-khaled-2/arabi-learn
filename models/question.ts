import { Document, Model, ObjectId, Schema, model } from "mongoose";

import { getS3ObjectUrl } from "../utilties";
import redisClient from "../redis";
import { MINUTE } from "../constants";




export interface Option{
    id:string;
    text: string;
    isCorrect: boolean;
}
export interface IQuestion{
    id:string;
    text: string;
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




export interface QuestionDocument extends Document , Omit<IQuestion,"id"> {
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
        delete ret.__v;
        return ret;
    },
})


interface QuestionModel extends Model<IQuestion> {
    findBySkillAndDifficulty(skillId: string, difficulty: number, index: number): Promise<QuestionDocument | null>
    countBySkillAndDifficulty(skillId: string, difficulty: number): Promise<number>;
  }
  

const questionSchema = new Schema<IQuestion,QuestionModel>({
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
    
},{
    statics: {
        async findBySkillAndDifficulty(skillId: string, difficulty: number, index: number): Promise<QuestionDocument | null> {
            const cacheKey = `questions:${skillId}:${difficulty}:${index}`;
            const cacheQuestion = await redisClient.get(cacheKey);
            if(cacheQuestion){
                const json = JSON.parse(cacheQuestion);
                return new this(json);
            }else{
                const question = await this.findOne({skillId, difficulty}).skip(index);
                if(question == null) return null;
                await redisClient.set(cacheKey, JSON.stringify(question),{
                    "EX":MINUTE
                });
                return question;
            }
        },
        async countBySkillAndDifficulty(skillId: string, difficulty: number): Promise<number> {
            const cacheKey = `question:${skillId}:${difficulty}:count`;

            const cache = await redisClient.get(cacheKey);
            if(cache){
                return +cache
            }else{
                const count = await this.countDocuments({skillId, difficulty});
                await redisClient.set(cacheKey, count,{
                    "EX":MINUTE
                });
                return count
            }
        }
            
    }
});





questionSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },  
})











const Question = model<IQuestion,QuestionModel>('Question', questionSchema);



export default Question;

