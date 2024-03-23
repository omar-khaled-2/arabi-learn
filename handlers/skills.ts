import Joi,{ValidationError} from "joi";
import BadRequest from "../errors/BadRequest";
import { Handler } from "express"
import SkillModel from "../models/skill";
import SkillSerializer, { skillSerializer } from "../serializers/skills";

import {  Error } from "mongoose"
import NotFound from "../errors/NotFound";



const createSkillSchema = Joi.object({
    name: Joi.string()
        .min(5)
        .max(30)
        .required(),
})


export const createSkillHandler:Handler = async(req,res,next) => {
    // return res.sendStatus(200)
    try{
        console.log(req.body)
        await createSkillSchema.validateAsync(req.body)
        const {name} = req.body
        // console.log(value)
        // if(error)
        //     throw new BadRequest(error.message)
        const skill = await SkillModel.create({name})
        return res.status(201).json(skillSerializer(skill))
    }catch(err){
        console.log(err)
        if(err instanceof ValidationError)
            next(new BadRequest(err.message))
        else
            next(err)
    }
}



export const getSkillsHandler:Handler = async(req,res,next) => {
    try{
        const skills = await SkillModel.find()
        const data = skills.map((skill) => new SkillSerializer(skill).serialize())
        return res.status(200).send(data)
    }catch(err){
        next(err)
    }

}



export const getSkillHandler:Handler = async(req,res,next) => {
    try{
        const id = req.params.id
        const skill = await SkillModel.findById(id)
        if(!skill)
            throw new NotFound("skill not found")
        const data = new SkillSerializer(skill).serialize();
        return res.status(200).send(data)
    }catch(err){
        next(err)
    }

}




export const deleteSkillHandler:Handler = async(req,res,next) => {
    try{
    
        const skills = await SkillModel.deleteOne({_id:req.params.id})
        return res.status(204)
    }catch(err){
        if(err instanceof Error.DocumentNotFoundError)
            next(new NotFound("skill not found"))
        else
            next(err)
    }
}

