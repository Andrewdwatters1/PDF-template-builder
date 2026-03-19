import { NavLink } from 'react-router-dom';

export default function NavBar() {
  const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    fontSize: 14,
    fontWeight: 500,
    color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
    textDecoration: 'none',
    padding: '4px 0',
    borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
  });

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      padding: '0 20px',
      height: 52,
      borderBottom: '1px solid var(--color-border-tertiary)',
      background: 'var(--color-background-secondary)',
      flexShrink: 0,
    }}>
      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-accent)', marginRight: 8 }}>
        PDF Builder
      </span>
      <NavLink to="/documents" style={linkStyle}>Documents</NavLink>
      <NavLink to="/documents/new" style={linkStyle}>Upload</NavLink>
      <NavLink to="/fields" style={linkStyle}>Fields</NavLink>
    </nav>
  );
}
