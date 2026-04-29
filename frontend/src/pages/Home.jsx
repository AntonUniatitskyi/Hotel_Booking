import { useState, useEffect } from 'react';
import {
    Box, Typography, Container, Grid, Card, CardMedia, CardContent,
    Button, Skeleton, Paper, TextField, InputAdornment, Divider
} from '@mui/material';
import { Link } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import api from '../api';

export default function Home() {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);

    const userRole = localStorage.getItem('role');

    useEffect(() => {
        api.get('hostels/')
            .then(response => {
                const data = response.data.results ? response.data.results : response.data;
                const activeHotels = data.filter(hotel => hotel.is_active !== false);
                setHotels(activeHotels);
            })
            .catch(error => {
                console.error("Помилка при завантаженні готелів:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <Box>
            {/* ========================================== */}
            {/* 1. HERO SECTION З АТМОСФЕРНИМ ФОТО         */}
            {/* ========================================== */}
            <Box
                sx={{
                    position: 'relative',
                    // Використовуємо якісне фото та м'який градієнт для читабельності тексту
                    backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.5)), url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)',
                    height: { xs: '500px', md: '600px' },
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    textAlign: 'center',
                    mt: -4, // Підтягуємо під прозорий Navbar
                    px: 2
                }}
            >
                <Typography variant="h2" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2.5rem', md: '4.5rem' }, textShadow: '0px 4px 15px rgba(0,0,0,0.4)' }}>
                    Знайди свій ідеальний відпочинок
                </Typography>
                <Typography variant="h5" sx={{ textShadow: '0px 2px 8px rgba(0,0,0,0.4)', opacity: 0.9 }}>
                    Бронюй найкращі готелі та апартаменти по всьому світу.
                </Typography>
            </Box>

            {/* ========================================== */}
            {/* ПЛАВАЮЧА ПАНЕЛЬ ПОШУКУ З GLASSMORPHISM      */}
            {/* ========================================== */}
            <Container maxWidth="md" sx={{ position: 'relative', mt: { xs: -4, md: -7 }, mb: 10, zIndex: 2 }}>
                <Box sx={{
                    p: 1,
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(20px)', // Ефект сильного розмиття
                    borderRadius: '60px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 1.5,
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            alignItems: 'center',
                            gap: 2,
                            borderRadius: '50px',
                            bgcolor: 'white',
                        }}
                    >
                        <TextField
                            fullWidth
                            placeholder="Куди ви їдете?"
                            variant="standard"
                            InputProps={{
                                disableUnderline: true,
                                startAdornment: <InputAdornment position="start"><LocationOnIcon color="primary" /></InputAdornment>,
                            }}
                            sx={{ px: 2 }}
                        />
                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                        <TextField
                            fullWidth
                            placeholder="Заїзд - Виїзд"
                            variant="standard"
                            InputProps={{
                                disableUnderline: true,
                                startAdornment: <InputAdornment position="start"><CalendarMonthIcon color="primary" /></InputAdornment>,
                            }}
                            sx={{ px: 2 }}
                        />
                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                        <TextField
                            fullWidth
                            placeholder="Хто їде?"
                            variant="standard"
                            InputProps={{
                                disableUnderline: true,
                                startAdornment: <InputAdornment position="start"><PersonOutlineIcon color="primary" /></InputAdornment>,
                            }}
                            sx={{ px: 2 }}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            sx={{
                                borderRadius: '50px',
                                px: 4,
                                py: 1.8,
                                minWidth: '160px',
                                fontSize: '1rem',
                                boxShadow: '0px 8px 20px rgba(255, 90, 95, 0.4)'
                            }}
                            startIcon={<SearchIcon />}
                        >
                            Пошук
                        </Button>
                    </Paper>
                </Box>
            </Container>

            {/* СПИСОК ГОТЕЛІВ */}
            <Container sx={{ mb: 10 }}>
                <Typography variant="h4" fontWeight="bold" mb={1}>
                    Популярні напрямки
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={5}>
                    Місця, які обирають найчастіше
                </Typography>

                <Grid container spacing={4}>
                    {loading ? (
                        Array.from(new Array(3)).map((_, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card sx={{ borderRadius: 4 }}>
                                    <Skeleton variant="rectangular" height={250} />
                                    <CardContent sx={{ p: 3 }}>
                                        <Skeleton variant="text" height={40} width="80%" />
                                        <Skeleton variant="text" height={20} width="60%" />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    ) : (
                        hotels.map((hotel) => (
                            <Grid item xs={12} sm={6} md={4} key={hotel.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 4,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-10px)',
                                            boxShadow: '0px 20px 40px rgba(0,0,0,0.1)'
                                        }
                                    }}
                                >
                                    <Box sx={{ overflow: 'hidden', position: 'relative' }}>
                                        <CardMedia
                                            component="img"
                                            height="250"
                                            image={hotel.main_image || "https://placehold.co/600x400?text=No+Image"}
                                            alt={hotel.name}
                                            sx={{
                                                transition: '0.6s',
                                                '&:hover': { transform: 'scale(1.1)' }
                                            }}
                                        />
                                        <Box sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(255, 255, 255, 0.9)', px: 1.5, py: 0.5, borderRadius: 2, fontWeight: 'bold', color: 'primary.main', fontSize: '0.8rem', backdropFilter: 'blur(4px)' }}>
                                            Топ вибір
                                        </Box>
                                    </Box>

                                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                                            {hotel.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <LocationOnIcon fontSize="small" color="disabled" />
                                            {hotel.city}, {hotel.address}
                                        </Typography>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Button
                                                component={Link}
                                                to={`/hostel/${hotel.id}`}
                                                variant="outlined"
                                                sx={{ borderRadius: '50px', px: 3 }}
                                            >
                                                Деталі
                                            </Button>

                                            {userRole !== 'admin' && (
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    sx={{ borderRadius: '50px', px: 3 }}
                                                    component={Link}
                                                    to={`/hotels/${hotel.id}`}
                                                >
                                                    Book Now
                                                </Button>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            </Container>
        </Box>
    );
}