import * as React from 'react';
import MuiAppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import GitHubIcon from '@mui/icons-material/GitHub';
import ExtensionIcon from '@mui/icons-material/Extension';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Tooltip from '@mui/material/Tooltip';
import Link from "./Link";

const linkProps = {
    color: 'inherit',
    target: "_blank"
}

export default function AppBar() {
    return (
        <Box sx={{ flexGrow: 1 }}>
            <MuiAppBar position="fixed">
                <Toolbar sx={{flexWrap: 'wrap'}}>
                    <Typography
                        variant={"h4"}
                        component={"h1"}
                        sx={{display: 'flex', flexGrow: 1, justifyContent: {xs: 'center', sm: 'flex-start' }}}
                    >
                        <Link href={"/"} color={"inherit"} underline={"none"}>
                            OctoPrint OneDrive Backup
                        </Link>
                    </Typography>
                    <Box sx={{
                        display: 'flex',
                        flexGrow: {xs: 1, sm: 0 },
                        flexWrap: 'wrap',
                        my: 1,
                        justifyContent: 'center',
                        '& > .MuiLink-root': {mx: 2}
                    }}>
                        <Link
                            href={"https://plugins.octoprint.org/by_author/#charlie-powell"}
                            underline={"none"}
                            {...linkProps}
                        >
                            <Tooltip title="Plugins" placement="bottom">
                                <ExtensionIcon/>
                            </Tooltip>
                        </Link>
                        <Link
                            href={"https://github.com/sponsors/cp2004"}
                            underline={"none"}
                            {...linkProps}
                        >
                            <Tooltip title={"Sponsor"} placement={"bottom"}>
                                <FavoriteIcon/>
                            </Tooltip>
                        </Link>
                        <Link
                            href={"https://github.com/cp2004/OctoPrint-Onedrive-Backup"}
                            underline={"none"}
                            {...linkProps}
                        >
                            <Tooltip title="Source" placement="bottom">
                                <GitHubIcon/>
                            </Tooltip>
                        </Link>
                    </Box>
                </Toolbar>
            </MuiAppBar>
        </Box>
    );
}