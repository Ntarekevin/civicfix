"use client";
import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { login } from '../../services/api';
import { useLanguage } from '../../store/LanguageContext';

export default function AdminLogin() {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(username, password);
      localStorage.setItem('civifix_auth_token', data.token);
      localStorage.setItem('civifix_user', JSON.stringify(data.user));
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.message || t('adminLoginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '0 20px' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>{t('adminPortal')}</h2>
        <p className="text-muted text-center" style={{ marginBottom: '24px', fontSize: '0.9rem' }}>
          {t('restrictedAccess')}
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">{t('username')}</label>
            <input
              id="username"
              type="text"
              className="form-control"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">{t('password')}</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '16px' }}
            disabled={loading}
          >
            {loading ? t('authenticating') : t('secureLogin')}
          </button>
        </form>
      </div>
    </div>
  );
}
