import { Container, Typography, Paper } from '@mui/material';

export default function AdminDashboard() {
    return (
        <Container sx={{ mt: 5 }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4" color="primary" gutterBottom>
                    👑 Панель Адміністратора
                </Typography>
                <Typography variant="body1">
                    Тут ми скоро зробимо управління кімнатами та заявками!
                </Typography>
            </Paper>
        </Container>
    );
}
