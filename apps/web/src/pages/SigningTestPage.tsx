import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DocumentTemplate, TemplateFieldPlacement } from '@pdf-builder/shared';
import { apiFetch, apiFetchBlob } from '../api/client';

export default function SigningTestPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) return;
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
      const documents = await apiFetch<{ id: string }[]>('/documents');
      let found: DocumentTemplate | null = null;
      for (const doc of documents) {
        try {
          const t = await apiFetch<DocumentTemplate>(`/templates/${doc.id}`);
          if (t.id === templateId) {
            found = t;
            break;
          }
        } catch {
          // no template for this doc
        }
      }
      if (found) {
        setTemplate(found);
      } else {
        setError('Template not found');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleValueChange(fieldId: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  function handleFileChange(fieldId: string, file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFieldValues((prev) => ({ ...prev, [fieldId]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!templateId) return;
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
    } catch (e) {
      setSignError((e as Error).message);
    } finally {
      setSigning(false);
    }
  }

  // Deduplicate fields by fieldId (a field might appear on multiple pages)
  const uniqueFields = template
    ? Object.values(
        template.fields.reduce<Record<string, TemplateFieldPlacement>>((acc, f) => {
          if (!acc[f.fieldId]) acc[f.fieldId] = f;
          return acc;
        }, {}),
      )
    : [];

  return (
    <div className="page-container" style={{ maxWidth: 620 }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/documents" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>← Documents</Link>
      </div>
      <h1>Sign Test</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 0 }}>
        Fill in field values and download a stamped PDF to verify the template.
      </p>

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading template…</p>}
      {error && <p className="error-message">{error}</p>}

      {template && (
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {uniqueFields.map((field) => (
              <div key={field.fieldId} className="form-group">
                <label htmlFor={`field-${field.fieldId}`}>
                  {field.label}
                  <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 6, fontFamily: 'var(--font-mono)' }}>
                    ({field.type})
                  </span>
                </label>
                {field.type === 'signature' ? (
                  <input
                    id={`field-${field.fieldId}`}
                    className="form-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(field.fieldId, e.target.files?.[0] ?? null)}
                  />
                ) : (
                  <input
                    id={`field-${field.fieldId}`}
                    className="form-input"
                    type="text"
                    value={fieldValues[field.fieldId] ?? ''}
                    onChange={(e) => handleValueChange(field.fieldId, e.target.value)}
                    placeholder={`Enter ${field.label}…`}
                  />
                )}
              </div>
            ))}

            {uniqueFields.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                This template has no fields. Add some in the template builder first.
              </p>
            )}

            {signError && <p className="error-message">{signError}</p>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={signing}
              style={{ alignSelf: 'flex-start' }}
            >
              {signing ? 'Generating PDF…' : 'Download Signed PDF'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
