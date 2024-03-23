import { Box } from "@mui/material"
import Head from "next/head"

import { ReactNode } from "react"

export interface RootLayoutProps{
    title:string,
    children:ReactNode
}

const RootLayout:React.FC<RootLayoutProps> = ({title,children}) => {
    return <>
        <Head>
            <title>{title}</title>
        </Head>
        <Box height="100vh" width='100vw' display="flex">
            {children}

        </Box>
    </>
}



export default RootLayout