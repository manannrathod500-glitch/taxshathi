import GSTAssistant from './GSTAssistant';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function CAPublicChat() {
  const { slug } = useParams();
  const [caName, setCaName] = useState('');

  useEffect(() => {
    supabase
      .from('profiles')
      .select('full_name')
      .eq('ca_slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setCaName(data.full_name);
      });
  }, [slug]);

  return (
    <div style={{ minHeight: '100vh', background: '#050505' }}>
      <div style={{ background: '#0a0a0a', borderBottom: '0.5px solid #1a1a1a', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a3a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🧾</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>TaxSathi AI</div>
          {caName && <div style={{ fontSize: 11, color: '#666' }}>Powered by CA {caName}</div>}
        </div>
      </div>
      <GSTAssistant caSlug={slug} />
    </div>
  );
}
