import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import DocumentListPage from './pages/DocumentListPage';
import UploadPage from './pages/UploadPage';
import TemplateBuilderPage from './pages/TemplateBuilderPage';
import SigningTestPage from './pages/SigningTestPage';
import FieldDefinitionsPage from './pages/FieldDefinitionsPage';
export default function App() {
    return (_jsxs(BrowserRouter, { children: [_jsx(NavBar, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/documents", replace: true }) }), _jsx(Route, { path: "/documents", element: _jsx(DocumentListPage, {}) }), _jsx(Route, { path: "/documents/new", element: _jsx(UploadPage, {}) }), _jsx(Route, { path: "/documents/:id/build", element: _jsx(TemplateBuilderPage, {}) }), _jsx(Route, { path: "/sign/:templateId", element: _jsx(SigningTestPage, {}) }), _jsx(Route, { path: "/fields", element: _jsx(FieldDefinitionsPage, {}) })] })] }));
}
