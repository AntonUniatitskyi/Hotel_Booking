import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BookNow from './pages/BookNow.jsx';
import Auth from './pages/Auth';
import MyBookings from './pages/MyBookings.jsx';
import LiveNotifications from './components/LiveNotifications';
import HotelDetails from './pages/HotelDetails';
import Profile from './pages/Profile';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';

const NotFound = () => <h1 style={{ textAlign: 'center', marginTop: '50px' }}>404 - Сторінка не знайдена</h1>;

// ==========================================
// ГЛОБАЛЬНА ТЕМА ДИЗАЙНУ (В СТИЛІ AIRBNB)
// ==========================================
const modernTheme = createTheme({
    typography: {
        fontFamily: '"Poppins", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 700 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
    },
    palette: {
        primary: {
            main: '#FF5A5F',
            light: '#ff7e82',
            dark: '#e0584d',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#00A699',
        },
        background: {
            default: '#F7F9FC',
            paper: '#FFFFFF',
        },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '50px',
                    padding: '8px 24px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 6px 15px rgba(255, 90, 95, 0.25)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0px 10px 40px -10px rgba(0,0,0,0.08)',
                    border: 'none',
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                }
            }
        }
    },
});

function App() {
    return (
        <ThemeProvider theme={modernTheme}>
            {/* Обов'язково додаємо BrowserRouter навколо всього додатку */}
            <BrowserRouter>
                <CssBaseline />
                <Navbar />
                <LiveNotifications />

                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Auth />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/hotels/:id" element={<BookNow />} />
                    <Route path="/hostel/:id" element={<HotelDetails />} />

                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;