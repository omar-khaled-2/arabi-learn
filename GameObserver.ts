import Participant from "./data/Participant";
import { Question, QuestionDocument } from "./models/question";

interface GameObserver {
    onQuestionChange(question: QuestionDocument,expireAt:Date): void;
    onParticipantChange(participant: Participant): void;
    onCorrectAnswer(): void;
    onWrongAnswer(): void;
    onGameFinished(): void;
}



export default GameObserver