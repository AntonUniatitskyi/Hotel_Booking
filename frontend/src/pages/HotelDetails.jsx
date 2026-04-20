import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Container, Typography, Box, CircularProgress, Grid, Paper, Divider, Button,
    Rating, TextField, List, ListItem, ListItemAvatar, Avatar, ListItemText
} from '@mui/material';
import api from '../api';

export default function HotelDetails() {
    const { id } = useParams(); // ID готелю з URL
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);

    // Стейти для відгуків
    const [reviews, setReviews] = useState([]);
    const [ratingValue, setRatingValue] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchHotelAndReviews = async () => {
            setLoading(true);
            try {
                // Завантажуємо дані готелю та відгуки паралельно
                const [hotelRes, reviewsRes] = await Promise.all([
                    api.get(`hostels/${id}/`),
                    api.get(`reviews/?hostel=${id}`) // Фільтруємо відгуки по ID готелю
                ]);

                setHotel(hotelRes.data);
                setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : reviewsRes.data.results || []);
            } catch (error) {
                console.error("Помилка завантаження даних:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHotelAndReviews();
    }, [id]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewText.trim()) return alert("Будь ласка, напишіть текст відгуку!");

        setIsSubmittingReview(true);
        try {
            const response = await api.post('reviews/', {
                rating: ratingValue,
                text: reviewText,
                hostel: Number(id)
            });

            // Додаємо новий відгук на початок списку
            setReviews([response.data, ...reviews]);
            setReviewText('');
            setRatingValue(5);
            alert("Дякуємо за ваш відгук! 😊");
        } catch (error) {
            console.error("Помилка при збереженні відгуку:", error);
            alert("Не вдалося додати відгук. Перевірте авторизацію.");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (!hotel) return <Typography variant="h5" align="center" mt={5}>Готель не знайдено 😢</Typography>;

    return (
        <Container maxWidth="lg" sx={{ mt: 5, mb: 10 }}>
            {/* ЗАГОЛОВОК І ГОЛОВНЕ ФОТО */}
            <Typography variant="h3" fontWeight="bold" gutterBottom>{hotel.name}</Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                📍 {hotel.city}, {hotel.address}
            </Typography>

            <Box
                component="img"
                src={hotel.main_image}
                alt={hotel.name}
                sx={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: 3, mb: 4 }}
            />

            <Grid container spacing={4}>
                {/* ЛІВА КОЛОНКА */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, mb: 4, boxShadow: 2 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>Про готель</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                            {hotel.about}
                        </Typography>
                    </Paper>

                    <Paper sx={{ p: 3, mb: 4, boxShadow: 2 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>Галерея</Typography>
                        <Divider sx={{ mb: 2 }} />
                        {hotel.gallery_images && hotel.gallery_images.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
                                {hotel.gallery_images.map(img => (
                                    <Box key={img.id} component="img" src={img.image} sx={{ width: 200, height: 150, borderRadius: 2, objectFit: 'cover' }} />
                                ))}
                            </Box>
                        ) : (
                            <Typography color="text.secondary">Фотографій поки немає.</Typography>
                        )}
                    </Paper>

                    {/* БЛОК ВІДГУКІВ */}
                    <Paper sx={{ p: 3, boxShadow: 2 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>Відгуки клієнтів ⭐</Typography>
                        <Divider sx={{ mb: 3 }} />

                        {token ? (
                            <Box component="form" onSubmit={handleReviewSubmit} sx={{ mb: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Залишити відгук</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Rating value={ratingValue} onChange={(e, val) => setRatingValue(val)} size="large" />
                                </Box>
                                <TextField
                                    fullWidth multiline rows={3}
                                    placeholder="Ваш коментар..."
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    sx={{ mb: 2, bgcolor: 'white' }}
                                />
                                <Button type="submit" variant="contained" disabled={isSubmittingReview}>
                                    {isSubmittingReview ? <CircularProgress size={24} /> : "Надіслати"}
                                </Button>
                            </Box>
                        ) : (
                            <Typography sx={{ mb: 3 }} color="text.secondary">
                                <Link to="/login">Увійдіть</Link>, щоб залишити відгук.
                            </Typography>
                        )}

                        {reviews.length > 0 ? (
                            <List>
                                {reviews.map((review) => (
                                    <Box key={review.id}>
                                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                    {review.user_name?.charAt(0).toUpperCase() || 'U'}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="subtitle2" fontWeight="bold">{review.user_name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box sx={{ mt: 1 }}>
                                                        <Rating value={review.rating} readOnly size="small" />
                                                        <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                                                            {review.text}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                        <Divider variant="inset" component="li" />
                                    </Box>
                                ))}
                            </List>
                        ) : (
                            <Typography color="text.secondary" align="center">Відгуків ще немає.</Typography>
                        )}
                    </Paper>
                </Grid>

                {/* ПРАВА КОЛОНКА */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, boxShadow: 3, position: 'sticky', top: 20 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Забронювати зараз</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Оберіть дати та забронюйте ідеальний номер.
                        </Typography>
                        <Button
                            component={Link}
                            to={`/hotels/${hotel.id}`}
                            variant="contained"
                            color="warning"
                            fullWidth
                            size="large"
                            sx={{ fontWeight: 'bold' }}
                        >
                            Забронювати номер
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}