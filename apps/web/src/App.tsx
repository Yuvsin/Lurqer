import { Routes, Route } from 'react-router'
import { HomePage } from './pages/home/HomePage';
import { Scan } from './pages/scan/Scan';
import { Reports } from './pages/reports/Reports';

function App() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="scan" element={<Scan />} />
      <Route path="reports" element={<Reports />} />
    </Routes>
  );
}

export default App;