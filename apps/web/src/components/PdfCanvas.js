import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import PlacedFieldOverlay from './PlacedFieldOverlay';
// Set worker source once
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
export default function PdfCanvas({ pdfUrl, currentPage, totalPages, placedFields, onPageChange, onFieldDrop, onFieldMove, onFieldResize, onFieldDelete, }) {
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [renderError, setRenderError] = useState(null);
    // Load PDF document
    useEffect(() => {
        if (!pdfUrl)
            return;
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
        if (!pdfDoc || !canvasRef.current)
            return;
        let cancelled = false;
        pdfDoc.getPage(currentPage).then((page) => {
            if (cancelled)
                return;
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = canvasRef.current;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            page.render({ canvasContext: ctx, viewport }).promise.catch((err) => {
                if (!cancelled)
                    console.error('Page render error:', err);
            });
        });
        return () => {
            cancelled = true;
        };
    }, [pdfDoc, currentPage]);
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }
    function handleDrop(e) {
        e.preventDefault();
        const raw = e.dataTransfer.getData('application/json');
        if (!raw || !overlayRef.current)
            return;
        const fieldDef = JSON.parse(raw);
        const rect = overlayRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        onFieldDrop(fieldDef, x, y);
    }
    const currentPageFields = placedFields.filter((f) => f.page === currentPage);
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12 }, children: [_jsx("button", { className: "btn btn-secondary", onClick: () => onPageChange(Math.max(1, currentPage - 1)), disabled: currentPage <= 1, style: { padding: '4px 12px', fontSize: 13 }, children: "\u2190 Prev" }), _jsxs("span", { style: { fontSize: 14, color: 'var(--color-text-secondary)' }, children: ["Page ", currentPage, " / ", totalPages] }), _jsx("button", { className: "btn btn-secondary", onClick: () => onPageChange(Math.min(totalPages, currentPage + 1)), disabled: currentPage >= totalPages, style: { padding: '4px 12px', fontSize: 13 }, children: "Next \u2192" })] }), _jsxs("div", { style: { position: 'relative', display: 'inline-block', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }, children: [loading && (_jsx("div", { style: {
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--color-background-secondary)', zIndex: 10,
                            minWidth: 600, minHeight: 400,
                            color: 'var(--color-text-secondary)',
                        }, children: "Loading PDF\u2026" })), renderError && (_jsx("div", { style: {
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--color-background-secondary)', zIndex: 10,
                            minWidth: 600, minHeight: 400,
                            color: '#dc2626',
                        }, children: renderError })), _jsx("canvas", { ref: canvasRef, style: { display: 'block' } }), _jsx("div", { ref: overlayRef, onDragOver: handleDragOver, onDrop: handleDrop, style: { position: 'absolute', inset: 0 }, children: currentPageFields.map((field) => (_jsx(PlacedFieldOverlay, { field: field, overlayRef: overlayRef, onMove: onFieldMove, onResize: onFieldResize, onDelete: onFieldDelete }, field.id))) })] })] }));
}
