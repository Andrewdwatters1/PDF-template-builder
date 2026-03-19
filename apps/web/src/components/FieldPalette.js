import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FIELD_TYPE_COLORS } from '../constants/fieldColors';
export default function FieldPalette({ fields }) {
    const coreFields = fields.filter((f) => f.category === 'core');
    const customFields = fields.filter((f) => f.category === 'custom');
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 16 }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }, children: "Core Fields" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: coreFields.map((f) => _jsx(FieldChip, { field: f }, f.id)) })] }), customFields.length > 0 && (_jsxs("div", { children: [_jsx("div", { style: { fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }, children: "Custom Fields" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: customFields.map((f) => _jsx(FieldChip, { field: f }, f.id)) })] })), fields.length === 0 && (_jsx("p", { style: { fontSize: 13, color: 'var(--color-text-tertiary)' }, children: "No fields available" }))] }));
}
function FieldChip({ field }) {
    const colors = FIELD_TYPE_COLORS[field.type];
    function handleDragStart(e) {
        e.dataTransfer.setData('application/json', JSON.stringify(field));
        e.dataTransfer.effectAllowed = 'copy';
    }
    return (_jsxs("div", { draggable: true, onDragStart: handleDragStart, style: {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 10px',
            borderRadius: 6,
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            cursor: 'grab',
            userSelect: 'none',
            fontSize: 13,
        }, title: `Drag to place ${field.label}`, children: [_jsx("span", { style: { width: 8, height: 8, borderRadius: '50%', backgroundColor: colors.dot, flexShrink: 0 } }), _jsx("span", { style: { color: colors.text, fontWeight: 500, flex: 1 }, children: field.label }), _jsx("span", { style: { fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }, children: field.type })] }));
}
