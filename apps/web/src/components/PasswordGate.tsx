import { useState, ReactNode } from 'react';

const GATE_PW = (import.meta.env.VITE_GATE_PW as string | undefined) || '';
const SESSION_KEY = 'gate_auth';

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (authed) return <>{children}</>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input === GATE_PW) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
    } else {
      setError(true);
      setInput('');
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--color-background)',
    }}>
      <div className="card" style={{ width: 360, padding: 32 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Portal Access</h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Please enter the portal password to proceed.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            placeholder="Password"
            autoFocus
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${error ? '#dc2626' : 'var(--color-border-secondary)'}`,
              background: 'var(--color-background)',
              color: 'var(--color-text)',
              fontSize: 14,
              outline: 'none',
            }}
          />
          {error && (
            <p style={{ margin: 0, fontSize: 13, color: '#dc2626' }}>Incorrect password.</p>
          )}
          <button type="submit" className="btn btn-primary">
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
