import { Skill, SkillDocument } from "@/models/skill";
import Serializer from "./serializer";

export const skillSerializer = (document:SkillDocument):Skill => {
    return {
        id:document._id as string,
        name:document.name,
        maxDifficulty:document.maxDifficulty
    }
}

class SkillSerializer extends Serializer<SkillDocument>{
    serialize(): any {
        return skillSerializer(this.object)
    }
}


export default SkillSerializer