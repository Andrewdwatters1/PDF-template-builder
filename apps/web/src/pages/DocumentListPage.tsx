import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DocumentRecord } from '@pdf-builder/shared';
import { apiFetch } from '../api/client';

export default function DocumentListPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DocumentRecord[]>('/documents')
      .then(setDocuments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this document and its template?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/documents/${id}`, { method: 'DELETE' });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Documents</h1>
        <Link to="/documents/new" className="btn btn-primary">
          + Upload PDF
        </Link>
      </div>

      {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && documents.length === 0 && (
        <div className="empty-state">
          <p>No documents yet.</p>
          <Link to="/documents/new" className="btn btn-primary">Upload your first PDF</Link>
        </div>
      )}

      {documents.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Original File</th>
                <th>Pages</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: 500 }}>{doc.name}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{doc.originalFilename}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{doc.totalPages}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link
                        to={`/documents/${doc.id}/build`}
                        className="btn btn-secondary"
                        style={{ fontSize: 13, padding: '5px 10px' }}
                      >
                        Build Template
                      </Link>
                      <button
                        className="btn btn-danger"
                        style={{ fontSize: 13, padding: '5px 10px' }}
                        onClick={() => handleDelete(doc.id)}
                        disabled={deleting === doc.id}
                      >
                        {deleting === doc.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
