import { QuestionDocument } from "../models/question";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { config } from "dotenv";
import Coordinate from "../Coordinate";
import { REGION } from "../constants";


config();

const s3Client = new S3Client({
    region:REGION
})


class TraceFont {
    static readonly instace = new TraceFont()

    threshold = 10;

    private constructor() {}
    async validate(question:QuestionDocument,points:number[]) {

    
        if(points.length == 0) return false;
    
        const getCorrectPointsBinCommand = new GetObjectCommand({
            Bucket:process.env.BUCKET_NAME!,
            Key:question.points
        })

        const response = await s3Client.send(getCorrectPointsBinCommand)


        const correctPointsString = await response.Body!.transformToString();


       
        const correctPoints:number[] = JSON.parse(correctPointsString);

        const correctCorrdinates:Coordinate[] = [];



        for(let i = 0;i < correctPoints.length;i+=2){
            const x = correctPoints[i];
            const y = correctPoints[i+1];
            correctCorrdinates.push(new Coordinate(x,y))

        }




        const corrdinates:Coordinate[] = [];
        for(let i = 0;i < points.length;i+=2){
            if(points[i] == -1){
                i--;
                continue;
            }
            const x = points[i];
            const y = points[i+1];
            corrdinates.push(new Coordinate(x,y))

        }



        const visited:Set<Coordinate> = new Set();

        let outsides = 0;



        for(let i = 0;i < corrdinates.length;i++){
            let isOutside = true;
            for(let j = 0;j < correctCorrdinates.length;j++){
        
                if(corrdinates[i].getDistance(correctCorrdinates[j]) > this.threshold) continue;
         
                isOutside = false;
                visited.add(correctCorrdinates[j]);
            }
            if(isOutside) outsides++;
        }


     
        if(visited.size < correctCorrdinates.length * .7) return false;
        if(outsides > corrdinates.length * .3) return false;


        return true;
    }


}

export default TraceFont
