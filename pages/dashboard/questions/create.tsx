import DotField from "@/components/DotField";
import SoluationValidators from "@/data/SoluationValidators";
import EditLayout from "@/layouts/EditLayout";
import { Option } from "@/models/question";
import { Skill } from "@/models/skill";

import QuestionService from "@/services/QuestionService";
import SkillService from "@/services/SkillService";
import { Add, Close, Remove } from "@mui/icons-material";
import { Alert, Autocomplete, Button, Checkbox, FormControl, FormControlLabel, FormGroup, IconButton, InputLabel, MenuItem, Radio, RadioGroup, Select, Snackbar, Stack, TextField } from "@mui/material"
import { set } from "mongoose";
import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { ChangeEventHandler, FormEventHandler, useEffect, useState } from "react"





interface CreateQuestionPageState {
    text:string,
    difficulty:number,
    skillId: string | undefined,
    solutionValidator:string | undefined;
    expectedWord: string;
    placeholder:File | undefined;
    options:Option[]

    createdId?: string;
    isError: boolean;
    isLoading: boolean;
    canSubmit: boolean;
    editable: boolean;
    message?: string;
}

class CreateQuestionPageActive implements CreateQuestionPageState {

    isError: boolean = false;
    isLoading: boolean = false;

    canSubmit: boolean = true;
    editable: boolean = true;
    constructor(
     
        public text: string = "",
        public difficulty: number = 1,
        public skillId: string | undefined = undefined,
        public solutionValidator:string | undefined = undefined,
        public placeholder:File | undefined = undefined,
        public options:Option[] = [],
        public expectedWord: string = "",
    ) {
        
    }
}
class CreateQuestionPageSuccess implements CreateQuestionPageState {
    isError: boolean = false;
    isLoading: boolean = false;
    canSubmit: boolean = true;
    editable: boolean = false;
    constructor(
        public text: string,
        public difficulty: number,
        public skillId: string | undefined,
        public solutionValidator:string | undefined ,
        public placeholder:File | undefined,
        public options:Option[],

        public expectedWord: string,
        public createdId: string
    ) {
        
    }
}
class CreateSkillPageLoading implements CreateQuestionPageState {
    isError: boolean = false;
    isLoading: boolean = true;
    canSubmit: boolean = false;
    editable: boolean = false;
    constructor(
        public text: string,
        public difficulty: number,
        public skillId: string | undefined,
        public solutionValidator:string | undefined,
        public placeholder:File | undefined,
        public options:Option[],

        public expectedWord: string,

    ) {
        
    }
}

class CreateQuestionPageError implements CreateQuestionPageState {

    isError: boolean = true;
    isLoading: boolean = false;
    canSubmit: boolean = false;
    editable: boolean = false;
    constructor(
        public text: string,
        public difficulty: number,
        public skillId: string | undefined ,
        public solutionValidator:string | undefined,
        public placeholder:File | undefined,
        public options:Option[],
        public expectedWord: string,
        public message: string

    ) {
        
    }
}

