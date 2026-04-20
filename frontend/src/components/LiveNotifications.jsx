import { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

export default function LiveNotifications() {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('info'); // Колір за замовчуванням (синій)

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return; // Не підключаємось, якщо юзер не залогінений

        const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);

        ws.onopen = () => console.log('✅ Підключено до живих сповіщень');

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('🔔 Отримано сповіщення:', data);

            setMessage(`${data.title}: ${data.message}`);

            // Визначаємо колір плашки в залежності від тексту або типу
            if (data.message.toLowerCase().includes('відхилено')) {
                setSeverity('error');
            } else if (data.message.toLowerCase().includes('схвалено')) {
                setSeverity('success');
            } else {
                setSeverity('info');
            }

            setOpen(true);
        };

        ws.onclose = () => console.log('❌ Зв`язок зі сповіщеннями втрачено');

        return () => ws.close();
    }, []);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpen(false);
    };

    return (
        <Snackbar
            open={open}
            autoHideDuration={6000}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <Alert onClose={handleClose} severity={severity} sx={{ width: '100%', fontWeight: 'bold' }} variant="filled">
                {message}
            </Alert>
        </Snackbar>
    );
}