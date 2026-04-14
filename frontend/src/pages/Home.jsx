import { useState, useEffect } from 'react';
import { Box, Typography, Container, Grid, Card, CardMedia, CardContent, Button } from '@mui/material';
import axios from 'axios';
import { Link } from 'react-router-dom';


export default function Home() {
    const [hotels, setHotels] = useState([]);

    // Дістаємо "бейджик" користувача (admin або client)
    const userRole = localStorage.getItem('role');

    useEffect(() => {
        axios.get('http://localhost:8000/api/hostels/')
            .then(response => {
                const data = response.data.results ? response.data.results : response.data;
                setHotels(data);
            })
            .catch(error => {
                console.error("Помилка при завантаженні готелів:", error);
            });
    }, []);


    return (
        <Box>
            {/* 1. HERO SECTION (Банер) */}
            <Box
                sx={{
                    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://images.unsplash.com/photo-1499916078039-92be511475c4?q=80&w=2000&auto=format&fit=crop)',
                    height: '500px',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    textAlign: 'center',
                    mt: -4
                }}
            >
                <Typography variant="h2" fontWeight="bold" gutterBottom>
                    Find Your Perfect Stay
                </Typography>
                <Typography variant="h5" mb={4}>
                    Discover the best hotels & resorts worldwide.
                </Typography>
            </Box>

            {/* 2. TOP HOTEL DEALS (Список готелів з бекенду) */}
            <Container sx={{ mt: 6, mb: 6 }}>
                <Typography variant="h4" fontWeight="bold" mb={4}>
                    Top Hotel Deals
                </Typography>

                <Grid container spacing={4}>
                    {hotels.map((hotel) => (
                        <Grid item xs={12} sm={6} md={4} key={hotel.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 3 }}>
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={hotel.main_image ? hotel.main_image : "https://placehold.co/600x400?text=No+Image"}
                                    alt={hotel.name}
                                />
                                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h6" fontWeight="bold">
                                        {hotel.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        {hotel.city}, {hotel.address}
                                    </Typography>

                                    {/* Блок з кнопкою або написом для адміна */}
                                    <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="h6" color="primary.main" fontWeight="bold" component={Link} to={`/hotels/${hotel.id}`} sx={{ textDecoration: 'none' }}>
                                            Детальніше
                                        </Typography>

                                        {/* ЛОГІКА РОЛЕЙ ТУТ */}
                                        {userRole === 'admin' ? (
                                            <Typography variant="caption" color="error" sx={{ fontWeight: 'bold' }}>
                                                Адмін-доступ
                                            </Typography>
                                        ) : (
                                            <Button
                                                variant="contained"
                                                color="warning"
                                                sx={{ textTransform: 'none', borderRadius: 2 }}
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
                    ))}

                    {hotels.length === 0 && (
                        <Typography variant="h6" sx={{ mt: 4, ml: 2, color: 'text.secondary' }}>
                            Завантаження готелів або база даних порожня...
                        </Typography>
                    )}
                </Grid>
            </Container>
        </Box>
    );
}