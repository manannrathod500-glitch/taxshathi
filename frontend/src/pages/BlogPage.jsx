import React, { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Clock } from 'lucide-react';
import blogPosts from '../data/blogPosts';

// Sets title, meta description, canonical and JSON-LD for a route.
// CRA renders client-side; Googlebot executes JS, so these are picked up.
function useSeo({ title, description, path, jsonLd }) {
  useEffect(() => {
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    const prevDesc = meta.content;
    meta.content = description;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    const prevHref = canonical.href;
    canonical.href = `https://taxsathi.online${path}`;

    let script;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => {
      meta.content = prevDesc;
      canonical.href = prevHref;
      if (script) script.remove();
    };
  }, [title, description, path, jsonLd]);
}

const S = {
  page: { minHeight: '100vh', background: '#07050f', color: '#e8e0ff', fontFamily: "'DM Sans', 'Noto Sans Gujarati', sans-serif" },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px clamp(20px, 5vw, 60px)', borderBottom: '1px solid rgba(139,92,246,0.12)' },
  navBrand: { display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' },
  navBtn: { background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13.5, fontWeight: 700 },
  wrap: { maxWidth: 760, margin: '0 auto', padding: '48px 20px 80px' },
  kicker: { color: '#a78bfa', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  h1: { fontSize: 'clamp(26px, 4.5vw, 40px)', fontWeight: 900, color: '#fff', lineHeight: 1.25, letterSpacing: -0.5, marginBottom: 14 },
  metaRow: { display: 'flex', alignItems: 'center', gap: 14, color: '#6b7280', fontSize: 13, marginBottom: 8 },
  tag: { background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#c4b5fd', borderRadius: 999, padding: '3px 12px', fontSize: 12, fontWeight: 600 },
  card: { display: 'block', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 16, padding: '26px 24px', textDecoration: 'none', marginBottom: 18 },
  cardTitle: { color: '#fff', fontSize: 19, fontWeight: 800, lineHeight: 1.4, marginBottom: 8 },
  cardDesc: { color: '#9ca3af', fontSize: 14, lineHeight: 1.7, marginBottom: 14 },
  cardMore: { color: '#a78bfa', fontSize: 13.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 },
  back: { color: '#a78bfa', textDecoration: 'none', fontSize: 13.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 28 },
  cta: { background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(139,92,246,0.08))', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 18, padding: '28px 26px', marginTop: 44, textAlign: 'center' },
  ctaBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', color: '#fff', textDecoration: 'none', borderRadius: 12, padding: '12px 26px', fontSize: 14.5, fontWeight: 700, marginTop: 14 },
  footer: { borderTop: '1px solid rgba(139,92,246,0.12)', padding: '32px 20px', textAlign: 'center', color: '#4b5563', fontSize: 13 },
};

const articleCss = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Noto+Sans+Gujarati:wght@400;600;700&display=swap');
  .ts-article { font-size: 15.5px; line-height: 1.85; color: #c9c3e3; }
  .ts-article h2 { color: #fff; font-size: 21px; font-weight: 800; margin: 36px 0 12px; line-height: 1.35; }
  .ts-article p { margin: 0 0 16px; }
  .ts-article ul, .ts-article ol { margin: 0 0 16px; padding-left: 24px; }
  .ts-article li { margin-bottom: 8px; }
  .ts-article a { color: #a78bfa; }
  .ts-article table { width: 100%; border-collapse: collapse; margin: 0 0 16px; font-size: 14.5px; }
  .ts-article th, .ts-article td { border: 1px solid rgba(139,92,246,0.25); padding: 10px 12px; text-align: left; }
  .ts-article th { background: rgba(139,92,246,0.12); color: #fff; }
  .ts-article em { color: #6b7280; font-size: 13.5px; }
`;

const Brand = () => (
  <Link to="/" style={S.navBrand}>
    <img src="/favicon.png" alt="TaxSathi" style={{ width: 32, height: 32, borderRadius: 7, objectFit: 'cover' }} />
    <span style={{ lineHeight: 1.15 }}>
      <span style={{ display: 'block', color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '0.03em' }}>TAX SATHI</span>
      <span style={{ display: 'block', color: '#a78bfa', fontWeight: 700, fontSize: 11, letterSpacing: '0.14em' }}>AI</span>
    </span>
  </Link>
);

const Shell = ({ children }) => (
  <div style={S.page}>
    <style>{articleCss}</style>
    <nav style={S.nav}>
      <Brand />
      <Link to="/login" style={S.navBtn}>Start Free</Link>
    </nav>
    {children}
    <footer style={S.footer}>
      © {new Date().getFullYear()} TaxSathi AI · <Link to="/" style={{ color: '#6b7280' }}>taxsathi.online</Link>
    </footer>
  </div>
);

export function BlogIndex() {
  useSeo({
    title: 'GST Guides in Gujarati, Hindi & English — TaxSathi AI Blog',
    description:
      'Practical GST guides for Gujarat businesses: return due dates, WhatsApp-to-invoice workflows, and GST answers in Gujarati. By TaxSathi AI.',
    path: '/blog',
  });

  return (
    <Shell>
      <div style={S.wrap}>
        <div style={S.kicker}>TaxSathi AI Blog</div>
        <h1 style={S.h1}>GST, explained for Gujarat's businesses</h1>
        <p style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>
          Due dates, invoicing workflows and tax answers — in the language you do business in.
        </p>
        {blogPosts.map((post) => (
          <Link key={post.slug} to={`/blog/${post.slug}`} style={S.card}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {post.tags.map((t) => <span key={t} style={S.tag}>{t}</span>)}
            </div>
            <div style={S.cardTitle}>{post.title}</div>
            <div style={S.cardDesc}>{post.description}</div>
            <span style={S.cardMore}>Read article <ArrowRight size={14} /></span>
          </Link>
        ))}
      </div>
    </Shell>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);

  const jsonLd = post && {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: post.lang,
    author: { '@type': 'Organization', name: 'TaxSathi AI', url: 'https://taxsathi.online' },
    publisher: { '@type': 'Organization', name: 'TaxSathi AI', url: 'https://taxsathi.online' },
    mainEntityOfPage: `https://taxsathi.online/blog/${post.slug}`,
  };

  useSeo({
    title: post ? `${post.title} — TaxSathi AI` : 'TaxSathi AI Blog',
    description: post ? post.description : '',
    path: post ? `/blog/${post.slug}` : '/blog',
    jsonLd,
  });

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <Shell>
      <div style={S.wrap}>
        <Link to="/blog" style={S.back}><ArrowLeft size={14} /> All articles</Link>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {post.tags.map((t) => <span key={t} style={S.tag}>{t}</span>)}
        </div>
        <h1 style={S.h1}>{post.title}</h1>
        <div style={S.metaRow}>
          <span>{new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Clock size={13} /> {post.readMins} min read</span>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid rgba(139,92,246,0.15)', margin: '24px 0 28px' }} />
        {/* Content is authored in-repo (src/data/blogPosts.js), not user input. */}
        <div className="ts-article" dangerouslySetInnerHTML={{ __html: post.html }} />
        <div style={S.cta}>
          <div style={{ fontSize: 19, fontWeight: 800, color: '#fff' }}>Never miss a GST deadline again</div>
          <div style={{ fontSize: 14, color: '#9ca3af', marginTop: 6 }}>Ask any GST/ITR question in Gujarati, Hindi or English — free plan, no card needed.</div>
          <Link to="/login" style={S.ctaBtn}>Try TaxSathi AI Free <ArrowRight size={15} /></Link>
        </div>
      </div>
    </Shell>
  );
}
