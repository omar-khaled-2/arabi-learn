import multer from "multer";
import { createQuestionHandler, deleteQuestionHandler, getQuestionHandler,getQuestionsHandler } from "../handlers/questions";
import { Router } from "express";

const router = Router();

const storage = multer.memoryStorage()

const upload = multer({storage})


router.get("/:id",getQuestionHandler);
router.delete("/:id",deleteQuestionHandler);


router.post("/",upload.single("placeholder"),createQuestionHandler);

router.get("/",getQuestionsHandler);




export default router