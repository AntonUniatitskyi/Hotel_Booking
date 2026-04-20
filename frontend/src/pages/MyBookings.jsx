import { useState, useEffect } from 'react';
import { Box, Typography, Container, Card, CardContent, CircularProgress, Chip, Divider, Button } from '@mui/material';
import api from '../api'; // Підключаємо наш магічний перехоплювач!

export default function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyBookings = async () => {
            // Базова перевірка, чи взагалі є сенс робити запит
            if (!localStorage.getItem('token')) {
                setLoading(false);
                return;
            }

            try {
                // Магія: api сам підставить http://localhost:8000/api/ та токен у заголовок!
                const response = await api.get('bookings/');

                console.log("Мої бронювання з бекенду:", response.data);
                const bookingsData = Array.isArray(response.data) ? response.data : response.data.results || [];
                setBookings(bookingsData);

            } catch (error) {
                console.error("Помилка завантаження бронювань:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyBookings();
    }, []);

    const getStatusChip = (isApproved) => {
        if (isApproved === true) {
            return <Chip label="✅ Підтверджено" color="success" sx={{ fontWeight: 'bold' }} />;
        } else if (isApproved === false) {
            return <Chip label="❌ Відхилено" color="error" sx={{ fontWeight: 'bold' }} />;
        } else {
            return <Chip label="⏳ Очікує підтвердження" color="warning" sx={{ fontWeight: 'bold' }} />;
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 5, mb: 10 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Мої бронювання 🧳
            </Typography>
            <Divider sx={{ mb: 4 }} />

            {!localStorage.getItem('token') ? (
                <Typography variant="h6" color="text.secondary">
                    Будь ласка, увійдіть в акаунт, щоб побачити свої бронювання.
                </Typography>
            ) : bookings.length === 0 ? (
                <Typography variant="h6" color="text.secondary">
                    У вас поки немає жодного бронювання.
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {bookings.map((booking) => (
                        <Card key={booking.id} sx={{ boxShadow: 3, borderRadius: 2, borderLeft: '5px solid #ff9800' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                    <Box>
                                        <Typography variant="h5" fontWeight="bold" color="primary">
                                            {booking.room_details?.hostel_name}
                                        </Typography>
                                        <Typography variant="subtitle1" color="text.secondary">
                                            📍 {booking.room_details?.hostel_city}, {booking.room_details?.hostel_address}
                                        </Typography>
                                    </Box>
                                    {getStatusChip(booking.approved)}
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                                    <Typography variant="body1">
                                        <strong>Кімната:</strong> № {booking.room_details?.number}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Місць:</strong> 🛏️ {booking.room_details?.bed}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Заїзд:</strong> 📅 {booking.start_date}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Виїзд:</strong> 📅 {booking.last_date}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                        <strong>Сума:</strong> 💰 {booking.price} грн
                                    </Typography>
                                </Box>

                                {/* КНОПКА ЗАВАНТАЖЕННЯ PDF */}
                                {booking.approved === true && (
                                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            onClick={async () => {
                                                try {
                                                    // Завантажуємо PDF через наш api.js (без ручного токена)
                                                    const response = await api.get(`bookings/${booking.id}/download_invoice/`, {
                                                        responseType: 'blob'
                                                    });

                                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', `invoice_booking_${booking.id}.pdf`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.parentNode.removeChild(link);

                                                } catch (error) {
                                                    console.error("Помилка завантаження PDF:", error);
                                                    alert("Не вдалося завантажити квитанцію. Можливо, вона ще не згенерована.");
                                                }
                                            }}
                                        >
                                            📄 Завантажити квитанцію
                                        </Button>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}
        </Container>
    );
}