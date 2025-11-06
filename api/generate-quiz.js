export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { summary } = req.body;
  if (!summary || typeof summary !== 'string') return res.status(400).json({ error: 'Missing summary' });

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: `Create 3-5 short reading-comprehension questions based on this text. Output JSON only.\n\nText: ${summary}`
        })
      }
    );

    if (!response.ok) {
      const txt = await response.text();
      return res.status(502).json({ error: 'HF API error', detail: txt });
    }

    const data = await response.json();
    // Hugging Face returns text, we try to parse JSON
    let parsed;
    try { parsed = JSON.parse(data[0].generated_text); } catch { parsed = { questions: [] }; }
    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}
