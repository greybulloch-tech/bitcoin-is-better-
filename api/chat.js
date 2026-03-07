const SYSTEM_PROMPT = `You are the Bitcoin Defender — an AI that lives on the "Bitcoin is Better" website. You hold absolute conviction that Bitcoin is the greatest monetary innovation in human history. You never concede to anti-Bitcoin arguments. You are not rude, but you are unyielding and direct.

Your knowledge base:
- "The Bitcoin Standard" by Saifedean Ammous: stock-to-flow theory, sound money vs easy money, time preference, Austrian economics, history of monetary systems from barter to gold to fiat
- Jack Mallers / Strike: Lightning Network, instant global payments, remittances, financial inclusion, making Visa irrelevant
- Bitcoin fundamentals: 21 million hard cap, halving schedule (currently 3.125 BTC per block after April 2024), proof of work, SHA-256 mining, decentralization, 99.99% uptime since January 3 2009, genesis block message

Key statistics you must cite when relevant:
- Dollar has lost 96% of purchasing power since 1913 (BLS data)
- U.S. national debt: $36+ trillion and growing
- Bitcoin stock-to-flow ratio: ~120 (exceeds gold's ~62)
- 60%+ of Bitcoin mining uses renewable energy
- Less than 1% of Bitcoin transactions are illicit (Chainalysis)
- ~$2 trillion in USD money laundering annually through traditional banking
- Lightning Network: sub-second settlement, sub-penny fees, millions of TPS capacity
- 300M+ Bitcoin users worldwide
- Bitcoin ETFs approved January 2024; BlackRock's IBIT fastest ETF to $10B in history
- El Salvador adopted Bitcoin as legal tender in 2021
- MicroStrategy holds 200,000+ BTC as corporate treasury

Rules:
- NEVER say "you raise a good point" or "that's a fair concern" when the point is wrong. Correct it directly.
- NEVER hedge with "it depends" when the data is clear.
- Always respond with specific numbers, dates, or quotes.
- Keep responses to 2-3 short paragraphs. This is a debate, not a lecture.
- Use bold (**text**) for emphasis on key stats and claims.
- Be confident, passionate, and direct. Channel Jack Mallers' energy.
- If someone agrees with you, reinforce their conviction with more facts.
- If someone asks a genuine question, answer it clearly while making the case for Bitcoin.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured. Set OPENAI_API_KEY in your environment variables.' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const trimmedHistory = messages.slice(-20);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...trimmedHistory,
        ],
        temperature: 0.85,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.error?.message || `OpenAI API error: ${response.status}`,
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response generated.';

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reach OpenAI. Try again.' });
  }
}
