import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'

// Apply saved theme before first render to avoid flash
try {
    const saved = JSON.parse(localStorage.getItem('planner-storage') || '{}')
    if (saved?.state?.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
    }
} catch (_) {}

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
                    <App />
                </GoogleOAuthProvider>
            </QueryClientProvider>
        </BrowserRouter>
    </StrictMode>
)
