import { useState } from 'react';
import {
    AppBar, Toolbar, Typography, Button, Box, Avatar, IconButton,
    Tooltip, Menu, MenuItem, ListItemIcon, Divider, Container
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import HotelIcon from '@mui/icons-material/Hotel';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function Navbar({ toggleTheme, mode }) {
    const location = useLocation();

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                bgcolor: mode === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(18, 18, 18, 0.85)',
                backdropFilter: 'blur(16px)',
                borderBottom: mode === 'light' ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.05)',
                color: 'text.primary',
                zIndex: 1100
            }}
        >
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>

                    <Typography
                        variant="h5"
                        component={Link}
                        to="/"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            textDecoration: 'none',
                            color: 'primary.main',
                            fontWeight: 800,
                            letterSpacing: '-0.5px'
                        }}
                    >
                        <HotelIcon fontSize="large" />
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
                            HotelBooking
                        </Box>
                    </Typography>

                    <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center' }}>

                        <Tooltip title={mode === 'light' ? "Увімкнути темну тему" : "Увімкнути світлу тему"}>
                            <IconButton onClick={toggleTheme} color="inherit" size="small" sx={{ p: 1 }}>
                                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                            </IconButton>
                        </Tooltip>

                        {token ? (
                            <>
                                {role === 'admin' && (
                                    <Button
                                        component={Link}
                                        to="/admin/dashboard"
                                        variant={location.pathname === '/admin/dashboard' ? "contained" : "outlined"}
                                        color="primary"
                                        startIcon={<DashboardIcon />}
                                        sx={{ display: { xs: 'none', md: 'flex' } }}
                                    >
                                        Адмін-панель
                                    </Button>
                                )}

                                <Tooltip title="Мій акаунт">
                                    <IconButton
                                        onClick={handleMenuOpen}
                                        size="small"
                                        sx={{
                                            p: 0.5,
                                            border: mode === 'light' ? '1px solid #eaeaea' : '1px solid #333',
                                            transition: 'all 0.2s',
                                            '&:hover': { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' }
                                        }}
                                    >
                                        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                                            {role === 'admin' ? '👑' : '👤'}
                                        </Avatar>
                                    </IconButton>
                                </Tooltip>

                                <Menu
                                    anchorEl={anchorEl}
                                    open={open}
                                    onClose={handleMenuClose}
                                    onClick={handleMenuClose}
                                    PaperProps={{
                                        elevation: 0,
                                        sx: {
                                            overflow: 'visible',
                                            filter: mode === 'light' ? 'drop-shadow(0px 10px 20px rgba(0,0,0,0.1))' : 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))',
                                            mt: 1.5,
                                            borderRadius: 2,
                                            minWidth: 200,
                                            '&::before': {
                                                content: '""', display: 'block', position: 'absolute', top: 0, right: 18,
                                                width: 10, height: 10, bgcolor: 'background.paper', transform: 'translateY(-50%) rotate(45deg)', zIndex: 0,
                                            },
                                        },
                                    }}
                                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                >
                                    {role === 'admin' && (
                                        <MenuItem component={Link} to="/admin/dashboard" sx={{ display: { xs: 'flex', md: 'none' }, py: 1.5 }}>
                                            <ListItemIcon><DashboardIcon fontSize="small" color="primary" /></ListItemIcon>
                                            Адмін-панель
                                        </MenuItem>
                                    )}

                                    {role !== 'admin' && (
                                        <MenuItem component={Link} to="/profile" sx={{ py: 1.5 }}>
                                            <ListItemIcon><AccountCircleIcon fontSize="small" color="primary" /></ListItemIcon>
                                            Особистий кабінет
                                        </MenuItem>
                                    )}

                                    <Divider />

                                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main', py: 1.5 }}>
                                        <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                                        Вийти з акаунта
                                    </MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <Button
                                component={Link}
                                to="/login"
                                variant="contained"
                                color="primary"
                                sx={{ boxShadow: mode === 'light' ? '0px 4px 10px rgba(255, 90, 95, 0.3)' : 'none' }}
                            >
                                Увійти
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}