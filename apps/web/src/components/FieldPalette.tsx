import { FieldDefinition } from '@pdf-builder/shared';
import { FIELD_TYPE_COLORS } from '../constants/fieldColors';

interface Props {
  fields: FieldDefinition[];
}

export default function FieldPalette({ fields }: Props) {
  const coreFields = fields.filter((f) => f.category === 'core');
  const customFields = fields.filter((f) => f.category === 'custom');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Core Fields
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {coreFields.map((f) => <FieldChip key={f.id} field={f} />)}
        </div>
      </div>
      {customFields.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Custom Fields
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {customFields.map((f) => <FieldChip key={f.id} field={f} />)}
          </div>
        </div>
      )}
      {fields.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>No fields available</p>
      )}
    </div>
  );
}

function FieldChip({ field }: { field: FieldDefinition }) {
  const colors = FIELD_TYPE_COLORS[field.type];

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/json', JSON.stringify(field));
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
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
      }}
      title={`Drag to place ${field.label}`}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors.dot, flexShrink: 0 }} />
      <span style={{ color: colors.text, fontWeight: 500, flex: 1 }}>{field.label}</span>
      <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
        {field.type}
      </span>
    </div>
  );
}
