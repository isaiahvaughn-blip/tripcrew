import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record?.email) {
      return new Response(JSON.stringify({ error: "No email found" }), { status: 400 });
    }

    const email = record.email;
    const name  = record.raw_user_meta_data?.full_name || email.split("@")[0] || "there";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    "Vouze <hello@vouze.app>",
        to:      [email],
        subject: "Welcome to Vouze",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background: #0d1e28; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .container { max-width: 480px; margin: 0 auto; padding: 48px 24px; }
    .wordmark { font-size: 56px; font-weight: 900; color: #e4a576; letter-spacing: -2px; font-style: italic; margin-bottom: 4px; }
    .tagline { font-size: 15px; color: #9ab0bd; font-style: italic; margin-bottom: 40px; letter-spacing: 0.2px; }
    .card { background: #162c3a; border-radius: 20px; padding: 32px; border: 1px solid #243d52; margin-bottom: 28px; }
    .thanks { font-size: 13px; color: #698ea2; margin-bottom: 10px; }
    .headline { font-size: 26px; font-weight: 800; color: #f0ebe4; letter-spacing: -0.8px; margin-bottom: 14px; }
    .body-text { font-size: 15px; color: #9ab0bd; line-height: 1.6; margin: 0; }
    .cta { display: block; background: linear-gradient(135deg, #f07340, #e4a576); color: #ffffff; text-decoration: none; border-radius: 14px; padding: 18px 32px; font-size: 16px; font-weight: 800; text-align: center; letter-spacing: -0.3px; }
    .footer { font-size: 12px; color: #4e6b7a; text-align: center; margin-top: 32px; }
    .footer a { color: #698ea2; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="wordmark">vouze</div>
    <div class="tagline">Plan it, split it, remember it.</div>

    <div class="card">
      <div class="thanks">Thanks for joining us.</div>
      <div class="headline">Welcome${name !== "there" ? `, ${name}.` : "."}</div>
      <p class="body-text">Every plan starts here — trips, dinners, nights out, and everything worth remembering. Vouze keeps your crew on the same page.</p>
    </div>

    <a href="https://www.vouze.app" class="cta">Start planning &rarr;</a>

    <div class="footer">
      <a href="https://www.vouze.app">vouze.app</a>
    </div>
  </div>
</body>
</html>
        `,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});