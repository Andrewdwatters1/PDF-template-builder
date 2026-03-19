import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentRecord } from '@pdf-builder/shared';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';

export default function UploadPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !name.trim()) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name.trim());

    try {
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? 'Upload failed');
      }

      const doc = await res.json() as DocumentRecord;
      navigate(`/documents/${doc.id}/build`);
    } catch (e) {
      setError((e as Error).message);
      setUploading(false);
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 560 }}>
      <h1>Upload PDF</h1>
      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label htmlFor="doc-name">Document Name</label>
            <input
              id="doc-name"
              className="form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Waiver Form 2024"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="doc-file">PDF File</label>
            <input
              id="doc-file"
              className="form-input"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !file || !name.trim()}
            >
              {uploading ? 'Uploading…' : 'Upload & Build Template'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/documents')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
