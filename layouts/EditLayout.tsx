import { Container } from "@mui/material"
import DashboardLayout, { DashboardLayoutProps } from "./DashboardLayout"
import React from "react";

interface EditLayoutProps extends DashboardLayoutProps{
    title:string;
}

const EditLayout:React.FC<EditLayoutProps> = ({children,...props}) => {
    return (
    <DashboardLayout {...props}>
        <Container sx={{padding:theme => theme.spacing(2)}} maxWidth="sm">
            {children}
        </Container>
    </DashboardLayout>
    )
}


export default EditLayout