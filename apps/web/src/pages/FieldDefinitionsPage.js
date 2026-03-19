import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { FIELD_TYPE_COLORS } from '../constants/fieldColors';
export default function FieldDefinitionsPage() {
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [error, setError] = useState(null);
    // Add form state
    const [newFieldId, setNewFieldId] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newType, setNewType] = useState('text');
    const [addError, setAddError] = useState(null);
    const [adding, setAdding] = useState(false);
    useEffect(() => {
        loadFields();
    }, []);
    function loadFields() {
        apiFetch('/field-definitions')
            .then(setFields)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }
    async function handleDelete(id) {
        if (!confirm('Delete this field definition? This will not affect existing templates.'))
            return;
        setDeleting(id);
        try {
            await apiFetch(`/field-definitions/${id}`, { method: 'DELETE' });
            setFields((prev) => prev.filter((f) => f.id !== id));
        }
        catch (e) {
            alert(e.message);
        }
        finally {
            setDeleting(null);
        }
    }
    async function handleAdd(e) {
        e.preventDefault();
        setAddError(null);
        setAdding(true);
        try {
            const created = await apiFetch('/field-definitions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fieldId: newFieldId, label: newLabel, type: newType }),
            });
            setFields((prev) => [...prev, created]);
            setNewFieldId('');
            setNewLabel('');
            setNewType('text');
        }
        catch (e) {
            setAddError(e.message);
        }
        finally {
            setAdding(false);
        }
    }
    return (_jsxs("div", { className: "page-container", children: [_jsx("h1", { children: "Field Definitions" }), _jsxs("div", { className: "card", style: { marginBottom: 24 }, children: [_jsx("h2", { style: { fontSize: 15, margin: '0 0 12px' }, children: "Add Custom Field" }), _jsxs("div", { style: {
                            background: 'rgba(186, 117, 23, 0.08)',
                            border: '1px solid rgba(186, 117, 23, 0.25)',
                            borderRadius: 6,
                            padding: '10px 12px',
                            fontSize: 13,
                            color: 'var(--color-text-secondary)',
                            marginBottom: 16,
                        }, children: ["\u26A0\uFE0F New custom fields added here will appear in the template builder palette. However, consuming signing applications must be updated to handle new ", _jsx("code", { style: { fontFamily: 'var(--font-mono)' }, children: "fieldId" }), " values."] }), _jsxs("form", { onSubmit: handleAdd, children: [_jsxs("div", { className: "form-row", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Field ID (slug)" }), _jsx("input", { className: "form-input", type: "text", value: newFieldId, onChange: (e) => setNewFieldId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')), placeholder: "e.g. birth_date", required: true, style: { width: 160 } })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Label" }), _jsx("input", { className: "form-input", type: "text", value: newLabel, onChange: (e) => setNewLabel(e.target.value), placeholder: "e.g. Birth Date", required: true, style: { width: 180 } })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Type" }), _jsxs("select", { className: "form-input", value: newType, onChange: (e) => setNewType(e.target.value), children: [_jsx("option", { value: "text", children: "text" }), _jsx("option", { value: "signature", children: "signature" }), _jsx("option", { value: "date", children: "date" }), _jsx("option", { value: "metadata", children: "metadata" }), _jsx("option", { value: "custom", children: "custom" })] })] }), _jsx("button", { type: "submit", className: "btn btn-primary", disabled: adding, children: adding ? 'Adding…' : 'Add Field' })] }), addError && _jsx("p", { className: "error-message", children: addError })] })] }), loading && _jsx("p", { style: { color: 'var(--color-text-secondary)' }, children: "Loading\u2026" }), error && _jsx("p", { className: "error-message", children: error }), !loading && !error && (_jsx("div", { className: "card", style: { padding: 0 }, children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Field ID" }), _jsx("th", { children: "Label" }), _jsx("th", { children: "Type" }), _jsx("th", { children: "Category" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: fields.map((f) => {
                                const colors = FIELD_TYPE_COLORS[f.type];
                                return (_jsxs("tr", { children: [_jsx("td", { style: { fontFamily: 'var(--font-mono)', fontSize: 13 }, children: f.fieldId }), _jsx("td", { style: { fontWeight: 500 }, children: f.label }), _jsx("td", { children: _jsx("span", { style: {
                                                    padding: '2px 8px',
                                                    borderRadius: 4,
                                                    background: colors.bg,
                                                    border: `1px solid ${colors.border}`,
                                                    color: colors.text,
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                }, children: f.type }) }), _jsx("td", { style: { fontSize: 13, color: 'var(--color-text-secondary)' }, children: f.category }), _jsx("td", { children: f.category === 'custom' ? (_jsx("button", { className: "btn btn-danger", style: { fontSize: 13, padding: '4px 10px' }, onClick: () => handleDelete(f.id), disabled: deleting === f.id, children: deleting === f.id ? 'Deleting…' : 'Delete' })) : (_jsx("span", { style: { fontSize: 12, color: 'var(--color-text-tertiary)' }, children: "Protected" })) })] }, f.id));
                            }) })] }) }))] }));
}
