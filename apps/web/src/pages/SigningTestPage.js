import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch, apiFetchBlob } from '../api/client';
export default function SigningTestPage() {
    const { templateId } = useParams();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fieldValues, setFieldValues] = useState({});
    const [signing, setSigning] = useState(false);
    const [signError, setSignError] = useState(null);
    useEffect(() => {
        if (!templateId)
            return;
        // We need to find the document that owns this template
        // The API doesn't have GET /templates/:id directly, so we fetch via templateId workaround
        // Actually, we need to get the template. Let's fetch with a known pattern.
        // We'll look up the template by fetching all documents and checking each.
        // For simplicity, we load the template fields by using the template ID directly.
        loadTemplate();
    }, [templateId]);
    async function loadTemplate() {
        try {
            // We need to get template info. POST /sign needs templateId.
            // GET /templates/:documentId - we don't know documentId here.
            // Work around: query documents list, find template for each.
            // Better: add a direct GET /templates/by-id/:templateId endpoint... but that's not in the spec.
            // Instead, we'll fetch all documents and find the one with this template.
            const documents = await apiFetch('/documents');
            let found = null;
            for (const doc of documents) {
                try {
                    const t = await apiFetch(`/templates/${doc.id}`);
                    if (t.id === templateId) {
                        found = t;
                        break;
                    }
                }
                catch {
                    // no template for this doc
                }
            }
            if (found) {
                setTemplate(found);
            }
            else {
                setError('Template not found');
            }
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    function handleValueChange(fieldId, value) {
        setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    }
    function handleFileChange(fieldId, file) {
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => {
            setFieldValues((prev) => ({ ...prev, [fieldId]: reader.result }));
        };
        reader.readAsDataURL(file);
    }
    async function handleSubmit(e) {
        e.preventDefault();
        if (!templateId)
            return;
        setSigning(true);
        setSignError(null);
        try {
            const blob = await apiFetchBlob('/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId, fieldValues }),
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'signed.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        catch (e) {
            setSignError(e.message);
        }
        finally {
            setSigning(false);
        }
    }
    // Deduplicate fields by fieldId (a field might appear on multiple pages)
    const uniqueFields = template
        ? Object.values(template.fields.reduce((acc, f) => {
            if (!acc[f.fieldId])
                acc[f.fieldId] = f;
            return acc;
        }, {}))
        : [];
    return (_jsxs("div", { className: "page-container", style: { maxWidth: 620 }, children: [_jsx("div", { style: { marginBottom: 16 }, children: _jsx(Link, { to: "/documents", style: { fontSize: 13, color: 'var(--color-text-secondary)' }, children: "\u2190 Documents" }) }), _jsx("h1", { children: "Sign Test" }), _jsx("p", { style: { color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 0 }, children: "Fill in field values and download a stamped PDF to verify the template." }), loading && _jsx("p", { style: { color: 'var(--color-text-secondary)' }, children: "Loading template\u2026" }), error && _jsx("p", { className: "error-message", children: error }), template && (_jsx("div", { className: "card", children: _jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: 14 }, children: [uniqueFields.map((field) => (_jsxs("div", { className: "form-group", children: [_jsxs("label", { htmlFor: `field-${field.fieldId}`, children: [field.label, _jsxs("span", { style: { fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 6, fontFamily: 'var(--font-mono)' }, children: ["(", field.type, ")"] })] }), field.type === 'signature' ? (_jsx("input", { id: `field-${field.fieldId}`, className: "form-input", type: "file", accept: "image/*", onChange: (e) => handleFileChange(field.fieldId, e.target.files?.[0] ?? null) })) : (_jsx("input", { id: `field-${field.fieldId}`, className: "form-input", type: "text", value: fieldValues[field.fieldId] ?? '', onChange: (e) => handleValueChange(field.fieldId, e.target.value), placeholder: `Enter ${field.label}…` }))] }, field.fieldId))), uniqueFields.length === 0 && (_jsx("p", { style: { color: 'var(--color-text-secondary)', fontSize: 14 }, children: "This template has no fields. Add some in the template builder first." })), signError && _jsx("p", { className: "error-message", children: signError }), _jsx("button", { type: "submit", className: "btn btn-primary", disabled: signing, style: { alignSelf: 'flex-start' }, children: signing ? 'Generating PDF…' : 'Download Signed PDF' })] }) }))] }));
}
