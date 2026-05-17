import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import LoginPage from './pages/auth/Login'
import AuthCallbackPage from './pages/auth/Callback'
import OnboardingPage from './pages/Onboarding'
import DashboardLayout from './pages/dashboard/Layout'
import OverviewPage from './pages/dashboard/Overview'
import PagesPage from './pages/dashboard/Pages'
import ReferrersPage from './pages/dashboard/Referrers'
import AudiencePage from './pages/dashboard/Audience'
import EventsPage from './pages/dashboard/Events'
import RealtimePage from './pages/dashboard/Realtime'
import SettingsPage from './pages/dashboard/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="pages" element={<PagesPage />} />
          <Route path="referrers" element={<ReferrersPage />} />
          <Route path="audience" element={<AudiencePage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="realtime" element={<RealtimePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
