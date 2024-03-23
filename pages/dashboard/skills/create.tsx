


import EditLayout from "@/layouts/EditLayout";
import SkillService from "@/services/SkillService";
import { Alert, Button, Snackbar, Stack, TextField } from "@mui/material"
import { useRouter } from "next/router";
import { FormEventHandler, useEffect, useState } from "react"


interface CreateSkillPageState {
    name:string,
    createdId?: string;
    isError: boolean;
    isLoading: boolean;
    canSubmit: boolean;
    editable: boolean;
    message?: string;
}

class CreateSkillPageActive implements CreateSkillPageState {

    isError: boolean = false;
    isLoading: boolean = false;
    canSubmit: boolean = true;
    editable: boolean = true;
    constructor(
        public name: string = "",
    ) {
        
    }
}
class CreateSkillPageSuccess implements CreateSkillPageState {
    isError: boolean = false;
    isLoading: boolean = false;
    canSubmit: boolean = true;
    editable: boolean = false;
    constructor(
        public name: string,
        public createdId: string
    ) {
        
    }
}
class CreateSkillPageLoading implements CreateSkillPageState {
    isError: boolean = false;
    isLoading: boolean = true;
    canSubmit: boolean = false;
    editable: boolean = false;
    constructor(
        public name: string,
    ) {
        
    }
}

class CreateSkillPageError implements CreateSkillPageState {

    isError: boolean = true;
    isLoading: boolean = false;
    canSubmit: boolean = false;
    editable: boolean = false;
    constructor(
        public name: string,
        public message: string
    ) {
        
    }
}

const CreateSkillViewModel = () => {
    const [state, setState] = useState<CreateSkillPageState>(new CreateSkillPageActive())
    
    const changeName = (value: string) => {
        setState(new CreateSkillPageActive(
            value
        ))
    }


    const sumbit = async () => {

        try {
            setState(new CreateSkillPageLoading(
                state.name
            ))

            const skill = await SkillService.instance.create({
                name:state.name,
            });

            setState(new CreateSkillPageSuccess(
                state.name,
                skill.id,
            ))

        } catch (error:any) {
            
            setState(new CreateSkillPageError(
                state.name,
                error.message
                
            ))
        }
    }

    const errorDone = () => {
        setState(new CreateSkillPageActive(
            state.name
        ))
    }
    
    return {
        state,
        changeName,
        errorDone,
        sumbit
    }
}

const CreateSkillPage = () => {
    const {state, changeName,errorDone, sumbit} = CreateSkillViewModel()

    const router = useRouter()

    useEffect(() => {
        if(state.createdId){
            router.push(`/dashboard/skills/${state.createdId}`)
        }
    },[state.createdId])


    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        if(!state.canSubmit) 
            throw new Error("can't submit");
        sumbit()

    }
    return (
        <EditLayout title="Create Skill">


        <Stack component="form" onSubmit={handleSubmit} spacing={2}>
        <TextField label="Name"  value={state.name} onChange={(e) => changeName(e.target.value)} required   />
        <Button type="submit" disabled={!state.canSubmit}>
            Create
        </Button>
        <Snackbar open={state.isError} onClose={errorDone} autoHideDuration={6000}>
            <Alert severity="error">{state.message}</Alert>
        </Snackbar>
    </Stack>
    </EditLayout>
    )
}


export default CreateSkillPage