import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import PdfCanvas from '../components/PdfCanvas';
import FieldPalette from '../components/FieldPalette';
import FieldsSidebar from '../components/FieldsSidebar';
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
export default function TemplateBuilderPage() {
    const { id: documentId } = useParams();
    const [document, setDocument] = useState(null);
    const [fieldDefinitions, setFieldDefinitions] = useState([]);
    const [placedFields, setPlacedFields] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle');
    const [activeTemplateId, setActiveTemplateId] = useState(null);
    // Load document info
    useEffect(() => {
        if (!documentId)
            return;
        apiFetch('/documents').then((docs) => {
            const doc = docs.find((d) => d.id === documentId);
            if (doc)
                setDocument(doc);
        }).catch(console.error);
    }, [documentId]);
    // Load field definitions
    useEffect(() => {
        apiFetch('/field-definitions').then(setFieldDefinitions).catch(console.error);
    }, []);
    // Load existing template
    useEffect(() => {
        if (!documentId)
            return;
        apiFetch(`/templates/${documentId}`)
            .then((template) => {
            setPlacedFields(template.fields);
            setActiveTemplateId(template.id);
        })
            .catch(() => {
            // No template yet — that's fine
        });
    }, [documentId]);
    function handleFieldDrop(fieldDef, x, y) {
        const newField = {
            id: crypto.randomUUID(),
            fieldDefinitionId: fieldDef.id,
            fieldId: fieldDef.fieldId,
            label: fieldDef.label,
            type: fieldDef.type,
            page: currentPage,
            x,
            y,
            width: fieldDef.defaultWidth,
            height: fieldDef.defaultHeight,
        };
        setPlacedFields((prev) => [...prev, newField]);
    }
    function handleFieldMove(id, x, y) {
        setPlacedFields((prev) => prev.map((f) => (f.id === id ? { ...f, x, y } : f)));
    }
    function handleFieldResize(id, width, height) {
        setPlacedFields((prev) => prev.map((f) => (f.id === id ? { ...f, width, height } : f)));
    }
    function handleFieldDelete(id) {
        setPlacedFields((prev) => prev.filter((f) => f.id !== id));
    }
    async function handleSaveTemplate() {
        if (!documentId)
            return;
        setSaving(true);
        setSaveStatus('idle');
        try {
            const result = await apiFetch('/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId, fields: placedFields }),
            });
            setActiveTemplateId(result.id);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }
        catch {
            setSaveStatus('error');
        }
        finally {
            setSaving(false);
        }
    }
    const pdfUrl = documentId ? `${API_BASE}/documents/${documentId}/file` : '';
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', overflow: 'hidden' }, children: [_jsxs("div", { style: {
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '10px 20px',
                    borderBottom: '1px solid var(--color-border-tertiary)',
                    background: 'var(--color-background-secondary)',
                    flexShrink: 0,
                }, children: [_jsx(Link, { to: "/documents", style: { fontSize: 13, color: 'var(--color-text-secondary)' }, children: "\u2190 Documents" }), _jsx("h1", { style: { margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }, children: document ? `Template Builder — ${document.name}` : 'Template Builder' }), activeTemplateId && (_jsx(Link, { to: `/sign/${activeTemplateId}`, style: {
                            fontSize: 13,
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid var(--color-border-secondary)',
                            color: 'var(--color-text-secondary)',
                        }, children: "Test Sign \u2192" })), _jsx("button", { className: "btn btn-primary", onClick: handleSaveTemplate, disabled: saving, children: saving ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : 'Save Template' }), saveStatus === 'error' && (_jsx("span", { style: { fontSize: 12, color: '#dc2626' }, children: "Save failed" }))] }), _jsxs("div", { style: { display: 'flex', flex: 1, overflow: 'hidden' }, children: [_jsxs("div", { style: {
                            width: 220,
                            flexShrink: 0,
                            borderRight: '1px solid var(--color-border-tertiary)',
                            padding: 16,
                            overflowY: 'auto',
                            background: 'var(--color-background-secondary)',
                        }, children: [_jsx("div", { style: { fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12 }, children: "Field Palette" }), _jsx("p", { style: { fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 0, marginBottom: 12 }, children: "Drag fields onto the PDF" }), _jsx(FieldPalette, { fields: fieldDefinitions })] }), _jsx("div", { style: {
                            flex: 1,
                            overflow: 'auto',
                            padding: 20,
                            background: 'var(--color-background-tertiary)',
                            display: 'flex',
                            justifyContent: 'center',
                        }, children: pdfUrl && (_jsx(PdfCanvas, { pdfUrl: pdfUrl, currentPage: currentPage, totalPages: document?.totalPages ?? 1, placedFields: placedFields, onPageChange: setCurrentPage, onFieldDrop: handleFieldDrop, onFieldMove: handleFieldMove, onFieldResize: handleFieldResize, onFieldDelete: handleFieldDelete })) }), _jsxs("div", { style: {
                            width: 260,
                            flexShrink: 0,
                            borderLeft: '1px solid var(--color-border-tertiary)',
                            padding: 16,
                            overflowY: 'auto',
                            background: 'var(--color-background-secondary)',
                        }, children: [_jsxs("div", { style: { fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12 }, children: ["Placed Fields (", placedFields.length, ")"] }), _jsx(FieldsSidebar, { fields: placedFields, currentPage: currentPage, onDelete: handleFieldDelete })] })] })] }));
}
