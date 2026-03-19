import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FieldDefinition, TemplateFieldPlacement } from '@pdf-builder/shared';
import PlacedFieldOverlay from './PlacedFieldOverlay';

// Set worker source once
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href;

interface Props {
  pdfUrl: string;
  currentPage: number;
  totalPages: number;
  placedFields: TemplateFieldPlacement[];
  onPageChange: (page: number) => void;
  onFieldDrop: (fieldDef: FieldDefinition, x: number, y: number) => void;
  onFieldMove: (id: string, x: number, y: number) => void;
  onFieldResize: (id: string, width: number, height: number) => void;
  onFieldDelete: (id: string) => void;
}

export default function PdfCanvas({
  pdfUrl,
  currentPage,
  totalPages,
  placedFields,
  onPageChange,
  onFieldDrop,
  onFieldMove,
  onFieldResize,
  onFieldDelete,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Load PDF document
  useEffect(() => {
    if (!pdfUrl) return;
    setLoading(true);
    setRenderError(null);
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    loadingTask.promise
      .then((pdf) => {
        setPdfDoc(pdf);
        setLoading(false);
      })
      .catch((err) => {
        setRenderError('Failed to load PDF');
        setLoading(false);
        console.error(err);
      });
    return () => {
      loadingTask.destroy();
    };
  }, [pdfUrl]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;

    pdfDoc.getPage(currentPage).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      page.render({ canvasContext: ctx, viewport }).promise.catch((err) => {
        if (!cancelled) console.error('Page render error:', err);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, currentPage]);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw || !overlayRef.current) return;
    const fieldDef: FieldDefinition = JSON.parse(raw);
    const rect = overlayRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    onFieldDrop(fieldDef, x, y);
  }

  const currentPageFields = placedFields.filter((f) => f.page === currentPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* Page navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="btn btn-secondary"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          style={{ padding: '4px 12px', fontSize: 13 }}
        >
          ← Prev
        </button>
        <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Page {currentPage} / {totalPages}
        </span>
        <button
          className="btn btn-secondary"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          style={{ padding: '4px 12px', fontSize: 13 }}
        >
          Next →
        </button>
      </div>

      {/* Canvas + overlay */}
      <div style={{ position: 'relative', display: 'inline-block', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-background-secondary)', zIndex: 10,
            minWidth: 600, minHeight: 400,
            color: 'var(--color-text-secondary)',
          }}>
            Loading PDF…
          </div>
        )}
        {renderError && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-background-secondary)', zIndex: 10,
            minWidth: 600, minHeight: 400,
            color: '#dc2626',
          }}>
            {renderError}
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'block' }} />
        <div
          ref={overlayRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{ position: 'absolute', inset: 0 }}
        >
          {currentPageFields.map((field) => (
            <PlacedFieldOverlay
              key={field.id}
              field={field}
              overlayRef={overlayRef}
              onMove={onFieldMove}
              onResize={onFieldResize}
              onDelete={onFieldDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
