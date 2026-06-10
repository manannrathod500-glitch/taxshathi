Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const { name, email } = await req.json();

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Escape user-supplied name before interpolating into the email HTML
    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const safeName = escapeHtml(String(name ?? 'there').slice(0, 120));

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing RESEND_API_KEY' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const html = `
      <div style="background:#0a0a0a;padding:40px 20px;font-family:Inter,Arial,sans-serif;color:#ffffff;">
        <div style="max-width:600px;margin:0 auto;background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:40px;">
          <div style="font-size:12px;letter-spacing:4px;color:#888888;margin-bottom:20px;">
            TAXSATHI AI
          </div>

          <h1 style="font-size:36px;line-height:1.1;margin-bottom:16px;color:#ffffff;">
            Welcome to TaxSathi AI 🎉
          </h1>

          <p style="font-size:16px;line-height:1.8;color:#cfcfcf;margin-bottom:20px;">
            Hi ${safeName},
          </p>

          <p style="font-size:16px;line-height:1.8;color:#cfcfcf;margin-bottom:20px;">
            You're officially on the TaxSathi AI waitlist.
          </p>

          <p style="font-size:16px;line-height:1.8;color:#cfcfcf;margin-bottom:30px;">
            TaxSathi AI helps Indian tax professionals automate GST & ITR workflows, generate high-intent clients, and scale faster using AI-powered systems.
          </p>

          <a href="https://wa.me/919XXXXXXXXX" style="display:inline-block;background:#ffffff;color:#000000;padding:14px 24px;border-radius:14px;text-decoration:none;font-weight:600;">
            Join WhatsApp
          </a>

          <div style="margin-top:40px;color:#777777;font-size:13px;line-height:1.7;">
            Built for Indian CAs, GST experts & tax professionals.<br />
            TaxSathi AI
          </div>
        </div>
      </div>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Welcome to TaxSathi AI 🎉',
        html,
      }),
    });

    const data = await resendResponse.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
});