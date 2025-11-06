// api/generate-quiz.js
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
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfKey) return res.status(500).json({ error: 'Hugging Face key not configured' });

    // Prepare payload for Hugging Face text generation
    const payload = {
      inputs: `Create a short reading comprehension quiz from the following text. Output JSON ONLY with "questions" array containing up to 5 questions. Each question must have id, type ("fill" or "mcq"), question text, choices (array, empty for fill), and answer.\n\nText:\n${summary}`,
      options: { wait_for_model: true }
    };

    const r = await fetch('https://api-inference.huggingface.co/models/gpt2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const errTxt = await r.text();
      return res.status(502).json({ error: 'Hugging Face error', detail: errTxt });
    }

    const data = await r.json();
    // The text output from Hugging Face might be a string; try to parse JSON from it
    let textOutput = '';
    if (Array.isArray(data)) textOutput = data[0]?.generated_text || '';
    else textOutput = data?.generated_text || '';

    const jsonMatch = textOutput.match(/\{[\s\S]*\}$/);
    const jsonText = jsonMatch ? jsonMatch[0] : textOutput;

    let parsed = { questions: [] };
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      console.warn('Failed to parse HF output as JSON, returning empty array.');
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}
