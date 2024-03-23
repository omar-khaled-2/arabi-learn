import sharp from "sharp"
import { DotField } from "../models/question"

class DotDetector{
    static readonly instace = new DotDetector()
    private constructor() {}
    async validate(imageBuffer: Buffer,dots : DotField[]): Promise<boolean> {

        const width = 200;
        const height = 200;
        const image = await sharp(imageBuffer).resize({"fit":'fill',"width":width,"height":height}).flatten({background:{r:255,g:255,b:255}}).grayscale().raw().toBuffer();

        


    
        const buffer = Buffer.alloc(width * height * 3,255);

    

        for(let dot of dots){
            const {count,top,left,right,bottom} = dot;
            for(let i = top;i < bottom;i++){
                for(let j = left;j < right;j++){
                    
                    buffer[i * width + j] = count * 80;
                    
                }
            }
        }


        await sharp(buffer,{raw: {width:width,height:height,channels:1}}).png().toFile("ssss.png")
        


        const visited = Array(image.length).fill(false)

        for(let dot of dots){
            const {count,top,left,right,bottom} = dot;
            let accumulator = 0;
            for(let i = top;i < bottom;i++){
                for(let j = left;j < right;j++){
                    if(image[i * width + j] < 100 && !visited[i * width + j]){
                        const queue = [i * width + j];
                        while(queue.length > 0){
                            const index = queue.shift()!;
                            if(visited[index] || image[index] > 100)
                                continue
                            visited[index] = true;

                            if(index % width > 0){
                                queue.push(index - 1)
                            }
                            if(index % width < width - 1){
                                queue.push(index + 1)
                            }
                            if(index - width >= 0){
                                queue.push(index - 200)
                            }
                            if(index + width < image.length){
                                queue.push(index + 200)
                            }
                        }
                        accumulator++;

                        
                        
                    }
                }
            }
         
            if(accumulator !== count)
                return false
        }

        return true;
    }
}


export default DotDetector