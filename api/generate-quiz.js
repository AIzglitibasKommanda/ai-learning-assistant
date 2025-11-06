import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { summary } = req.body;
  if (!summary || typeof summary !== 'string') {
    return res.status(400).json({ error: 'Missing summary in body' });
  }

  try {
    // Hugging Face inference API
    const hfApiKey = process.env.HF_API_KEY; // set this in Vercel Environment Variables
    if (!hfApiKey) return res.status(500).json({ error: 'Hugging Face API key not configured' });

    const prompt = `Generate up to 5 short quiz questions (fill-in-the-blank or multiple-choice) from this text. 
Summary: """${summary}""" 
Return ONLY JSON with key "questions", each with "id", "type", "question", "choices", "answer".`;

    const r = await fetch('https://api-inference.huggingface.co/models/bigscience/bloom', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    });

    if (!r.ok) {
      const errTxt = await r.text();
      return res.status(502).json({ error: 'Hugging Face error', detail: errTxt });
    }

    const data = await r.json();
    let textOutput = '';
    if (Array.isArray(data) && data[0]?.generated_text) {
      textOutput = data[0].generated_text;
    } else if (data?.error) {
      return res.status(502).json({ error: 'Hugging Face error', detail: data.error });
    } else {
      textOutput = JSON.stringify({ questions: [] });
    }

    // Try to extract JSON from generated text
    const jsonMatch = textOutput.match(/\{[\s\S]*\}$/);
    const jsonText = jsonMatch ? jsonMatch[0] : textOutput;
    const parsed = JSON.parse(jsonText);

    return res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}
