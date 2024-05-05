"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const utilties_1 = require("../utilties");
const optionSchema = new mongoose_1.Schema({
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
});
optionSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.isCorrect;
        delete ret.__v;
        return ret;
    },
});
const questionSchema = new mongoose_1.Schema({
    text: { type: String, required: true },
    difficulty: { type: Number, required: true },
    type: { type: String, required: true },
    skillId: { type: String, required: true },
    placeholder: { type: String },
    image: { type: String },
    audio: { type: String },
    points: { type: String },
    expectedWord: { type: String },
    options: { type: [optionSchema] },
    dots: { type: [Number] },
});
questionSchema.set("toJSON", {
    transform: (doc, ret) => {
        if (ret.image)
            ret.image = (0, utilties_1.getS3ObjectUrl)(ret.image);
        if (ret.placeholder)
            ret.placeholder = (0, utilties_1.getS3ObjectUrl)(ret.placeholder);
        if (ret.audio)
            ret.audio = (0, utilties_1.getS3ObjectUrl)(ret.audio);
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const QuestionModel = (0, mongoose_1.model)('Question', questionSchema);
exports.default = QuestionModel;
