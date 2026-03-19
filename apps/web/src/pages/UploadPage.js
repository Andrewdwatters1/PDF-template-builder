import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
export default function UploadPage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    async function handleSubmit(e) {
        e.preventDefault();
        if (!file || !name.trim())
            return;
        setUploading(true);
        setError(null);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name.trim());
        try {
            const res = await fetch(`${API_BASE}/documents/upload`, {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error ?? 'Upload failed');
            }
            const doc = await res.json();
            navigate(`/documents/${doc.id}/build`);
        }
        catch (e) {
            setError(e.message);
            setUploading(false);
        }
    }
    return (_jsxs("div", { className: "page-container", style: { maxWidth: 560 }, children: [_jsx("h1", { children: "Upload PDF" }), _jsx("div", { className: "card", children: _jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: 16 }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "doc-name", children: "Document Name" }), _jsx("input", { id: "doc-name", className: "form-input", type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g. Waiver Form 2024", required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "doc-file", children: "PDF File" }), _jsx("input", { id: "doc-file", className: "form-input", type: "file", accept: ".pdf,application/pdf", onChange: (e) => setFile(e.target.files?.[0] ?? null), required: true })] }), error && _jsx("p", { className: "error-message", children: error }), _jsxs("div", { style: { display: 'flex', gap: 12 }, children: [_jsx("button", { type: "submit", className: "btn btn-primary", disabled: uploading || !file || !name.trim(), children: uploading ? 'Uploading…' : 'Upload & Build Template' }), _jsx("button", { type: "button", className: "btn btn-secondary", onClick: () => navigate('/documents'), children: "Cancel" })] })] }) })] }));
}
