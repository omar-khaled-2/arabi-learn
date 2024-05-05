
import {  QuestionDocument } from "../models/question"
import Coordinate from "../Coordinate";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {minWeightAssign} from 'munkres-algorithm';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, REGION } from "../constants";


const s3Client = new S3Client({
    region:REGION,
    credentials: {
        accessKeyId:AWS_ACCESS_KEY_ID,
        secretAccessKey:AWS_SECRET_ACCESS_KEY
    }
})


class DotDetector{
    static readonly instace = new DotDetector()

    private DISTANCE_THRESHOLD = 30
    private constructor() {}
    validate(question:QuestionDocument,points:number[]): boolean {
     

        if(points.length == 0) return false;
        const pointsCoordinates = [];
        const pointCount = [];



        for(let i = points.length - 1;i >= 0;i-=2){
            if(points[i] == -1){
                i++;
                pointsCoordinates.unshift(0,0)
                pointCount.unshift(0)
                continue;
            }

            pointsCoordinates[0] += points[i - 1];
            pointsCoordinates[1] += points[i];
            pointCount[0]++;
        }

        const dots:Coordinate[] = [];
 
    
        for(let i = 0;i < pointsCoordinates.length;i+=2){
            const x = Math.round(pointsCoordinates[i] / pointCount[Math.floor(i / 2)]);
            const y = Math.round(pointsCoordinates[i + 1] / pointCount[Math.floor(i / 2)]);
        
            dots.push(new Coordinate(x,y))

        }

        
        const correctDots:Coordinate[] = [];

        for(let i = 0;i < question.dots.length;i+=2){
            correctDots.push(new Coordinate(question.dots[i],question.dots[i+1]))
        }



        if(correctDots.length != dots.length) return false;


        const n = correctDots.length;
        const distances:number[][] = new Array(n).fill(0).map(() => new Array(n).fill(0))
  

        for(let i = 0;i < n;i++){
            for(let j = 0;j < n;j++){
                distances[i][j] = correctDots[i].getDistance(dots[j])
            }
        }


        const {assignments} = minWeightAssign(distances) as {assignments:number[]};



        for(let i = 0;i < n;i++){
            if(distances[i][assignments[i]] > this.DISTANCE_THRESHOLD) return false
        }
        
     

        return true;
    }
}


export default DotDetector