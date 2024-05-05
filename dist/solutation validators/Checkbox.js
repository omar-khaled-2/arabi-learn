"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Checkbox {
    constructor() {
    }
    validate(question, answers) {
        const correctOptions = question.options.filter(option => option.isCorrect).map(option => option.id);
        if (correctOptions.length != answers.length)
            return false;
        for (let answer of answers) {
            if (correctOptions.indexOf(answer) == -1)
                return false;
        }
        return true;
    }
}
Checkbox.instace = new Checkbox();
exports.default = Checkbox;
