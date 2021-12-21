import * as React from 'react';
import AppBar from "./AppBar"
import Container from "@mui/material/Container";
import {Divider, Stack, styled} from "@mui/material";
import Typography from "@mui/material/Typography";
import Link from "./Link";

const Offset = styled('div')(({theme}) => theme.mixins.toolbar)

interface LayoutProps {
    children: React.ReactNode
}


export default function Layout ({children}: LayoutProps) {
    return (
        <>
            <AppBar />
            <Offset />
            <Container maxWidth={false} sx={{marginTop: {xs: 4, sm: 2}}}>
                {children}
            </Container>
            <Divider />
            <Stack sx={{m: 8, alignItems: 'center', "& > .MuiTypography-root": {my: 2}}}>
                <Typography variant={"h6"}>
                    OctoPrint OneDrive Backup | Created by Charlie Powell
                </Typography>
            </Stack>
        </>
    )
}