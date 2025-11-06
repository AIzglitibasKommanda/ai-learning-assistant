export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { summary } = req.body;
  if (!summary || typeof summary !== 'string') return res.status(400).json({ error: 'Missing summary in body' });

  try {
    const prompt = `
You are a helpful assistant that creates short reading-comprehension quizzes.
Input: a short summary text.
Output: valid JSON ONLY with the key "questions" containing an array of up to 5 questions.
Each question object must have:
 - "id" (number),
 - "type": either "fill" or "mcq",
 - "question": complete sentence text (for fill provide the sentence with "_____" in place of the missing word),
 - "choices": array of strings (for mcq) OR [] for fill,
 - "answer": the correct answer string.

Summary:
"""${summary}"""
`;

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return res.status(500).json({ error: 'OpenAI key not configured' });

    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You output JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 600
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const errTxt = await r.text();
      return res.status(502).json({ error: 'OpenAI error', detail: errTxt });
    }

    const data = await r.json();
    let content = data?.choices?.[0]?.message?.content ?? '';
    const jsonMatch = content.match(/\{[\s\S]*\}$/);
    const jsonText = jsonMatch ? jsonMatch[0] : content;
    const parsed = JSON.parse(jsonText);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}
