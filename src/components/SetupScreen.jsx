import React, { useState } from 'react';
import { Activity, Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export function SetupScreen({ onSetup }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) { setError('Please enter a password'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Setup failed'); setLoading(false); return; }
      onSetup(data.token);
    } catch {
      setError('Failed to connect to server');
      setLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '10px 40px 10px 38px',
    fontSize: '14px',
    borderRadius: '10px',
    border: hasError ? '1px solid #ef4444' : '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', padding: '40px 32px' }}>

        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(251, 146, 60, 0.15) 100%)', border: '1px solid rgba(249, 115, 22, 0.4)' }}>
            <Activity style={{ width: '32px', height: '32px', color: '#f97316' }} />
          </div>
        </div>

        <h1 style={{ textAlign: 'center', fontSize: '22px', fontWeight: '700', color: 'var(--text-heading)', margin: '0 0 8px 0' }}>
          Set Up Dashboard
        </h1>
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 32px 0' }}>
          Create a password to protect your dashboard. You'll use it every time you log in.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Password */}
          <div style={{ marginBottom: '14px' }}>
            <label htmlFor="setup-password" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                <Lock style={{ width: '16px', height: '16px' }} />
              </div>
              <input
                id="setup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="At least 8 characters"
                autoFocus
                autoComplete="new-password"
                style={inputStyle(!!error)}
                onFocus={(e) => { if (!error) e.target.style.borderColor = '#f97316'; }}
                onBlur={(e) => { if (!error) e.target.style.borderColor = 'var(--border-color)'; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', alignItems: 'center' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="setup-confirm" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: confirm && confirm === password ? '#4ade80' : 'var(--text-muted)', pointerEvents: 'none' }}>
                {confirm && confirm === password
                  ? <CheckCircle style={{ width: '16px', height: '16px' }} />
                  : <Lock style={{ width: '16px', height: '16px' }} />}
              </div>
              <input
                id="setup-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                placeholder="Re-enter password"
                autoComplete="new-password"
                style={inputStyle(!!error && password !== confirm)}
                onFocus={(e) => { if (!error) e.target.style.borderColor = '#f97316'; }}
                onBlur={(e) => { if (!error) e.target.style.borderColor = 'var(--border-color)'; }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', alignItems: 'center' }}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '16px', fontSize: '13px', color: '#f87171' }}>
              <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: loading ? 'rgba(249, 115, 22, 0.5)' : '#f97316', color: '#ffffff', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onMouseEnter={(e) => { if (!loading) e.target.style.background = '#ea580c'; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.background = '#f97316'; }}
          >
            {loading ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Saving...
              </>
            ) : 'Set Password & Continue'}
          </button>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
