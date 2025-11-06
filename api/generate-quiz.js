export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { summary } = req.body;
  if (!summary) return res.status(400).json({ error: 'Missing summary' });

  try {
    const r = await fetch('https://api-inference.huggingface.co/models/valhalla/t5-small-qg-hl', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.HF_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: summary })
    });

    if (!r.ok) {
      const errTxt = await r.text();
      return res.status(502).json({ error: 'HF error', detail: errTxt });
    }

    const questions = await r.json();
    // Transform HF output into your quiz format
    const formatted = questions.map((q,i) => ({
      id: i+1,
      type: 'fill',
      question: q.question || q.generated_question,
      choices: [],
      answer: q.answer || ''
    }));

    return res.status(200).json({ questions: formatted });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}
