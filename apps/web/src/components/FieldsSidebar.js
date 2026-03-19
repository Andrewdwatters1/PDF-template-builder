import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { FIELD_TYPE_COLORS } from '../constants/fieldColors';
export default function FieldsSidebar({ fields, currentPage, onDelete }) {
    const currentPageFields = fields.filter((f) => f.page === currentPage);
    const otherFields = fields.filter((f) => f.page !== currentPage);
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'auto' }, children: [_jsxs("div", { children: [_jsxs("div", { style: { fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }, children: ["This Page (", currentPageFields.length, ")"] }), currentPageFields.length === 0 ? (_jsx("p", { style: { fontSize: 12, color: 'var(--color-text-tertiary)' }, children: "No fields on this page" })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 4 }, children: currentPageFields.map((f) => (_jsx(FieldRow, { field: f, onDelete: onDelete }, f.id))) }))] }), otherFields.length > 0 && (_jsxs("div", { children: [_jsxs("div", { style: { fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }, children: ["Other Pages (", otherFields.length, ")"] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 4 }, children: otherFields.map((f) => (_jsx(FieldRow, { field: f, onDelete: onDelete }, f.id))) })] })), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }, children: "Template JSON" }), _jsx("pre", { style: {
                            fontSize: 10,
                            background: 'var(--color-background-tertiary)',
                            border: '1px solid var(--color-border-tertiary)',
                            borderRadius: 6,
                            padding: 8,
                            overflow: 'auto',
                            maxHeight: 300,
                            margin: 0,
                            color: 'var(--color-text-secondary)',
                            fontFamily: 'var(--font-mono)',
                        }, children: JSON.stringify(fields, null, 2) })] })] }));
}
function FieldRow({ field, onDelete }) {
    const colors = FIELD_TYPE_COLORS[field.type];
    return (_jsxs("div", { style: {
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 8px',
            borderRadius: 5,
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            fontSize: 12,
        }, children: [_jsx("span", { style: { width: 7, height: 7, borderRadius: '50%', backgroundColor: colors.dot, flexShrink: 0 } }), _jsx("span", { style: { color: colors.text, flex: 1, fontWeight: 500 }, children: field.label }), _jsxs("span", { style: { fontSize: 10, color: 'var(--color-text-tertiary)' }, children: ["p", field.page] }), _jsx("button", { onClick: () => onDelete(field.id), style: {
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: 'var(--color-text-tertiary)', padding: '0 2px', fontSize: 14, lineHeight: 1,
                }, title: "Remove", children: "\u00D7" })] }));
}
