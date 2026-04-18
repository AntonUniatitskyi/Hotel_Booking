import { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

export default function LiveNotifications() {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Відкриваємо "трубу" до бекенду
        const token = localStorage.getItem('token');

        const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);

        ws.onopen = () => {
            console.log('✅ Підключено до живих сповіщень (WebSockets)');
        };

        // Коли бекенд щось надсилає (наприклад, адмін апрувнув заявку)
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('🔔 Отримано сповіщення:', data);

            // Формуємо текст і показуємо плашку
            setMessage(`${data.title}: ${data.message}`);
            setOpen(true);
        };

        ws.onclose = () => {
            console.log('❌ Зв`язок зі сповіщеннями втрачено');
        };

        // Закриваємо з'єднання, якщо користувач пішов із сайту
        return () => {
            ws.close();
        };
    }, []);

    // Якщо користувач закрив плашку хрестиком
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpen(false);
    };

    return (
        <Snackbar
            open={open}
            autoHideDuration={6000} // Зникне саме через 6 секунд
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} // Виїжджає знизу справа
        >
            <Alert onClose={handleClose} severity="success" sx={{ width: '100%', fontWeight: 'bold' }} variant="filled">
                {message}
            </Alert>
        </Snackbar>
    );
}