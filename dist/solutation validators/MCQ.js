"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MCQ {
    constructor() {
    }
    validate(question, answer) {
        const options = question.options;
        for (const option of options)
            if (option.id == answer)
                return option.isCorrect;
        return false;
    }
}
MCQ.instace = new MCQ();
exports.default = MCQ;
