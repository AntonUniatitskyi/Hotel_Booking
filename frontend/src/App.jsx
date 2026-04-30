import { useState, useMemo, } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BookNow from './pages/BookNow.jsx';
import Auth from './pages/Auth';
import HotelDetails from './pages/HotelDetails';
import Profile from './pages/Profile';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import LiveNotifications from './components/LiveNotifications';

const NotFound = () => <h1 style={{ textAlign: 'center', marginTop: '50px' }}>404 - Сторінка не знайдена</h1>;

// ==========================================
// ГЛОБАЛЬНА ДИНАМІЧНА ТЕМА ДИЗАЙНУ
// ==========================================
const getModernTheme = (mode) => createTheme({
    typography: {
        fontFamily: '"Poppins", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        button: { textTransform: 'none', fontWeight: 600 },
        h3: { fontWeight: 700 }, h4: { fontWeight: 700 }, h5: { fontWeight: 600 }, h6: { fontWeight: 600 },
    },
    palette: {
        mode, // Ключовий параметр для MUI (вмикає темні/світлі кольори текстів, інпутів тощо)
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
            // У світлій темі - легкий сіруватий фон, у темній - глибокий темний (але не чисто чорний)
            default: mode === 'light' ? '#F7F9FC' : '#121212',
            // Картки і контейнери
            paper: mode === 'light' ? '#FFFFFF' : '#1e1e1e',
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    padding: '8px 24px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: mode === 'light' ? '0px 6px 15px rgba(255, 90, 95, 0.25)' : '0px 6px 15px rgba(255, 90, 95, 0.5)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: mode === 'light' ? '0px 10px 40px -10px rgba(0,0,0,0.08)' : '0px 10px 40px -10px rgba(0,0,0,0.4)',
                    border: mode === 'light' ? 'none' : '1px solid #333', // Легка рамка для карток в темній темі
                    backgroundImage: 'none', // Прибираємо стандартне висвітлення MUI карток у темній темі
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    // Задаємо фон глобально для самого поля (всередині меж), а не для його квадратного контейнера
                    backgroundColor: mode === 'light' ? '#F7F9FC' : '#121212',
                },
                input: {
                    // Хак для прибирання дефолтного кольору автозаповнення від браузера
                    '&:-webkit-autofill': {
                        WebkitBoxShadow: mode === 'light'
                            ? '0 0 0 100px #F7F9FC inset !important'
                            : '0 0 0 100px #121212 inset !important',
                        WebkitTextFillColor: mode === 'light' ? '#000 !important' : '#fff !important',
                        caretColor: mode === 'light' ? '#000 !important' : '#fff !important',
                        // ПРИБРАНО borderRadius, щоб внутрішній блок зливався з полем іконки
                    },
                }
            }
        }
    },
});

function App() {
    // 1. Читаємо тему з локального сховища або ставимо 'light' за замовчуванням
    const [themeMode, setThemeMode] = useState(() => {
        return localStorage.getItem('themeMode') || 'light';
    });

    // 2. Функція для зміни теми
    const toggleTheme = () => {
        setThemeMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeMode', newMode);
            return newMode;
        });
    };

    // 3. Створюємо тему при кожній зміні режиму
    const theme = useMemo(() => getModernTheme(themeMode), [themeMode]);

    return (
        <ThemeProvider theme={theme}>
            <BrowserRouter>
                {/* CssBaseline автоматично застосує кольори фону та тексту на весь `<body>` */}
                <CssBaseline />

                {/* Передаємо функцію та поточний стан в Navbar */}
                <Navbar toggleTheme={toggleTheme} mode={themeMode} />
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