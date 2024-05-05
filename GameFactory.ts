import QuizGame from "./Game";
import GameObserver from "./GameObserver";
import QuestionModel, { Question, QuestionDocument } from "./models/question";
import SkillModel from "./models/skill";

class GameFactory {
    static async createGame(participants: string[], skillId:string, observer:GameObserver): Promise<QuizGame> {

        const skill = await SkillModel.findById(skillId);


        if(!skill)
            throw new Error("skill not found");

        const questions = await QuestionModel.find({skillId});

        
        const questionsGroupedByDifficulty:QuestionDocument[][] = Array(skill.maxDifficulty).fill(null).map(() => []);

        for(const question of questions){
            questionsGroupedByDifficulty[question.difficulty - 1].push(question);
        }

        return new QuizGame(participants, questionsGroupedByDifficulty,observer);
    }
}

export default GameFactory