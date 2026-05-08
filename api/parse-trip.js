export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt' });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are a trip/plan parser. Extract details from natural language and return ONLY a valid JSON object with these exact fields:
- name: string (short descriptive name, e.g. "Tokyo October" or "Dinner at Ox" or "Banff Weekend" or "Coffee with Derek")
- location: string (place name, city, or venue — e.g. "Japan" or "Portland, OR" or "Ox Restaurant")
- city: string (primary city, empty string if unclear)
- country: string (country name, empty string if not applicable)
- dates: string (human-readable timeframe, e.g. "Oct 18–28, 2025" or "Sat May 10" or "Tuesday morning")
- emoji: string (one of exactly: ✈️ 🏔️ 🚴 🏖️ 🗾 🎿 🚗 ⛵ 🏕️ 🎭 — pick most fitting)
- type: string (one of: trip, night_out, date, day_trip, coffee)
- tag: string (hex color matching the vibe: #4ade80 nature/outdoors, #60a5fa city/culture, #f472b6 romantic/social, #fb923c adventure, #a78bfa nightlife/dinner)
- bg: string (CSS linear-gradient using very dark versions of tag color, e.g. for #4ade80: "linear-gradient(135deg, #0d2b1e 0%, #1a4a32 100%)")

Return ONLY the JSON. No markdown, no explanation, no backticks.`,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Anthropic error:', JSON.stringify(data));
    return res.status(500).json({ error: data });
  }
  res.status(200).json(data);
}