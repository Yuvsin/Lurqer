import { Routes, Route, Navigate } from 'react-router'
import { HomePage } from './pages/home/HomePage';
import { Scan } from './pages/scan/Scan';
import { Reports } from './pages/reports/Reports';
import { Landing } from './pages/landing/Landing';
import { ReportDetail } from './pages/reports/report-pages/ReportDetail';
import { LogIn } from './pages/login/LogIn';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="scan" element={<Scan />} />
      <Route path="reports" element={<Reports />} />
      <Route path="/reports/:id" element={<ReportDetail />} />
      <Route path="landing" element={<Landing />} />
      <Route path="login" element={<LogIn />} />
    </Routes>
  );
}

export default App;
