import { useRef } from 'react';
import { TemplateFieldPlacement } from '@pdf-builder/shared';
import { FIELD_TYPE_COLORS } from '../constants/fieldColors';

interface Props {
  field: TemplateFieldPlacement;
  overlayRef: React.RefObject<HTMLDivElement>;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onDelete: (id: string) => void;
}

export default function PlacedFieldOverlay({ field, overlayRef, onMove, onResize, onDelete }: Props) {
  const colors = FIELD_TYPE_COLORS[field.type];
  const fieldId = field.id!;
  const hoverRef = useRef(false);

  function handleMoveMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    if (!overlayRef.current) return;

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = field.x;
    const startY = field.y;
    const rect = overlayRef.current.getBoundingClientRect();

    function onMouseMove(ev: MouseEvent) {
      const dx = (ev.clientX - startMouseX) / rect.width;
      const dy = (ev.clientY - startMouseY) / rect.height;
      onMove(fieldId, Math.max(0, Math.min(1 - field.width, startX + dx)), Math.max(0, Math.min(1 - field.height, startY + dy)));
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function handleResizeMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    if (!overlayRef.current) return;

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startW = field.width;
    const startH = field.height;
    const rect = overlayRef.current.getBoundingClientRect();

    function onMouseMove(ev: MouseEvent) {
      const dw = (ev.clientX - startMouseX) / rect.width;
      const dh = (ev.clientY - startMouseY) / rect.height;
      onResize(fieldId, Math.max(0.02, Math.min(1 - field.x, startW + dw)), Math.max(0.01, Math.min(1 - field.y, startH + dh)));
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  return (
    <div
      onMouseDown={handleMoveMouseDown}
      style={{
        position: 'absolute',
        left: `${field.x * 100}%`,
        top: `${field.y * 100}%`,
        width: `${field.width * 100}%`,
        height: `${field.height * 100}%`,
        backgroundColor: colors.bg,
        border: `1.5px solid ${colors.border}`,
        borderRadius: 3,
        cursor: 'move',
        userSelect: 'none',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        padding: '0 4px',
        overflow: 'hidden',
      }}
      className="placed-field"
    >
      {/* Type dot */}
      <span style={{
        width: 7, height: 7,
        borderRadius: '50%',
        backgroundColor: colors.dot,
        flexShrink: 0,
        marginRight: 4,
      }} />
      {/* Label */}
      <span style={{
        fontSize: 10,
        fontWeight: 600,
        color: colors.text,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flex: 1,
      }}>
        {field.label}
      </span>
      {/* Delete button */}
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => onDelete(fieldId)}
        style={{
          width: 16, height: 16,
          borderRadius: '50%',
          border: 'none',
          background: colors.border,
          color: '#fff',
          fontSize: 10,
          lineHeight: 1,
          padding: 0,
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 2,
          opacity: 0,
        }}
        className="delete-btn"
        title="Remove field"
      >
        ×
      </button>
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 10,
          height: 10,
          cursor: 'se-resize',
          background: colors.border,
          opacity: 0.7,
          borderRadius: '2px 0 2px 0',
        }}
        className="resize-handle"
      />
      <style>{`
        .placed-field:hover .delete-btn { opacity: 1 !important; }
        .placed-field:hover .resize-handle { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
