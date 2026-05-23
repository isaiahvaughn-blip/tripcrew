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
    const name  = record.raw_user_meta_data?.full_name || null;

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
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }

    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f4f4f4;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }

    .wrapper {
      background-color: #f4f4f4;
      padding: 32px 16px;
    }

    .container {
      max-width: 480px;
      margin: 0 auto;
      background-color: #0d1e28;
      border-radius: 20px;
      overflow: hidden;
      padding: 40px 32px;
    }

    .wordmark {
      font-size: 48px;
      font-weight: 900;
      color: #e4a576 !important;
      letter-spacing: -2px;
      font-style: italic;
      font-family: Georgia, 'Times New Roman', serif;
      margin: 0 0 4px 0;
      line-height: 1;
    }

    .tagline {
      font-size: 14px;
      color: #9ab0bd !important;
      font-style: italic;
      margin: 0 0 32px 0;
    }

    .card {
      background-color: #162c3a;
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 24px;
      border: 1px solid #243d52;
    }

    .thanks {
      font-size: 12px;
      color: #698ea2 !important;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .headline {
      font-size: 24px;
      font-weight: 800;
      color: #f0ebe4 !important;
      letter-spacing: -0.5px;
      margin: 0 0 12px 0;
      line-height: 1.2;
    }

    .body-text {
      font-size: 15px;
      color: #9ab0bd !important;
      line-height: 1.6;
      margin: 0;
    }

    .cta-wrap {
      text-align: center;
      margin: 0 0 24px 0;
    }

    .cta {
      display: inline-block;
      background: #e4a576;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 14px;
      padding: 16px 48px;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.3px;
    }

    .footer {
      text-align: center;
      font-size: 12px;
      color: #4e6b7a !important;
      margin-top: 24px;
    }

    .footer a {
      color: #698ea2 !important;
      text-decoration: none;
    }

    @media only screen and (max-width: 480px) {
      .container {
        padding: 32px 20px !important;
      }
      .wordmark {
        font-size: 40px !important;
      }
      .headline {
        font-size: 20px !important;
      }
      .cta {
        padding: 14px 32px !important;
        font-size: 15px !important;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <p class="wordmark">vouze</p>
      <p class="tagline">Plan it, split it, remember it.</p>

      <div class="card">
        <p class="thanks">Thanks for joining us</p>
        <p class="headline">${name ? `Welcome, ${name}.` : "Welcome to Vouze."}</p>
        <p class="body-text">Every plan starts here &mdash; trips, dinners, nights out, and everything worth remembering. Vouze keeps your crew on the same page.</p>
      </div>

      <div class="cta-wrap">
        <a href="https://www.vouze.app" class="cta">Start planning &rarr;</a>
      </div>

      <div class="footer">
        <a href="https://www.vouze.app">vouze.app</a>
      </div>
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