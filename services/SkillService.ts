import { AxiosError } from "axios";
import axios from "../axios";
import { Skill } from "../models/skill";


interface CreateSkillParams{
    name: string
}
class SkillService{
    static readonly instance = new SkillService();

    private constructor(){};

    async create(skill:CreateSkillParams):Promise<Skill>{
        try{
            const response = await axios.post("/skills/", skill);
            return response.data;
        }catch(error){
            if(error instanceof AxiosError){
                throw new Error(error.response?.data.message)
            }
            throw Error("unknown error")
        }

    }

    async getAll():Promise<Skill[]>{
        const response = await axios.get("/skills/");
        return response.data
    }

    async get(id: string):Promise<Skill>{
        const response = await axios.get(`/skills/${id}`);
        return response.data
    }
}

export default SkillService