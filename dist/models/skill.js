"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const skillSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    maxDifficulty: { type: Number, required: true, default: 0 },
});
skillSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
const SkillModel = (0, mongoose_1.model)('Skill', skillSchema);
exports.default = SkillModel;
