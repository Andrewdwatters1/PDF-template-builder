import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FieldDefinition, TemplateFieldPlacement, DocumentRecord, DocumentTemplate } from '@pdf-builder/shared';
import { apiFetch } from '../api/client';
import PdfCanvas from '../components/PdfCanvas';
import FieldPalette from '../components/FieldPalette';
import FieldsSidebar from '../components/FieldsSidebar';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

export default function TemplateBuilderPage() {
  const { id: documentId } = useParams<{ id: string }>();

  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [placedFields, setPlacedFields] = useState<TemplateFieldPlacement[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  // Load document info
  useEffect(() => {
    if (!documentId) return;
    apiFetch<DocumentRecord[]>('/documents').then((docs) => {
      const doc = docs.find((d) => d.id === documentId);
      if (doc) setDocument(doc);
    }).catch(console.error);
  }, [documentId]);

  // Load field definitions
  useEffect(() => {
    apiFetch<FieldDefinition[]>('/field-definitions').then(setFieldDefinitions).catch(console.error);
  }, []);

  // Load existing template
  useEffect(() => {
    if (!documentId) return;
    apiFetch<DocumentTemplate>(`/templates/${documentId}`)
      .then((template) => {
        setPlacedFields(template.fields);
        setActiveTemplateId(template.id);
      })
      .catch(() => {
        // No template yet — that's fine
      });
  }, [documentId]);

  function handleFieldDrop(fieldDef: FieldDefinition, x: number, y: number) {
    const newField: TemplateFieldPlacement = {
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

  function handleFieldMove(id: string, x: number, y: number) {
    setPlacedFields((prev) => prev.map((f) => (f.id === id ? { ...f, x, y } : f)));
  }

  function handleFieldResize(id: string, width: number, height: number) {
    setPlacedFields((prev) => prev.map((f) => (f.id === id ? { ...f, width, height } : f)));
  }

  function handleFieldDelete(id: string) {
    setPlacedFields((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleSaveTemplate() {
    if (!documentId) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const result = await apiFetch<DocumentTemplate>('/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, fields: placedFields }),
      });
      setActiveTemplateId(result.id);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  const pdfUrl = documentId ? `${API_BASE}/documents/${documentId}/file` : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '10px 20px',
        borderBottom: '1px solid var(--color-border-tertiary)',
        background: 'var(--color-background-secondary)',
        flexShrink: 0,
      }}>
        <Link to="/documents" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          ← Documents
        </Link>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1 }}>
          {document ? `Template Builder — ${document.name}` : 'Template Builder'}
        </h1>
        {activeTemplateId && (
          <Link
            to={`/sign/${activeTemplateId}`}
            style={{
              fontSize: 13,
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--color-border-secondary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Test Sign →
          </Link>
        )}
        <button
          className="btn btn-primary"
          onClick={handleSaveTemplate}
          disabled={saving}
        >
          {saving ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : 'Save Template'}
        </button>
        {saveStatus === 'error' && (
          <span style={{ fontSize: 12, color: '#dc2626' }}>Save failed</span>
        )}
      </div>

      {/* Three-panel layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel — field palette */}
        <div style={{
          width: 220,
          flexShrink: 0,
          borderRight: '1px solid var(--color-border-tertiary)',
          padding: 16,
          overflowY: 'auto',
          background: 'var(--color-background-secondary)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Field Palette
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 0, marginBottom: 12 }}>
            Drag fields onto the PDF
          </p>
          <FieldPalette fields={fieldDefinitions} />
        </div>

        {/* Center — PDF canvas */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 20,
          background: 'var(--color-background-tertiary)',
          display: 'flex',
          justifyContent: 'center',
        }}>
          {pdfUrl && (
            <PdfCanvas
              pdfUrl={pdfUrl}
              currentPage={currentPage}
              totalPages={document?.totalPages ?? 1}
              placedFields={placedFields}
              onPageChange={setCurrentPage}
              onFieldDrop={handleFieldDrop}
              onFieldMove={handleFieldMove}
              onFieldResize={handleFieldResize}
              onFieldDelete={handleFieldDelete}
            />
          )}
        </div>

        {/* Right panel — fields list + JSON */}
        <div style={{
          width: 260,
          flexShrink: 0,
          borderLeft: '1px solid var(--color-border-tertiary)',
          padding: 16,
          overflowY: 'auto',
          background: 'var(--color-background-secondary)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Placed Fields ({placedFields.length})
          </div>
          <FieldsSidebar
            fields={placedFields}
            currentPage={currentPage}
            onDelete={handleFieldDelete}
          />
        </div>
      </div>
    </div>
  );
}
