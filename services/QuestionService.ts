import { AxiosError } from "axios";
import axios from "../axios";
import { Option, Question } from "../models/question";


interface GetAllQuestionsParams {
    page?: number;
    pageSize?: number;
}

interface GetAllQuestionsResult {
    total: number;
    data: Question[]
}


interface CreateQuestionParams{
    text: string;
    difficulty: number;
    skillId: string;
    solutionValidator: string;
    placeholder?: File;
    image?: File;
    expectedWord?: string;
    options: Option[]
}

class QuestionService{
    static readonly instance = new QuestionService();

    private constructor(){};

    async create(question:CreateQuestionParams):Promise<Question>{
        try{
            const formData = new FormData();
            formData.append("text",question.text);
            formData.append("difficulty",question.difficulty.toString());
            formData.append("skillId",question.skillId);
            formData.append("solutionValidator",question.solutionValidator);
            if(question.placeholder)
                formData.append("placeholder",question.placeholder);

            if(question.expectedWord)
                formData.append("expectedWord",question.expectedWord);

            if(question.options.length > 0)
                formData.append("options",JSON.stringify(question.options))

       
            const response = await axios.post("/questions/",formData);
            return response.data;
        }catch(error){
            if(error instanceof AxiosError){
                if(!error.response)
                    throw new Error("Connection error")

                throw new Error(error.response!.data.message || "Something went wrong")
            }
            throw Error("unknown error")
        }

    }

    async getAll(params:GetAllQuestionsParams):Promise<GetAllQuestionsResult>{
        try{
            const response = await axios.get("/questions/",{
                params:{
                    page:params.page,
                    pageSize:params.pageSize
                }
            });
            return response.data
        }catch(error){
            if(error instanceof AxiosError){
                throw new Error(error.response?.data.message || "Something went wrong")
            }
            throw Error("unknown error")
        }

    }

    async get(id: string):Promise<Question>{
        
        const response = await axios.get(`/questions/${id}`);
        return response.data
    }

    async delete(id: string):Promise<void>{
        try{
            await axios.delete(`/questions/${id}`);
        }catch(error){
            if(error instanceof AxiosError){
                throw new Error(error.response?.data.message || "Something went wrong")
            }
            throw Error("unknown error")
        }


    }
}

export default QuestionService