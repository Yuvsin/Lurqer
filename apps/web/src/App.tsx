import { Routes, Route, Navigate } from 'react-router'
import { HomePage } from './pages/home/HomePage';
import { LoadingPage } from './pages/home/LoadingPage';
import { Scan } from './pages/scan/Scan';
import { Reports } from './pages/reports/Reports';
import { Landing } from './pages/landing/Landing';
import { ReportDetail } from './pages/reports/report-pages/ReportDetail';
import { LogIn } from './pages/login/LogIn';
import { useQuery } from '@tanstack/react-query';
import { getJobs } from "@/lib/api";

function App() {
  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ["jobs"],
    queryFn: getJobs,
  });
  if (isLoading) {
    return <LoadingPage />;
  }
  if (error) {
    return (
      <div>
        Unable to load jobs:{" "}
        {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage jobs={jobs} />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="scan" element={<Scan />} />
      <Route path="reports" element={<Reports jobs={jobs} />} />
      <Route path="/reports/:id" element={<ReportDetail />} />
      <Route path="landing" element={<Landing />} />
      <Route path="login" element={<LogIn />} />
    </Routes>
  );
}

export default App;
