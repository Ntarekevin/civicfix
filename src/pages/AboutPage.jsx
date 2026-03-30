import React from 'react';
import { useLanguage } from '../store/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <div className="about-layout">
      <div className="page-header" style={{ textAlign: 'left', padding: '0 0 20px' }}>
        <h1>{t('aboutTitle')}</h1>
        <p className="text-muted">{t('aboutSubtitle')}</p>
      </div>

      <h2>{t('aboutWhatIs')}</h2>
      <p>
        {t('aboutWhatIsText')}
      </p>

      <h2>{t('aboutAnonymity')}</h2>
      <p>
        {t('aboutAnonymityText')}
      </p>
      <ul style={{ paddingLeft: '20px', color: 'var(--color-muted)', lineHeight: 2.2 }}>
        <li>{t('aboutAnon1')}</li>
        <li>{t('aboutAnon2')}</li>
        <li>{t('aboutAnon3')}</li>
        <li>{t('aboutAnon4')}</li>
        <li>{t('aboutAnon5')}</li>
      </ul>

      <h2>{t('aboutSubmitTitle')}</h2>
      <p>
        {t('aboutSubmitText')}
      </p>
      <ol style={{ paddingLeft: '20px', color: 'var(--color-muted)', lineHeight: 2.4 }}>
        <li>{t('aboutSubmit1')}</li>
        <li>{t('aboutSubmit2')}</li>
        <li>{t('aboutSubmit3')}</li>
        <li>{t('aboutSubmit4')}</li>
      </ol>

      <h2>{t('aboutTrackTitle')}</h2>
      <p>
        {t('aboutTrackText')}
      </p>

      <h2>{t('aboutOfflineTitle')}</h2>
      <p>
        {t('aboutOfflineText')}
      </p>

      <h2>{t('aboutWhoSeesTitle')}</h2>
      <p>
        {t('aboutWhoSeesText')}
      </p>

      <h2>{t('aboutContactTitle')}</h2>
      <p>
        {t('aboutContactText')}{' '}
        <a href="mailto:hello@civifix.rw">hello@civifix.rw</a>.
      </p>

      {/* Privacy note */}
      <div className="alert alert-info" style={{ marginTop: '40px' }}>
        {t('aboutPrivacyNote')}
      </div>
    </div>
  );
}
