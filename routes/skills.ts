
import { createSkillHandler, getSkillHandler, getSkillsHandler } from "../handlers/skills";
import { Router } from "express";

const router = Router();

router.get("/:id",getSkillHandler);


router.post("/",createSkillHandler);
router.get("/",getSkillsHandler);




export default router