import EditLayout from "@/layouts/EditLayout"
import { Question } from "@/models/question"
import { Skill } from "@/models/skill";
import QuestionService from "@/services/QuestionService";
import SkillService from "@/services/SkillService";
import { Visibility } from "@mui/icons-material";
import { Button, IconButton, OutlinedInput, Stack, TextField } from "@mui/material"
import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { FormEventHandler, useState } from "react";

interface EditSkillPageState {
    skill: Skill,
    editable: boolean,
    isLoading: boolean,
    enableSubmit: boolean,
    isSuccess: boolean,
    isError: boolean,
    message?: string

}

class EditSkillPageInitial  implements EditSkillPageState {
    editable: boolean = true;
    isLoading: boolean = false;
    enableSubmit: boolean = false;
    isSuccess: boolean = false;
    isError: boolean = false;

    constructor(
        public skill: Skill
    ){}

}

class EditSkillPageEditable implements EditSkillPageState {
    editable: boolean = true;
    isLoading: boolean = false;
    enableSubmit: boolean = true;
    isSuccess: boolean = false;
    isError: boolean = false;

    constructor(
        public skill: Skill
    ){}
}

class EditSkillPageLoading implements EditSkillPageState {
    editable: boolean = false;
    isLoading: boolean = true;
    enableSubmit: boolean = false;
    isSuccess: boolean = false;
    isError: boolean = false;

    constructor(
        public skill: Skill
    ){}
}

class EditSkillPageError implements EditSkillPageState {
    editable: boolean = false;
    isLoading: boolean = false;
    enableSubmit: boolean = false;
    isSuccess: boolean = false;
    isError: boolean = true;

    constructor(
        public skill: Skill,
        public message: string
    ){}
}

class EditSkillPageSuccess implements EditSkillPageState {
    editable: boolean = false;
    isLoading: boolean = false;
    enableSubmit: boolean = false;
    isSuccess: boolean = true;
    isError: boolean = false;
    constructor(
        public skill: Skill,
    ){}
}


const useEditSkillViewModel = (skill: Skill) => {
    const [state, setState] = useState(new EditSkillPageInitial(skill))

    const changeName = (value: string) => {
        setState(new EditSkillPageEditable({
            ...state.skill,
            name: value,
            
        }))
    }




    const submit = () => {
        
    }

    return {state,changeName,submit}
}

interface EditSkillPageProps {
    skill: Skill
}
const EditQuestionPage:NextPage<EditSkillPageProps> = ({skill}) => {
    const {state,changeName,submit} = useEditSkillViewModel(skill)
    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        if(!state.enableSubmit) 
            throw new Error("can't submit");
        submit()
    }
    return <EditLayout title="Edit Question">
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            <TextField label="Id" value={state.skill.id} disabled />
            <TextField label="Text" value={state.skill.name} onChange={(e) => changeName(e.target.value)} required disabled={!state.editable}   />
            <TextField label="Max Difficulty" value={state.skill.maxDifficulty} disabled  />

            <Button type="submit" disabled={!state.enableSubmit}>
                save
            </Button>
        </Stack>
    </EditLayout>
}


export const getServerSideProps: GetServerSideProps = async (context) => {
    const id = context.params?.id as string;
    const skill = await SkillService.instance.get(id)
    return {
        props: {
            skill
        }
    }
}


export default EditQuestionPage