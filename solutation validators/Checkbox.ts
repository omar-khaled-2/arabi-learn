import { QuestionDocument } from "../models/question";
import {LayersModel, loadLayersModel,node,tensor,Tensor}  from "@tensorflow/tfjs-node"
import path from "path";
import sharp from "sharp";
import {createCanvas} from 'canvas'
import fs from 'fs'

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