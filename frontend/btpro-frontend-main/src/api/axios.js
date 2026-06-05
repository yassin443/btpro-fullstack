import axios from 'axios'
import useStore from '../store/useStore'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
    headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
    const publicUrls = ['/users/login/', '/users/register/']
    const isPublic = publicUrls.some(url => config.url.includes(url))
    if (!isPublic) {
        const token = useStore.getState().token
        if (token) config.headers.Authorization = 'Bearer ' + token
    }
    return config
})

api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            useStore.getState().logout()
            window.location.href = '/login'
        }
        return Promise.reject(err)
    }
)

export default api
