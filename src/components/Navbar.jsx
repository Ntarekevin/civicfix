"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../store/LanguageContext';

export default function Navbar() {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className="navbar" style={scrolled ? { background: 'rgba(13,17,23,0.97)' } : {}}>
      <Link href="/" className="navbar__logo">
        <span>🛡</span> Civic<span>Fix</span>
      </Link>

      {/* Desktop links */}
      <ul className="navbar__links" style={{ display: menuOpen ? 'none' : undefined }}>
        <li><Link href="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>{t('home')}</Link></li>
        <li><Link href="/track" className={pathname === '/track' ? 'active' : ''}>{t('trackReport')}</Link></li>
        <li><Link href="/about" className={pathname === '/about' ? 'active' : ''}>{t('about')}</Link></li>
        <li><Link href="/report" className="navbar__cta">{t('reportIssue')}</Link></li>
      </ul>

      {/* Mobile hamburger */}
      <button
        className="btn btn-secondary btn-sm"
        style={{ marginLeft: 'auto', display: 'none' }}
        onClick={() => setMenuOpen(o => !o)}
        aria-label="Toggle menu"
        id="hamburger-btn"
      >
        ☰
      </button>
    </nav>
  );
}
