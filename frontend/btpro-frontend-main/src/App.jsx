import { Routes, Route, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Landing from './pages/Landing/Landing'
import Fonctionnalites from './pages/Landing/Fonctionnalites'
import Tarifs from './pages/Landing/Tarifs'
import Faq from './pages/Landing/Faq'
import Contact from './pages/Landing/Contact'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Reset from './pages/Auth/Reset'
import Dashboard from './pages/Dashboard/Dashboard'
import Projets from './pages/Projets/Projets'
import ProjetDetail from './pages/Projets/ProjetDetail'
import Clients from './pages/Projets/Clients'
import Finances from './pages/Finances/Finances'
import Alertes from './pages/Finances/Alertes'
import Chantier from './pages/Chantier/Chantier'
import Documents from './pages/Documents/Documents'
import TimeTracking from './pages/Temps/TimeTracking'
import Rentabilite from './pages/Rentabilite/Rentabilite'
import Planning from './pages/Planning/Planning'
import RapportTerrain from './pages/Rapports/RapportTerrain'
import Settings from './pages/Settings/Settings'
import SousTraitants from './pages/SousTraitants/SousTraitants'
import SuperAdmin from './pages/Admin/Admin'
import Contrats from './pages/Contrats/Contrats'
import Paie from './pages/Paie/Paie'
import Permis from './pages/Permis/Permis'
import Reunions from './pages/Reunions/Reunions'
import Notifications from './pages/Notifications/Notifications'
import PaymentSuccess from './pages/Payment/PaymentSuccess'
import PaymentFailed from './pages/Payment/PaymentFailed'
import PaymentCheckout from './pages/Payment/PaymentCheckout'
import AbonnementRequis from './pages/Payment/AbonnementRequis'

import Budget from './pages/Budget/Budget'
import DocDemo from './pages/DocDemo/DocDemo'
import MaRemuneration from './pages/Paie/MaRemuneration'
import useStore from './store/useStore'
import api from './api/axios'

function PrivateRoute({ children }) {
    const token = useStore((state) => state.token)
    return token ? children : <Navigate to="/login" />
}

function SuperAdminRoute({ children }) {
    const { token, user } = useStore()
    if (!token) return <Navigate to="/login" />
    if (!user?.is_superuser) return <Navigate to="/dashboard" />
    return children
}

function PatronRoute({ children }) {
    const { token, user } = useStore()
    if (!token) return <Navigate to="/login" />
    if (!user?.is_patron) return <Navigate to="/dashboard" />
    return children
}

function SubscriptionRoute({ children }) {
    const { token, user } = useStore()
    const { data: abo, isLoading } = useQuery({
        queryKey: ['abonnement'],
        queryFn: () => api.get('/cabinets/abonnement/').then(r => r.data),
        enabled: !!token && !user?.is_superuser,
        staleTime: 5 * 60 * 1000,
    })

    if (!token) return <Navigate to="/login" />
    if (user?.is_superuser) return <Navigate to="/superadmin" />
    if (isLoading) return null
    if (abo && !abo.actif) return <Navigate to="/abonnement-requis" />
    return children
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/fonctionnalites" element={<Fonctionnalites />} />
            <Route path="/tarifs" element={<Tarifs />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset" element={<Reset />} />
            <Route path="/payment/checkout" element={<PrivateRoute><PaymentCheckout /></PrivateRoute>} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />
            <Route path="/abonnement-requis" element={<PrivateRoute><AbonnementRequis /></PrivateRoute>} />


            <Route path="/dashboard" element={<SubscriptionRoute><Dashboard /></SubscriptionRoute>} />
            <Route path="/projets" element={<SubscriptionRoute><Projets /></SubscriptionRoute>} />
            <Route path="/projets/:id" element={<SubscriptionRoute><ProjetDetail /></SubscriptionRoute>} />
            <Route path="/clients" element={<PatronRoute><SubscriptionRoute><Clients /></SubscriptionRoute></PatronRoute>} />
            <Route path="/chantier" element={<SubscriptionRoute><Chantier /></SubscriptionRoute>} />
            <Route path="/temps" element={<SubscriptionRoute><TimeTracking /></SubscriptionRoute>} />
            <Route path="/planning" element={<SubscriptionRoute><Planning /></SubscriptionRoute>} />
            <Route path="/rapports" element={<SubscriptionRoute><RapportTerrain /></SubscriptionRoute>} />
            <Route path="/sous-traitants" element={<PatronRoute><SubscriptionRoute><SousTraitants /></SubscriptionRoute></PatronRoute>} />
            <Route path="/ma-remuneration" element={<SubscriptionRoute><MaRemuneration /></SubscriptionRoute>} />
            <Route path="/permis" element={<PatronRoute><SubscriptionRoute><Permis /></SubscriptionRoute></PatronRoute>} />
            <Route path="/reunions" element={<SubscriptionRoute><Reunions /></SubscriptionRoute>} />
            <Route path="/notifications" element={<SubscriptionRoute><Notifications /></SubscriptionRoute>} />

            <Route path="/finances" element={<PatronRoute><SubscriptionRoute><Finances /></SubscriptionRoute></PatronRoute>} />
            <Route path="/alertes" element={<PatronRoute><SubscriptionRoute><Alertes /></SubscriptionRoute></PatronRoute>} />
            <Route path="/documents" element={<PatronRoute><SubscriptionRoute><Documents /></SubscriptionRoute></PatronRoute>} />
            <Route path="/contrats" element={<PatronRoute><SubscriptionRoute><Contrats /></SubscriptionRoute></PatronRoute>} />
            <Route path="/rentabilite" element={<PatronRoute><SubscriptionRoute><Rentabilite /></SubscriptionRoute></PatronRoute>} />
            <Route path="/paie" element={<PatronRoute><SubscriptionRoute><Paie /></SubscriptionRoute></PatronRoute>} />
            <Route path="/budget" element={<PatronRoute><SubscriptionRoute><Budget /></SubscriptionRoute></PatronRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

            <Route path="/demo-docs" element={<DocDemo />} />
            <Route path="/superadmin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    )
}