const CreateQiestionViewModel = () => {
    const [state, setState] = useState<CreateQuestionPageState>(new CreateQuestionPageActive())
    
    const changeText = (value: string) => {
        setState(new CreateQuestionPageActive(
            value,
            state.difficulty,
            state.skillId,
            state.solutionValidator,
            state.placeholder,
            state.options,
            state.expectedWord
        ))
    }

    const changeExpectedWord = (value: string) => {
        setState(new CreateQuestionPageActive(
            state.text,
            state.difficulty,
            state.skillId,
            state.solutionValidator,
            state.placeholder,
            state.options,
            value
            
        ))
    }
    const changeDifficulty = (value: number) => {
        setState(new CreateQuestionPageActive(
            state.text,
            value,
            state.skillId,
            state.solutionValidator,
            state.placeholder,
            state.options,
            state.expectedWord
        ))
    }

    const changeSkill = (value: string) => {
        setState(new CreateQuestionPageActive(
            state.text,
            state.difficulty,
            value,
            state.solutionValidator,
            state.placeholder,
            state.options,
            state.expectedWord
        ))
    }

    const changeSolutionValidator = (value: string) => {
        setState(new CreateQuestionPageActive(
            state.text,
            state.difficulty,
            state.skillId,
            value,
            state.placeholder,
            state.options,
            state.expectedWord
        ))
    }

    const changePlaceholder = (value: File) => {
        setState(new CreateQuestionPageActive(
            state.text,
            state.difficulty,
            state.skillId,
            state.solutionValidator,
            value,
            state.options,
            ""
        ))
    }


    const changeOption = (index: number, value: string) => {
        setState(new CreateQuestionPageActive(
            state.text,
            state.difficulty,
            state.skillId,
            state.solutionValidator,
            state.placeholder,
            [...state.options.slice(0,index),{text:value,isCorrect:state.options[index].isCorrect},...state.options.slice(index+1)],
        ))
    }

    const addOption = () => {
        setState(new CreateQuestionPageActive(
            state.text,
            state.difficulty,
            state.skillId,
            state.solutionValidator,
            state.placeholder,
            [...state.options,{text:"",isCorrect:false}],
            
        ))
    }

    const removeOption = (index: number) => {
        setState(new CreateQuestionPageActive(
            state.text,
            state.difficulty,
            state.skillId,
            state.solutionValidator,
            state.placeholder,
            [...state.options.slice(0,index),...state.options.slice(index+1)],
            
        ))
    }

    const changeOptionIsCorrect = (index: number, value: boolean) => {
        setState(new CreateQuestionPageActive(
            state.text,
            state.difficulty,
            state.skillId,
            state.solutionValidator,
            state.placeholder,
            state.solutionValidator === SoluationValidators.MULTIPLE_CHOICE ? state.options.map((option, i) => i === index ? {...option, isCorrect: value} : {...option, isCorrect: false}) : [...state.options.slice(0,index),{...state.options[index],isCorrect:value},...state.options.slice(index+1)],
            
        )) 
    }

    const sumbit = async () => {

     
        try {
            setState(new CreateSkillPageLoading(
                state.text,
                state.difficulty,
                state.skillId,
                state.solutionValidator,
                state.placeholder,
                state.options,
                state.expectedWord
            ))


            const question = await QuestionService.instance.create({
                text:state.text,
                difficulty:state.difficulty,
                skillId:state.skillId!,
                solutionValidator:state.solutionValidator!,
                expectedWord:state.expectedWord,
                placeholder:state.placeholder,
                options:state.options
            
            });

            setState(new CreateQuestionPageSuccess(
                state.text,
                state.difficulty,
                state.skillId,
                state.solutionValidator,
                state.placeholder,
                state.options,
                state.expectedWord,
                question.id
            ))
        } catch (error:any) {
            
            setState(new CreateQuestionPageError(
                state.text,
                state.difficulty,
                state.skillId,
                state.solutionValidator,
                state.placeholder,
                state.options,
                state.expectedWord,
                error.message
            ))
        }
    }

    

    const errorDone = () => {
        setState(new CreateQuestionPageActive(
            state.text,
            state.difficulty,
            state.skillId,
            state.solutionValidator,
            state.placeholder,
            state.options,
            state.expectedWord
        ))
    }
    
    return {
        state,
        changeText,
        changeExpectedWord,
        changeDifficulty,
        changeSkill,
        changeSolutionValidator,
        changePlaceholder,
        changeOption,
        addOption,
        changeOptionIsCorrect,
        removeOption,
        errorDone,
        sumbit
    }
}

interface CreateQuestionPageProps {
    skills: Skill[],

}

