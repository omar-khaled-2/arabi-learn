import path from "path";
import sharp from "sharp";

class TraceFont {
    static readonly instace = new TraceFont()

    private constructor() {}
    async validate(imageBuffer: Buffer,placeholderPath: string,difficulty:number) {
        const placeholder = path.join(__dirname,"..",placeholderPath)

        
        // sharp(imageBuffer).resize({"fit":"contain","width":200,"height":200}).grayscale();
        const buffer = await sharp(placeholder).flatten({background:{r:255,g:255,b:255}}).grayscale().raw().toBuffer();
        
        await sharp(buffer,{raw:{width:200,height:200,channels:1}}).png().toFile("dd.png")
        const nodes = this.bfs(buffer,200)

        const image = await sharp(imageBuffer).resize({"fit":"contain","width":200,"height":200}).flatten({background:{r:255,g:255,b:255}}).grayscale().raw().toBuffer();
       


        const allNodes = new Set<number>();

        const traced = new Set<number>();

        let outside = 0;
        let total = 0;
        const map = new Map<number,number>()


        for(let i = 0;i < nodes.length;i++){
            
            if(image[i] < 100){
                total++
            }

            if(nodes[i] != 0){
                map.set(nodes[i],(map.get(nodes[i]) || 0) + 1)
                allNodes.add(nodes[i])
                if(image[i] < 100){
                    traced.add(nodes[i])
                }

          
                
            }else if(image[i] < 100){
                outside++
            }

        }

        console.log("all nodes : ",allNodes.size)
        console.log("traced nodes : ",traced.size)
        console.log("outside : ",outside / total * 100 + " %")


        
        if(traced.size / allNodes.size < 0.7)
            return false;
        
        if(outside / (total) > .4)
            return false



        return true
    }

    private bfs(imageBuffer: Buffer,width:number): Buffer {
        const result = Buffer.alloc(imageBuffer.length,0);
     
        for(let i = 0;i < imageBuffer.length;i++){
            if(result[i] == 0 && imageBuffer[i] < 220){

                const queue = [i];


                const id = Math.floor(Math.random() * 255)


                for(let i = 0 ;i < 50 && queue.length > 0;i++){ 
                    const size = queue.length;
                    for(let j = 0;j < size;j++){
                        const index = queue.shift()!
                        if(result[index] != 0 || imageBuffer[index] > 220)
                            continue
                    
                        result[index] = id;
    
                        
                        if(index % width > 0){
                            queue.push(index - 1)
                        }
                        if(index % width < width - 1){
                            queue.push(index + 1)
                        }
                        if(index - width >= 0){
                            queue.push(index - width)
                        }
                        if(index + width < imageBuffer.length){
                            queue.push(index + width)
                        }
                    }


                }

     
                
            }
        }

        

        return result;
    }


}

export default TraceFont
