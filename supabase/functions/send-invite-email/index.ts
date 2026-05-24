import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY       = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL");
const SUPABASE_SECRET_KEYS = Deno.env.get("SUPABASE_SECRET_KEYS");

const serviceRoleKey = (() => {
  try {
    const parsed = JSON.parse(SUPABASE_SECRET_KEYS || "{}");
    return parsed.service_role || Object.values(parsed)[0] || "";
  } catch {
    return "";
  }
})();

serve(async (req) => {
  try {
    const payload = await req.json();
    const record  = payload.record;

    // Only fire for pending invites (i.e. the person doesn't have an account yet)
    if (!record?.invited_email || record.status !== "pending") {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const toEmail = record.invited_email;
    const tripId  = record.trip_id;

    const supabase = createClient(SUPABASE_URL!, serviceRoleKey);

    // Get trip name
    const { data: trip } = await supabase
      .from("trips")
      .select("name, emoji")
      .eq("id", tripId)
      .maybeSingle();

    const tripName  = trip?.name  || "a trip";
    const tripEmoji = trip?.emoji || "✈️";

    // Get the inviter's display name — the trip owner
    const { data: ownerMember } = await supabase
      .from("trip_members")
      .select("user_id")
      .eq("trip_id", tripId)
      .eq("role", "owner")
      .maybeSingle();

    let inviterName = "Someone";
    if (ownerMember?.user_id) {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", ownerMember.user_id)
        .maybeSingle();
      if (ownerProfile?.display_name) inviterName = ownerProfile.display_name;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    "Vouze <hello@vouze.app>",
        to:      [toEmail],
        subject: `${inviterName} added you to a trip on Vouze`,
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
    .wrapper { background-color: #f4f4f4; padding: 32px 16px; }
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
    .label {
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
    .trip-pill {
      display: inline-block;
      background-color: #1c3448;
      border: 1px solid #243d52;
      border-radius: 12px;
      padding: 12px 18px;
      margin-top: 16px;
      font-size: 16px;
      font-weight: 800;
      color: #f0ebe4 !important;
      letter-spacing: -0.3px;
    }
    .cta-wrap { text-align: center; margin: 0 0 24px 0; }
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
    .footer a { color: #698ea2 !important; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .container { padding: 32px 20px !important; }
      .wordmark  { font-size: 40px !important; }
      .headline  { font-size: 20px !important; }
      .cta       { padding: 14px 32px !important; font-size: 15px !important; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <p class="wordmark">vouze</p>
      <p class="tagline">Plan it, split it, remember it.</p>

      <div class="card">
        <p class="label">You're invited</p>
        <p class="headline">${inviterName} added you to a trip.</p>
        <p class="body-text">Sign in to see the full itinerary, track expenses, and stay in sync with your crew.</p>
        <div class="trip-pill">${tripEmoji} ${tripName}</div>
      </div>

      <div class="cta-wrap">
        <a href="https://www.vouze.app" class="cta">View trip &rarr;</a>
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