import EditLayout from "@/layouts/EditLayout"
import { Question } from "@/models/question"
import QuestionService from "@/services/QuestionService";
import { Visibility } from "@mui/icons-material";
import { Button, IconButton, OutlinedInput, Stack, TextField } from "@mui/material"
import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { FormEventHandler, useState } from "react";

interface EditQuestionPageState {
    question: Question,
    editable: boolean,
    isLoading: boolean,
    enableSubmit: boolean,
    isSuccess: boolean,
    isError: boolean,
    message?: string

}

class EditQuestionPageInitial  implements EditQuestionPageState {
    editable: boolean = true;
    isLoading: boolean = false;
    enableSubmit: boolean = false;
    isSuccess: boolean = false;
    isError: boolean = false;

    constructor(
        public question: Question
    ){}

}

class EditQuestionPageEditable implements EditQuestionPageState {
    editable: boolean = true;
    isLoading: boolean = false;
    enableSubmit: boolean = true;
    isSuccess: boolean = false;
    isError: boolean = false;

    constructor(
        public question: Question
    ){}
}

class EditQuestionPageLoading implements EditQuestionPageState {
    editable: boolean = false;
    isLoading: boolean = true;
    enableSubmit: boolean = false;
    isSuccess: boolean = false;
    isError: boolean = false;

    constructor(
        public question: Question
    ){}
}

class EditQuestionPageError implements EditQuestionPageState {
    editable: boolean = false;
    isLoading: boolean = false;
    enableSubmit: boolean = false;
    isSuccess: boolean = false;
    isError: boolean = true;

    constructor(
        public question: Question,
        public message: string
    ){}
}

class EditQuestionPageSuccess implements EditQuestionPageState {
    editable: boolean = false;
    isLoading: boolean = false;
    enableSubmit: boolean = false;
    isSuccess: boolean = true;
    isError: boolean = false;
    constructor(
        public question: Question,
    ){}
}


const useEditQuestionViewModel = (question: Question) => {
    const [state, setState] = useState(new EditQuestionPageInitial(question))

    const changeText = (value: string) => {
        setState(new EditQuestionPageEditable({
            ...state.question,
            text: value
        }))
    }



    const changeDifficulty = (value: number) => {
        setState(new EditQuestionPageEditable({
            ...state.question,
            difficulty: value
        }))
    }




    const submit = () => {
        
    }

    return {state,changeText,changeDifficulty,submit}
}

interface EditQuestionPageProps {
    question: Question
}
const EditQuestionPage:NextPage<EditQuestionPageProps> = ({question}) => {
    const {state,changeText,changeDifficulty,submit} = useEditQuestionViewModel(question)
    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        if(!state.enableSubmit) 
            throw new Error("can't submit");
        submit()
    }
    return <EditLayout title="Edit Question">
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            <TextField label="Id" value={state.question.id} disabled />
            <TextField label="Text" value={state.question.text} onChange={(e) => changeText(e.target.value)} required disabled={!state.editable}   />
            <TextField label="Difficulty" type="number" value={state.question.difficulty} onChange={(e) => changeDifficulty(+e.target.value)} required disabled={!state.editable}   />
            <TextField label="Skill" value={state.question.skillId} disabled InputProps={{
    
                endAdornment: <IconButton component={Link} href={`/dashboard/skills/${state.question.skillId}`}>
                    <Visibility />
                </IconButton>
                
            }} />
            <TextField label="Solution Validator" value={state.question.solutionValidator} disabled={true}   />
            <Button type="submit" disabled={!state.enableSubmit}>
                save
            </Button>
        </Stack>
    </EditLayout>
}


export const getServerSideProps: GetServerSideProps = async (context) => {
    const id = context.params?.id as string;
    const question = await QuestionService.instance.get(id)
    return {
        props: {
            question
        }
    }
}


export default EditQuestionPage