const CreateQuestionPage: NextPage<CreateQuestionPageProps> = ({skills}) => {
    const {state,changeExpectedWord,changeText,changeDifficulty,changeSkill,changeSolutionValidator,changeOptionIsCorrect,changePlaceholder,errorDone,changeOption,removeOption,addOption, sumbit} = CreateQiestionViewModel()

    const router = useRouter()


    const handleChangePlaceholder: ChangeEventHandler<HTMLInputElement> = (event) => {
        if(event.target.files === null || event.target.files.length === 0) 
            return ;
        changePlaceholder(event.target.files[0])
        
        
    }

    useEffect(() => {
        if(state.createdId){
            router.push(`/dashboard/questions/${state.createdId}`)
        }
    },[state.createdId])


    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        if(!state.canSubmit) 
            throw new Error("can't submit");
        sumbit()

    }
    return <EditLayout title="Create Question">
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <TextField label="Text"  value={state.text} onChange={(e) => changeText(e.target.value)} required   />
        <TextField label="Difficulty"  type="number" value={state.difficulty} onChange={(e) => changeDifficulty(+e.target.value)} required   />
        <Stack direction="row" spacing={2}>
        <FormControl sx={{flex:1}}>
            <InputLabel id="skill-label">Skill</InputLabel>
            <Select
                labelId="skill-label"

                value={state.skillId}
                label="Skill"
                onChange={(e) => changeSkill(e.target.value)}
            >
                {skills.map(skill => <MenuItem key={skill.id} value={skill.id}>{skill.name}</MenuItem>)}
            </Select>
            </FormControl>
        </Stack>
        <Stack direction="row" spacing={2}>
        <FormControl sx={{flex:1}}>
            <InputLabel id="soluation-validator-label">Soluation validator</InputLabel>
            <Select
                labelId="soluation-validator-label"

                value={state.solutionValidator}
                label="Soluation validator"
                onChange={(e) => changeSolutionValidator(e.target.value)}
            >
                {Object.values(SoluationValidators).map(validator => <MenuItem key={validator} value={validator}>{validator}</MenuItem>)}
            </Select>
            </FormControl>
        </Stack>
        {
            state.solutionValidator && 
                state.solutionValidator == SoluationValidators.ARABIC_OCR ? <TextField label="Expected Word"  value={state.expectedWord} onChange={(e) => changeExpectedWord(e.target.value)}   /> 
                : state.solutionValidator == SoluationValidators.TRACING_FONT || state.solutionValidator == SoluationValidators.DOT_DETECTOR ? <input type="file" onChange={handleChangePlaceholder}    />
                : state.solutionValidator == SoluationValidators.MULTIPLE_CHOICE ?  <Stack direction="row" alignItems="center">
                     <RadioGroup value={state.options.findIndex(option => option.isCorrect)} onChange={(e,index) => changeOptionIsCorrect(+index,true)} >
                {
                    state.options.map((option,index) => <FormControlLabel key={index} value={index} control={<Radio />}  label={<TextField size="small" value={option.text} onChange={(e) => changeOption(index,e.target.value)} InputProps={{endAdornment: <IconButton onClick={() => removeOption(index)}><Close /></IconButton>}} />} />)
                }
          
    
                </RadioGroup> <IconButton onClick={addOption}><Add /></IconButton> </Stack> : 
                state.solutionValidator == SoluationValidators.CHECKBOXS ? <Stack  direction="row" alignItems="center">
                    <FormGroup >
                        {state.options.map((option,index) => <FormControlLabel key={index} control={<Checkbox checked={option.isCorrect} onChange={(e) => changeOptionIsCorrect(index,e.target.checked)} />} label={<TextField size="small" value={option.text} onChange={(e) => changeOption(index,e.target.value)} InputProps={{endAdornment: <IconButton onClick={() => removeOption(index)}><Close /></IconButton>}} />} />)}
                    </FormGroup>
                    <IconButton onClick={addOption}><Add /></IconButton>
                </Stack> : null
        }



        <Button type="submit" disabled={!state.canSubmit}>
            Create
        </Button>
        <Snackbar open={state.isError} onClose={errorDone} autoHideDuration={6000}>
            <Alert severity="error">{state.message}</Alert>
        </Snackbar>
    </Stack>
    </EditLayout>
}


export const getServerSideProps:GetServerSideProps = async() => {
    const skills = await SkillService.instance.getAll();

 
    return {
        props: {
            skills,

        }
    }
}

export default CreateQuestionPage