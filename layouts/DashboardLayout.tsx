import { Box, List, ListItem, ListItemButton, ListItemText, Paper, Stack } from "@mui/material"
import RootLayout, { RootLayoutProps } from "./RootLayout"
import React from "react"
import Link from "next/link"
import { useRouter } from "next/router"


interface SideLinkProps {
    title: string,
    href: string
}

const SideLink:React.FC<SideLinkProps> = ({title,href}) => {
    const router = useRouter()

    return <ListItemButton sx={{borderRadius:theme => theme.shape.borderRadius}} onClick={() => router.push(href)}>
        <ListItemText primary={title} primaryTypographyProps={{variant:"subtitle1"}} />
       
    </ListItemButton>
}

export interface DashboardLayoutProps extends Omit<RootLayoutProps,'title'>{
    title?:string
}



const DashboardLayout:React.FC<DashboardLayoutProps> = ({ children,title = "Dashboard" }) => {
    return <RootLayout title={title}>
       <Stack direction="row" flex={1}>
            <Box component={Paper} width={300} padding={theme => theme.spacing(0,2)}>            
                <List >
                <SideLink title="Skills" href="/dashboard/skills"/>
                <SideLink title="Questions" href="/dashboard/questions"/>
                </List>
            </Box>

            <Box flex={1} >
                {children}
            </Box>
        </Stack>
    </RootLayout>
}


export default DashboardLayout