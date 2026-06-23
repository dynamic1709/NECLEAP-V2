import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/public/Home';
import Explorer from './pages/public/Explorer';
import Search from './pages/public/Search';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import UploadPdf from './pages/admin/UploadPdf';
import ManagePdfs from './pages/admin/ManagePdfs';
import ManageTeachers from './pages/admin/ManageTeachers';
import ManageSubjects from './pages/admin/ManageSubjects';
import ManageBranches from './pages/admin/ManageBranches';
import Settings from './pages/admin/Settings';
import AdminLayout from './components/layout/AdminLayout';
import PdfDetail from './pages/public/PdfDetail';
import Calculator from './pages/public/Calculator';
import Results from './pages/public/Results';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/search" element={<Search />} />
            <Route path="/pdf/:slug" element={<PdfDetail />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/results" element={<Results />} />
            
            {/* Admin Login */}
            <Route path="/admin/login" element={<Login />} />
            
            {/* Protected Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="upload" element={<UploadPdf />} />
              <Route path="manage" element={<ManagePdfs />} />
              <Route path="teachers" element={<ManageTeachers />} />
              <Route path="subjects" element={<ManageSubjects />} />
              <Route path="branches" element={<ManageBranches />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
