import { useEffect, useState } from 'react';
import { FieldDefinition } from '@pdf-builder/shared';
import { apiFetch } from '../api/client';
import { FIELD_TYPE_COLORS } from '../constants/fieldColors';

export default function FieldDefinitionsPage() {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [newFieldId, setNewFieldId] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<FieldDefinition['type']>('text');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadFields();
  }, []);

  function loadFields() {
    apiFetch<FieldDefinition[]>('/field-definitions')
      .then(setFields)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this field definition? This will not affect existing templates.')) return;
    setDeleting(id);
    try {
      await apiFetch(`/field-definitions/${id}`, { method: 'DELETE' });
      setFields((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    try {
      const created = await apiFetch<FieldDefinition>('/field-definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldId: newFieldId, label: newLabel, type: newType }),
      });
      setFields((prev) => [...prev, created]);
      setNewFieldId('');
      setNewLabel('');
      setNewType('text');
    } catch (e) {
      setAddError((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="page-container">
      <h1>Field Definitions</h1>

      {/* Add form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, margin: '0 0 12px' }}>Add Custom Field</h2>
        <div style={{
          background: 'rgba(186, 117, 23, 0.08)',
          border: '1px solid rgba(186, 117, 23, 0.25)',
          borderRadius: 6,
          padding: '10px 12px',
          fontSize: 13,
          color: 'var(--color-text-secondary)',
          marginBottom: 16,
        }}>
          ⚠️ New custom fields added here will appear in the template builder palette. However, consuming signing applications
          must be updated to handle new <code style={{ fontFamily: 'var(--font-mono)' }}>fieldId</code> values.
        </div>
        <form onSubmit={handleAdd}>
          <div className="form-row">
            <div className="form-group">
              <label>Field ID (slug)</label>
              <input
                className="form-input"
                type="text"
                value={newFieldId}
                onChange={(e) => setNewFieldId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="e.g. birth_date"
                required
                style={{ width: 160 }}
              />
            </div>
            <div className="form-group">
              <label>Label</label>
              <input
                className="form-input"
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Birth Date"
                required
                style={{ width: 180 }}
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select
                className="form-input"
                value={newType}
                onChange={(e) => setNewType(e.target.value as FieldDefinition['type'])}
              >
                <option value="text">text</option>
                <option value="signature">signature</option>
                <option value="date">date</option>
                <option value="metadata">metadata</option>
                <option value="custom">custom</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={adding}>
              {adding ? 'Adding…' : 'Add Field'}
            </button>
          </div>
          {addError && <p className="error-message">{addError}</p>}
        </form>
      </div>

      {/* Fields table */}
      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Field ID</th>
                <th>Label</th>
                <th>Type</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => {
                const colors = FIELD_TYPE_COLORS[f.type];
                return (
                  <tr key={f.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{f.fieldId}</td>
                    <td style={{ fontWeight: 500 }}>{f.label}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: colors.bg,
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                        fontSize: 12,
                        fontWeight: 500,
                      }}>
                        {f.type}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{f.category}</td>
                    <td>
                      {f.category === 'custom' ? (
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: 13, padding: '4px 10px' }}
                          onClick={() => handleDelete(f.id)}
                          disabled={deleting === f.id}
                        >
                          {deleting === f.id ? 'Deleting…' : 'Delete'}
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Protected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
