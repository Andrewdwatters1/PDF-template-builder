import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import DocumentListPage from './pages/DocumentListPage';
import UploadPage from './pages/UploadPage';
import TemplateBuilderPage from './pages/TemplateBuilderPage';
import SigningTestPage from './pages/SigningTestPage';
import FieldDefinitionsPage from './pages/FieldDefinitionsPage';

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/documents" replace />} />
        <Route path="/documents" element={<DocumentListPage />} />
        <Route path="/documents/new" element={<UploadPage />} />
        <Route path="/documents/:id/build" element={<TemplateBuilderPage />} />
        <Route path="/sign/:templateId" element={<SigningTestPage />} />
        <Route path="/fields" element={<FieldDefinitionsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
