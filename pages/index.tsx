import * as React from 'react';
import type { NextPage } from 'next';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '../src/components/Link';
import Layout from "../src/components/Layout";
import {Grid} from "@mui/material";
import octoprint from "../public/octoprint.png";
import onedrive from "../public/onedrive.png";
import Image from 'next/image'

const Home: NextPage = () => {
    return (
        <Layout>
            <Grid container>
                <Grid item xs={12} md={6} sx={{textAlign: {xs: "center", md: "right"}, flexGrow: 1}}>
                    <Image src={octoprint} alt={"OctoPrint Logo"} />
                </Grid>
                <Grid item xs={12} md={6} sx={{textAlign: {xs: "center", md: "left", flexGrow: 1}}}>
                    <Image src={onedrive} alt={"OctoPrint Logo"} />
                </Grid>
            </Grid>
            <Box sx={{my: 10, textAlign: "center"}}>
                <Typography variant={"h4"} component={"h1"}>
                    OneDrive Backup Plugin
                </Typography>
                <Typography component={"h2"} variant={"h6"}>
                    This is a landing page to have a verified OneDrive Application, for all the details on the plugin
                    please see the <Link href={"https://github.com/cp2004/OctoPrint-OneDrive-Backup"}>GitHub Repository</Link>.
                </Typography>
            </Box>
        </Layout>
    );
};

export default Home;