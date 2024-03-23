import {baseQuestionSerializer} from "../serializers/questions";
import BadRequest from "../errors/BadRequest";
import QuestionModel, { DotField } from "../models/question";
import { Handler } from "express";
import Joi,{ValidationError,CustomValidator} from "joi";
import NotFound from "../errors/NotFound";
import SoluationValidators from "../data/SoluationValidators";
import sharp from "sharp";
import path from "path";
import { buffer } from "stream/consumers";
import {Error} from "mongoose";






export const getQuestionsHandler: Handler = async (req, res) => {

  const { page = '1', pageSize = '10' } = req.query as Record<string, string>;

  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);

  if (isNaN(pageNum) || isNaN(pageSizeNum)) {
    throw new BadRequest('Page and pageSize must be valid numbers');
  }

  const skip = pageNum * pageSizeNum;
  const limit = pageSizeNum;


  const questions = await QuestionModel.find()
                                        .skip(skip)
                                        .limit(limit);

  const totalQuestions = await QuestionModel.countDocuments();

  return res.status(200).json({ 
    total: totalQuestions,
    page: pageNum,
    data: questions 
  });

}



export const createQuestionHandler:Handler = async(req,res,next) => {
    try{
        const {text,difficulty,skillId,solutionValidator,options} = req.body

     

        const question = new QuestionModel({
            text,
            difficulty,
            skillId,
            solutionValidator
        })



        if(solutionValidator == SoluationValidators.ARABIC_OCR){

            question.expectedWord = req.body.expectedWord
        
        }else if(solutionValidator == SoluationValidators.TRACING_FONT){
            const placeholder = req.file!
            const filePath = path.join("media","placeholders",Date.now().toString(36) + ".png")
            const buffer = await sharp(placeholder.buffer).resize({"fit":"fill","width":200,"height":200}).raw().toBuffer();
            for(let i = 3;i < buffer.length;i+=4){
                buffer[i] = Math.min(buffer[i],100);
            }
            await sharp(buffer,{raw:{width:200,height:200,channels:4}}).toFile(filePath);
            question.placeholder = '/' + filePath;
        }else if(solutionValidator == SoluationValidators.DOT_DETECTOR){
            const placeholder = req.file!
            const filePath = path.join("media","placeholders",Date.now().toString(36) + ".png")

            const width = 200;
            const height = 200;
            const image = await sharp(placeholder.buffer).resize({"fit":"fill","width":width,"height":height}).flatten({background:{r:255,g:255,b:255}}).grayscale().raw().toBuffer();      
          
            for(let i = 0;i < image.length;i++){
              if(image[i] > 200)
                image[i] = 255;      
            }
          
          
            let serial = 1;
          
            const sizes = Array(20).fill(0);


            const buffer = Buffer.alloc(image.length,0);


            for(let i = 0;i < image.length;i++){
              if(image[i] < 200 && buffer[i] == 0){
                const queue = [i];
                while(queue.length > 0){
                  const index = queue.shift()!;
                  if(buffer[index] != 0 || image[index] > 200)
                    continue
          
                  sizes[serial - 1]++;
                  buffer[index] = serial;
                  if(index % width > 0){
                    queue.push(index - 1)
                  }
                  if(index % width < width - 1){
                    queue.push(index + 1)
                  }
                  if(index - width >= 0){
                    queue.push(index - width)
                  }
                  if(index + width < image.length){
                    queue.push(index + width)
                  }
                }
                serial++;
          
              }
            
              
            }
          
          
          



          
            for(let i = 0;i < image.length;i++){
              if(sizes[buffer[i] - 1] < 200){
                image[i] = 255;
              }else{i
                buffer[i] = 0;
              }
            }



            question.placeholder = '/' + filePath;
          
          
            const map = new Map<number,[number,number,number,number]>()
          
          
            for(let i = 0;i < image.length;i++){
              if(buffer[i] != 0){
                const value = map.get(buffer[i]) || [Number.MAX_SAFE_INTEGER,0,Number.MAX_SAFE_INTEGER,0];
                value[0] = Math.min(value[0],i % width);
                value[1] = Math.max(value[1],i % width);
                value[2] = Math.min(value[2],Math.floor(i / width));
                value[3] = Math.max(value[3],Math.floor(i / width));
                map.set(buffer[i],value);
              }
            }

            const rgpa = Buffer.alloc(width*height*4,0); 


            for(let i = 0;i < image.length;i++){
                if(image[i] > 200 || map.has(buffer[i]))
                    continue

                
                
                const value = Math.min(image[i],0)
                rgpa[i * 4 + 0] = value;
                rgpa[i * 4 + 1] = value;
                rgpa[i * 4 + 2] = value;
                rgpa[i * 4 + 3] = 255;
            }


            sharp(rgpa,{raw:{width:200,height:200,channels:4}}).toFile(path.join(__dirname,"..",filePath));

          
            const boxes = Array.from(map.values());
          
            for(const value of map.values()){
          
              value[0] = Math.max(0,value[0] - 5);
              value[1] = Math.min(width - 1,value[1] + 5);
              value[2] = Math.max(0,value[2] - 5);
              value[3] = Math.min(width - 1,value[3] + 5);
          
            }
          
          
            const groups = Array(boxes.length).fill(-1);



          
            for(let i = 0;i < boxes.length;i++){
                for(let j = i + 1;j < boxes.length;j++){
                    if(boxes[i][1] < boxes[j][0] || boxes[i][0] > boxes[j][1] || boxes[i][3] < boxes[j][2] || boxes[i][2] > boxes[j][3])
                        continue
                
         
                    groups[j] = i;
                }
            }


            
          
            const dots = new Map<number,DotField>();

            for(let i = 0;i < groups.length;i++){
                
                if(groups[i] == -1){
                    dots.set(i,{
                        count:1,
                        top:boxes[i][2],
                        left:boxes[i][0],
                        right:boxes[i][1],
                        bottom:boxes[i][3]
                    })
                }else{
                    let index = i;
                    while(groups[index] != -1){
                        index = groups[index];
                    }
                    const value = dots.get(index)!
                    dots.set(index,{
                        count:value.count + 1,
                        top:Math.min(value.top,boxes[i][2]),
                        left:Math.min(value.left,boxes[i][0]),
                        right:Math.max(value.right,boxes[i][1]),
                        bottom:Math.max(value.bottom,boxes[i][3])
                    });
                }
            }
      

            question.dots = Array.from(dots.values());
     
          
            
        }else if(solutionValidator === SoluationValidators.MULTIPLE_CHOICE || solutionValidator === SoluationValidators.CHECKBOXS){

            question.options = JSON.parse(options)
        }

        await question.save()
        
        return res.status(201).send(baseQuestionSerializer(question))

    }catch(err){
        if(err instanceof ValidationError)
            next(new BadRequest(err.message))
        else
            next(err)
    }

}


export const getQuestionHandler:Handler = async(req,res,next) => {

    try{
        const id = req.params.id
        const question = await QuestionModel.findById(id)
        if(!question)
            throw new NotFound("question not found")
        return res.status(200).json(question)
    }catch(err){
        next(err)
    }
}

export const deleteQuestionHandler:Handler = async(req,res,next) => {
    try{
        const id = req.params.id
        await QuestionModel.deleteOne({_id:id})
        return res.status(204)
    }catch(err){
        if(err instanceof Error.DocumentNotFoundError)
            next(new NotFound("question not found"))
        else
            next(err)
    }
}