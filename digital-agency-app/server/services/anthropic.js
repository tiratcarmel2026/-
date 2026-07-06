const API_URL = 'https://api.anthropic.com/v1/messages';

export async function callClaude({ system, prompt, maxTokens = 4000 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY לא מוגדר. הוסיפו אותו לקובץ .env כדי לאפשר יצירת תוכן.'
    );
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Anthropic API error ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  const text = data.content
    ?.filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  if (!text) {
    throw new Error('תשובה ריקה מ-Claude API');
  }

  return text;
}
