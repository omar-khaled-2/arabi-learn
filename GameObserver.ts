import Participant from "./data/Participant";
import { Question } from "./models/question";

interface GameObserver {
    onQuestionChange(question: Question,expireAt:Date): void;
    onParticipantChange(participant: Participant): void;
    onCorrectAnswer(): void;
    onWrongAnswer(): void;
    onGameFinished(): void;
}



export default GameObserver