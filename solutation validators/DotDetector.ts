
import {  QuestionDocument } from "../models/question"
import Coordinate from "../Coordinate";
import { S3Client } from "@aws-sdk/client-s3";
import {minWeightAssign} from 'munkres-algorithm';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, REGION } from "../constants";
import dbscan from "../dbscan";

import fs from 'fs'


const s3Client = new S3Client({
    region:REGION,
    credentials: {
        accessKeyId:AWS_ACCESS_KEY_ID,
        secretAccessKey:AWS_SECRET_ACCESS_KEY
    }
})


function generateRandomHexColor() {
    // Generate random values for red, green, and blue components
    var r = Math.floor(Math.random() * 256);
    var g = Math.floor(Math.random() * 256);
    var b = Math.floor(Math.random() * 256);

    // Convert decimal to hexadecimal
    var hexR = r.toString(16).padStart(2, '0');
    var hexG = g.toString(16).padStart(2, '0');
    var hexB = b.toString(16).padStart(2, '0');

    // Concatenate the hexadecimal values
    var hexColor = '#' + hexR + hexG + hexB;

    return hexColor;
}


class DotDetector{
    static readonly instace = new DotDetector()

    private DISTANCE_THRESHOLD = 30
    private constructor() {}
    validate(question:QuestionDocument,points:number[]): boolean {
     

        if(points.length == 0) return false;
        const pointCoordinates:Coordinate[] = [];
  



        for(let i = 0;i < points.length;i += 2){
            if(points[i] == -1){
                i--;
                continue;
            }

            const x = points[i];
            const y = points[i + 1];

            pointCoordinates.push(new Coordinate(x,y))
        }

        const clusterIds = dbscan(pointCoordinates,5,2);

        const n = Math.max(...clusterIds) + 1;



        

        const sum = Array(n * 2).fill(0);
        const count = Array(n).fill(0);

        for(let i = 0;i < pointCoordinates.length;i++){
            if(clusterIds[i] == -1) continue;

            const x = pointCoordinates[i].x;
            const y = pointCoordinates[i].y;
            sum[clusterIds[i] * 2] += x;
            sum[clusterIds[i] * 2 + 1] += y;
            count[clusterIds[i]]++;
        }

        const dots = [];

        const colors = new Array(n).fill(0).map(() => generateRandomHexColor());




        for(let i = 0;i < n;i++){
            if(count[i] == 0) continue;
            const x = Math.round(sum[i * 2] / count[i]);
            const y = Math.round(sum[i * 2 + 1] / count[i]);
            dots.push(new Coordinate(x,y));

        }

 



    
        const correctDots:Coordinate[] = [];

        for(let i = 0;i < question.dots.length;i+=2){
            correctDots.push(new Coordinate(question.dots[i],question.dots[i+1]))
        }



        if(correctDots.length != dots.length) return false;


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