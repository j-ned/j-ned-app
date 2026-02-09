const ALLOWED_ORIGINS = [
  'https://www.julien-nedellec.fr',
  'https://julien-nedellec.fr',
];

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get('origin') ?? '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

function corsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function jsonResponse(req: Request, body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    return jsonResponse(req, { error: 'Email service temporarily unavailable' }, 500);
  }

  const RECIPIENT_EMAIL = Deno.env.get('CONTACT_RECIPIENT_EMAIL') || 'contact@nedellec-julien.fr';
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'Portfolio <onboarding@resend.dev>';

  let payload: { name: string; email: string; subject: string; message: string };

  try {
    payload = await req.json();
  } catch {
    return jsonResponse(req, { error: 'Invalid JSON body' }, 400);
  }

  const { name, email, subject, message } = payload;

  if (!name || !email || !subject || !message) {
    return jsonResponse(req, { error: 'Missing required fields: name, email, subject, message' }, 400);
  }

  try {
    // 1. Email de notification pour l'admin
    const adminRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [RECIPIENT_EMAIL],
        reply_to: email,
        subject: `[Portfolio] ${subject}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0f0f0f; color: #e0e0e0;">
            <div style="border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px;">
              <h1 style="margin: 0; font-size: 20px; color: #fff;">Nouveau message depuis le portfolio</h1>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 8px 0; color: #888; width: 100px; vertical-align: top;">Nom</td>
                <td style="padding: 8px 0; color: #fff;">${esc(name)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #888; vertical-align: top;">Email</td>
                <td style="padding: 8px 0;"><a href="mailto:${esc(email)}" style="color: #6366f1;">${esc(email)}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #888; vertical-align: top;">Sujet</td>
                <td style="padding: 8px 0; color: #fff;">${esc(subject)}</td>
              </tr>
            </table>
            <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; white-space: pre-line; line-height: 1.6; color: #d0d0d0;">${esc(message)}</p>
            </div>
            <div style="text-align: center; padding-top: 16px; border-top: 1px solid #333;">
              <a href="mailto:${esc(email)}" style="display: inline-block; padding: 10px 24px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Répondre</a>
            </div>
          </div>
        `,
      }),
    });

    const adminData = await adminRes.json();
    if (!adminRes.ok) {
      return jsonResponse(req, { error: 'Email service error' }, 500);
    }

    // 2. Email de confirmation pour l'expéditeur
    const confirmRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: 'Votre message a bien été reçu',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0f0f0f; color: #e0e0e0;">
            <div style="border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px;">
              <h1 style="margin: 0; font-size: 20px; color: #fff;">Merci pour votre message !</h1>
            </div>
            <p style="line-height: 1.6; color: #d0d0d0;">Bonjour ${esc(name)},</p>
            <p style="line-height: 1.6; color: #d0d0d0;">Votre message a bien été reçu. Je vous répondrai dans les meilleurs délais.</p>
            <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0 0 4px 0; color: #888; font-size: 13px;">Votre message :</p>
              <p style="margin: 0; color: #d0d0d0; font-style: italic;">"${esc(message)}"</p>
            </div>
            <p style="line-height: 1.6; color: #d0d0d0;">Cordialement,<br/>Julien Nédellec</p>
            <div style="text-align: center; padding-top: 16px; border-top: 1px solid #333; margin-top: 24px;">
              <p style="color: #666; font-size: 12px; margin: 0;">nedellec-julien.fr</p>
            </div>
          </div>
        `,
      }),
    });

    if (!confirmRes.ok) {
      const confirmData = await confirmRes.json();
      console.warn('Confirmation email failed:', confirmData);
    }

    return jsonResponse(req, { success: true });
  } catch {
    return jsonResponse(req, { error: 'Internal server error' }, 500);
  }
});

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
