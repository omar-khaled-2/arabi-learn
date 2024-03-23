import {LayersModel, loadLayersModel,node,tensor,Tensor}  from "@tensorflow/tfjs-node"
import path from "path";
import sharp from "sharp";

class ArabicOCR {

    model:LayersModel | null = null;

    words = [
        'أرز', 'أسماء', 'بنت', 'بيت', 'تمساح', 'ثعبان', 'ثعلب', 'ثلج', 'ثمرة', 'جزر', 
        'حلم', 'حوت', 'حياة', 'خوخ', 'دار', 'دجاجة', 'درس', 'ديك', 'ذرة', 'ذكي', 
        'ذهب', 'رسم', 'رمان', 'ساعة', 'سمكة', 'شارع', 'شجرة', 'شمس', 'شمع', 'شنطة', 
        'صحراء', 'صقر', 'طفل', 'ظبي', 'عسل', 'علم', 'عنب', 'غراب', 'فراولة', 'فول', 
        'قرد', 'قطة', 'قلم', 'قمر', 'كتاب', 'كلب', 'ماء', 'منضدة', 'موز', 'نار', 
        'نجمة', 'ولد', 'يد'
      ];
      
    static readonly instace = new ArabicOCR()

    

    private constructor(){
        loadLayersModel("file://"+ path.join(__dirname,"..","ai","old","model.json"))
            .then((model)=>{
                this.model = model
            })
            .catch(console.log)
    }
    async validate(image:Buffer,expectedText:string):Promise<boolean>{
        const content = await sharp(image).resize({"fit":"contain","width":100,"height":100}).flatten({background:{r:255,g:255,b:255}}).grayscale().raw().toBuffer()
        let x1 = 999999;
        let x2 = 0;
        let y1 = 999999;
        let y2 = 0;
        for(let i = 0;i < content.length;i++){
            if(content[i] > 200)
                continue;
            x1 = Math.min(x1,i % 100)
            x2 = Math.max(x2,i % 100)
            y1 = Math.min(y1,Math.floor(i / 100))
            y2 = Math.max(y2,Math.floor(i / 100))
        }
        const data = await sharp(content,{raw:{width:100,height:100,channels:1}}).extract({left:x1,top:y1,width:x2 - x1 + 1,height:y2 - y1 + 1}).resize({"fit":"fill","width":150,"height":150}).grayscale().raw().toBuffer()
        const ten = tensor(data).reshape([1,150,150,1])
        const result = this.model!.predict(ten) as Tensor;
        const index = (await result.argMax(1).data())[0]
        console.log(this.words[index])
        return this.words[index] == expectedText
    }
}

export default ArabicOCR