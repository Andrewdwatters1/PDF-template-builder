import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
export default function DocumentListPage() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(null);
    useEffect(() => {
        apiFetch('/documents')
            .then(setDocuments)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);
    async function handleDelete(id) {
        if (!confirm('Delete this document and its template?'))
            return;
        setDeleting(id);
        try {
            await apiFetch(`/documents/${id}`, { method: 'DELETE' });
            setDocuments((prev) => prev.filter((d) => d.id !== id));
        }
        catch (e) {
            alert(e.message);
        }
        finally {
            setDeleting(null);
        }
    }
    return (_jsxs("div", { className: "page-container", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }, children: [_jsx("h1", { style: { margin: 0 }, children: "Documents" }), _jsx(Link, { to: "/documents/new", className: "btn btn-primary", children: "+ Upload PDF" })] }), loading && _jsx("p", { style: { color: 'var(--color-text-secondary)' }, children: "Loading\u2026" }), error && _jsx("p", { className: "error-message", children: error }), !loading && !error && documents.length === 0 && (_jsxs("div", { className: "empty-state", children: [_jsx("p", { children: "No documents yet." }), _jsx(Link, { to: "/documents/new", className: "btn btn-primary", children: "Upload your first PDF" })] })), documents.length > 0 && (_jsx("div", { className: "card", style: { padding: 0 }, children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Name" }), _jsx("th", { children: "Original File" }), _jsx("th", { children: "Pages" }), _jsx("th", { children: "Uploaded" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: documents.map((doc) => (_jsxs("tr", { children: [_jsx("td", { style: { fontWeight: 500 }, children: doc.name }), _jsx("td", { style: { color: 'var(--color-text-secondary)', fontSize: 13 }, children: doc.originalFilename }), _jsx("td", { style: { color: 'var(--color-text-secondary)' }, children: doc.totalPages }), _jsx("td", { style: { color: 'var(--color-text-secondary)', fontSize: 13 }, children: new Date(doc.createdAt).toLocaleDateString() }), _jsx("td", { children: _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx(Link, { to: `/documents/${doc.id}/build`, className: "btn btn-secondary", style: { fontSize: 13, padding: '5px 10px' }, children: "Build Template" }), _jsx("button", { className: "btn btn-danger", style: { fontSize: 13, padding: '5px 10px' }, onClick: () => handleDelete(doc.id), disabled: deleting === doc.id, children: deleting === doc.id ? 'Deleting…' : 'Delete' })] }) })] }, doc.id))) })] }) }))] }));
}
