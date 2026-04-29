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

export default function Navbar() {
    const location = useLocation();

    // Стейти для випадаючого меню
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Відкриття/закриття меню
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
                bgcolor: 'rgba(50, 2, 100, 0.50)',
                backdropFilter: 'blur(16px)', // Ефект матового скла
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                color: 'text.primary',
                zIndex: 1100
            }}
        >
            {/* Container, щоб контент шапки не розповзався на надшироких екранах */}
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>

                    {/* ЛОГОТИП */}
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

                    {/* ПРАВА ЧАСТИНА (Навігація) */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {token ? (
                            <>
                                {/* 👑 КНОПКА АДМІНА (Видна тільки на ПК для швидкого доступу) */}
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

                                {/* АВАТАРКА КОРИСТУВАЧА */}
                                <Tooltip title="Мій акаунт">
                                    <IconButton
                                        onClick={handleMenuOpen}
                                        size="small"
                                        sx={{
                                            p: 0.5,
                                            border: '1px solid #eaeaea',
                                            transition: 'all 0.2s',
                                            '&:hover': { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' }
                                        }}
                                    >
                                        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                                            {role === 'admin' ? '👑' : '👤'}
                                        </Avatar>
                                    </IconButton>
                                </Tooltip>

                                {/* ВИПАДАЮЧЕ МЕНЮ (Dropdown) */}
                                <Menu
                                    anchorEl={anchorEl}
                                    open={open}
                                    onClose={handleMenuClose}
                                    onClick={handleMenuClose}
                                    PaperProps={{
                                        elevation: 0,
                                        sx: {
                                            overflow: 'visible',
                                            filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.1))',
                                            mt: 1.5,
                                            borderRadius: 3,
                                            minWidth: 200,
                                            // Маленький трикутничок зверху меню
                                            '&::before': {
                                                content: '""', display: 'block', position: 'absolute', top: 0, right: 18,
                                                width: 10, height: 10, bgcolor: 'background.paper', transform: 'translateY(-50%) rotate(45deg)', zIndex: 0,
                                            },
                                        },
                                    }}
                                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                >
                                    {/* Пункт адмінки дублюється для мобільних екранів */}
                                    {role === 'admin' && (
                                        <MenuItem component={Link} to="/admin/dashboard" sx={{ display: { xs: 'flex', md: 'none' }, py: 1.5 }}>
                                            <ListItemIcon><DashboardIcon fontSize="small" color="primary" /></ListItemIcon>
                                            Адмін-панель
                                        </MenuItem>
                                    )}

                                    {/* Пункт клієнта */}
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
                            /* ========================================== */
                            /* ЯКЩО ГІСТЬ                                 */
                            /* ========================================== */
                            <Button
                                component={Link}
                                to="/login"
                                variant="contained"
                                color="primary"
                                sx={{ boxShadow: '0px 4px 10px rgba(255, 90, 95, 0.3)' }}
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