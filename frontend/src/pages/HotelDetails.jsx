import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Container, Typography, Box, CircularProgress, Grid, Paper, Divider, Button,
    Rating, TextField, List, ListItem, ListItemAvatar, Avatar, ListItemText,
    Snackbar, Alert // Додаємо імпорти для спливаючих повідомлень
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HotelIcon from '@mui/icons-material/Hotel';
import api from '../api';

export default function HotelDetails() {
    const { id } = useParams();
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);

    const [reviews, setReviews] = useState([]);
    const [ratingValue, setRatingValue] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // ==========================================
    // СТЕЙТ ДЛЯ СНАКБАРІВ
    // ==========================================
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchHotelAndReviews = async () => {
            setLoading(true);
            try {
                const [hotelRes, reviewsRes] = await Promise.all([
                    api.get(`hostels/${id}/`),
                    api.get(`reviews/?hostel=${id}`)
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

    const showNotify = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    // ==========================================
    // ОБРОБКА ВІДПРАВКИ ВІДГУКУ
    // ==========================================
    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewText.trim()) {
            return showNotify("Будь ласка, напишіть текст відгуку!", "warning");
        }

        setIsSubmittingReview(true);
        try {
            const response = await api.post('reviews/', {
                rating: ratingValue,
                text: reviewText,
                hostel: Number(id)
            });

            setReviews([response.data, ...reviews]);
            setReviewText('');
            setRatingValue(5);
            showNotify("Дякуємо за ваш відгук! 😊", "success");

        } catch (error) {
            console.error("Помилка при збереженні відгуку:", error);

            // 1. ПЕРЕХОПЛЮЄМО ПАДІННЯ БЕКЕНДУ (500 помилка - IntegrityError)
            if (error.response && error.response.status === 500) {
                return showNotify("❌ Ви вже залишали відгук для цього готелю!", "error");
            }

            // 2. Розумне витягування інших стандартних помилок DRF (400, 403 тощо)
            const backendData = error.response?.data;
            let errorMessage = "Не вдалося додати відгук. Перевірте авторизацію.";

            if (backendData && typeof backendData === 'object') {
                if (backendData.non_field_errors) errorMessage = backendData.non_field_errors[0];
                else if (backendData.detail) errorMessage = backendData.detail;
                else if (backendData.error) errorMessage = backendData.error;
                else {
                    const firstKey = Object.keys(backendData)[0];
                    if (firstKey && Array.isArray(backendData[firstKey])) {
                        errorMessage = backendData[firstKey][0];
                    }
                }
            } else if (typeof backendData === 'string') {
                // Якщо бекенд чомусь віддав текст замість JSON
                errorMessage = "Помилка сервера. Спробуйте пізніше.";
            }

            showNotify(`❌ ${errorMessage}`, "error");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (!hotel) return <Typography variant="h5" align="center" mt={5}>Готель не знайдено 😢</Typography>;

    const galleryPhotos = hotel.gallery_images?.slice(0, 4) || [];

    return (
        <Container maxWidth="lg" sx={{ mt: { xs: 4, md: 6 }, mb: 10 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h3" fontWeight="bold" sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 1 }}>
                    {hotel.name}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}>
                    <LocationOnIcon fontSize="small" color="primary" /> {hotel.city}, {hotel.address}
                </Typography>
            </Box>

            {/* ГАЛЕРЕЯ */}
            <Box sx={{
                height: { xs: '300px', md: '500px' },
                display: 'flex',
                gap: 1,
                mb: 6,
                borderRadius: 4,
                overflow: 'hidden'
            }}>
                <Box
                    sx={{
                        flex: galleryPhotos.length > 0 ? 1 : 'none',
                        width: galleryPhotos.length > 0 ? 'auto' : '100%',
                        position: 'relative',
                        '&:hover img': { filter: 'brightness(0.95)' }
                    }}
                >
                    <img
                        src={hotel.main_image || "https://placehold.co/600x400?text=No+Image"}
                        alt={hotel.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: '0.3s' }}
                    />
                </Box>

                {galleryPhotos.length > 0 && (
                    <Box sx={{ flex: 1, display: { xs: 'none', md: 'grid' }, gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 1 }}>
                        {galleryPhotos.map((img) => (
                            <Box key={img.id} sx={{ overflow: 'hidden', position: 'relative', '&:hover img': { filter: 'brightness(0.85)' } }}>
                                <img
                                    src={img.image}
                                    alt="Gallery"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: '0.3s' }}
                                />
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            <Grid container spacing={6}>
                {/* ЛІВА КОЛОНКА */}
                <Grid item xs={12} md={8}>
                    <Box sx={{ mb: 6 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HotelIcon color="primary" /> Про готель
                        </Typography>
                        <Divider sx={{ mb: 3, width: '40px', borderWidth: 2, borderColor: 'primary.main', borderRadius: 2 }} />
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: '#4a4a4a', fontSize: '1.05rem' }}>
                            {hotel.about}
                        </Typography>
                    </Box>

                    {/* ВІДГУКИ */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            ⭐ Відгуки гостей ({reviews.length})
                        </Typography>
                        <Divider sx={{ mb: 4 }} />

                        {token ? (
                            <Paper elevation={0} sx={{ p: 3, mb: 5, border: '1px solid #e0e0e0', borderRadius: 3, bgcolor: '#fafafa' }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Ваші враження</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Rating value={ratingValue} onChange={(e, val) => setRatingValue(val)} size="large" />
                                </Box>
                                <TextField
                                    fullWidth multiline rows={3}
                                    placeholder="Що вам сподобалось чи не сподобалось?"
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    sx={{ mb: 2, bgcolor: 'white' }}
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    onClick={handleReviewSubmit}
                                    disabled={isSubmittingReview}
                                    sx={{ borderRadius: '50px', px: 4 }}
                                >
                                    {isSubmittingReview ? <CircularProgress size={24} color="inherit" /> : "Залишити відгук"}
                                </Button>
                            </Paper>
                        ) : (
                            <Paper elevation={0} sx={{ p: 3, mb: 5, border: '1px dashed #ccc', borderRadius: 3, textAlign: 'center' }}>
                                <Typography color="text.secondary">
                                    <Link to="/login" style={{ color: '#FF5A5F', fontWeight: 'bold', textDecoration: 'none' }}>Увійдіть</Link>, щоб залишити свій відгук.
                                </Typography>
                            </Paper>
                        )}

                        {reviews.length > 0 ? (
                            <List sx={{ px: 0 }}>
                                {reviews.map((review) => (
                                    <Box key={review.id} sx={{ mb: 3 }}>
                                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48, mr: 1 }}>
                                                    {review.user_name?.charAt(0).toUpperCase() || 'U'}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primaryTypographyProps={{ component: 'div' }}
                                                secondaryTypographyProps={{ component: 'div' }}
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold">{review.user_name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(review.created_at).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        <Rating value={review.rating} readOnly size="small" sx={{ mb: 1 }} />
                                                        <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.6 }}>
                                                            {review.text}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    </Box>
                                ))}
                            </List>
                        ) : (
                            <Typography color="text.secondary">Відгуків поки що немає. Будьте першим!</Typography>
                        )}
                    </Box>
                </Grid>

                {/* ПРАВА КОЛОНКА */}
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            border: '1px solid #e0e0e0',
                            borderRadius: 4,
                            position: 'sticky',
                            top: 100,
                            boxShadow: '0px 15px 40px rgba(0,0,0,0.08)'
                        }}
                    >
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Готові забронювати?
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, display: 'flex', gap: 1 }}>
                            <CheckCircleOutlineIcon color="success" fontSize="small" /> Найкраща ціна гарантована
                        </Typography>

                        <Button
                            component={Link}
                            to={`/hotels/${hotel.id}`}
                            variant="contained"
                            color="primary"
                            fullWidth
                            size="large"
                            sx={{ py: 1.5, fontSize: '1.1rem' }}
                        >
                            До вільних номерів
                        </Button>
                    </Paper>
                </Grid>
            </Grid>

            {/* КОМПОНЕНТ СНАКБАРУ */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', boxShadow: 3 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}