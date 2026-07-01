import { Routes, Route } from 'react-router'
import { HomePage } from './pages/home/HomePage';
import { Scan } from './pages/scan/Scan';
import { Reports } from './pages/reports/Reports';
import { Landing } from './pages/landing/Landing';
import { LogIn } from './pages/login/LogIn';
import { useState, useEffect, useCallback } from 'react';
import { mockJobs } from './mockJobs';
import type { Job } from "@/types/Job";

function App() {

  const [jobs, setJobs] = useState<Job[]>(mockJobs);

  const loadJobs = useCallback(async () => {
    setJobs(mockJobs);
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return (
    <Routes>
      <Route index element={<HomePage jobs={jobs} loadJobs={loadJobs} />} />
      <Route path="scan" element={<Scan />} />
      <Route path="reports" element={<Reports jobs={jobs} loadJobs={loadJobs}/>} />
      <Route path="landing" element={<Landing />} />
      <Route path="login" element={<LogIn />} />
    </Routes>
  );
}

export default App;