import { TemplateFieldPlacement } from '@pdf-builder/shared';
import { FIELD_TYPE_COLORS } from '../constants/fieldColors';

interface Props {
  fields: TemplateFieldPlacement[];
  currentPage: number;
  onDelete: (id: string) => void;
}

export default function FieldsSidebar({ fields, currentPage, onDelete }: Props) {
  const currentPageFields = fields.filter((f) => f.page === currentPage);
  const otherFields = fields.filter((f) => f.page !== currentPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'auto' }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          This Page ({currentPageFields.length})
        </div>
        {currentPageFields.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>No fields on this page</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {currentPageFields.map((f) => (
              <FieldRow key={f.id} field={f} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>

      {otherFields.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Other Pages ({otherFields.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {otherFields.map((f) => (
              <FieldRow key={f.id} field={f} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Template JSON
        </div>
        <pre style={{
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
        }}>
          {JSON.stringify(fields, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function FieldRow({ field, onDelete }: { field: TemplateFieldPlacement; onDelete: (id: string) => void }) {
  const colors = FIELD_TYPE_COLORS[field.type];
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 8px',
      borderRadius: 5,
      border: `1px solid ${colors.border}`,
      background: colors.bg,
      fontSize: 12,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: colors.dot, flexShrink: 0 }} />
      <span style={{ color: colors.text, flex: 1, fontWeight: 500 }}>{field.label}</span>
      <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>p{field.page}</span>
      <button
        onClick={() => onDelete(field.id!)}
        style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: 'var(--color-text-tertiary)', padding: '0 2px', fontSize: 14, lineHeight: 1,
        }}
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}
