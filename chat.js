/* ============================================
   Bitcoin Defender — Chat Widget Logic
   ============================================ */

(function () {
  'use strict';

  const widget = document.getElementById('chatWidget');
  const toggle = document.getElementById('chatToggle');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  const sendBtn = document.getElementById('chatSend');

  const API_URL = '/api/chat';

  let conversationHistory = [];
  let isStreaming = false;

  // --- Open / Close ---
  toggle.addEventListener('click', () => {
    widget.classList.add('open');
    input.focus();
  });

  closeBtn.addEventListener('click', () => {
    widget.classList.remove('open');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && widget.classList.contains('open')) {
      widget.classList.remove('open');
    }
  });

  // --- Send Message ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || isStreaming) return;

    addMessage('user', text);
    input.value = '';
    isStreaming = true;
    sendBtn.disabled = true;

    conversationHistory.push({ role: 'user', content: text });

    const typingEl = showTyping();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      removeTyping(typingEl);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        await handleStream(response);
      } else {
        const data = await response.json();
        const reply = data.reply || data.choices?.[0]?.message?.content || 'No response.';
        addMessage('bot', reply);
        conversationHistory.push({ role: 'assistant', content: reply });
      }
    } catch (err) {
      removeTyping(typingEl);
      addMessage('bot', getFallbackResponse(text));
      console.error('Chat error:', err);
    }

    isStreaming = false;
    sendBtn.disabled = false;
    input.focus();
  });

  // --- Stream handling ---
  async function handleStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let botText = '';
    const bubble = addMessage('bot', '');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              botText += delta;
              bubble.innerHTML = formatMarkdown(botText);
              scrollToBottom();
            }
          } catch (_) {}
        }
      }
    }

    conversationHistory.push({ role: 'assistant', content: botText });
  }

  // --- DOM helpers ---
  function addMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-msg-bubble';
    bubble.innerHTML = formatMarkdown(text);
    msg.appendChild(bubble);
    messages.appendChild(msg);
    scrollToBottom();
    return bubble;
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.id = 'chatTypingIndicator';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(typing);
    scrollToBottom();
    return typing;
  }

  function removeTyping(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function formatMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  // --- Fallback responses (when API is unavailable) ---
  const fallbackResponses = [
    "According to the U.S. Bureau of Labor Statistics' own CPI data, the dollar has lost **~96% of its purchasing power** since the Federal Reserve was created in 1913. That's not opinion — that's the government's own numbers. Bitcoin's supply is capped at **21 million by code and global consensus**. One is designed to debase. The other can't.\n\nBitcoin has maintained **99.99%+ uptime** since January 3, 2009. No bank, no government system, no tech company on Earth can match that track record. It processes value 24/7/365 with no downtime, no holidays, no permission needed.",

    "In 2008, the U.S. government used **$700 billion in taxpayer money** (TARP) to bail out the same banks whose reckless lending caused the crisis. The Federal Reserve then created **over $4 trillion through quantitative easing** between 2008-2014 (Federal Reserve balance sheet data). Executives at bailed-out firms received bonuses. Ordinary Americans lost homes and retirement savings.\n\nBitcoin was born in direct response — Satoshi embedded a headline about bank bailouts into the genesis block. It has **no CEO, no bailouts, no lender of last resort**. The rules apply equally to everyone.",

    "The Cambridge Bitcoin Electricity Consumption Index estimates that **over 50% of Bitcoin mining** now uses sustainable energy sources — and that number keeps climbing. Miners actively seek the cheapest energy, which increasingly means **renewables and stranded energy**: flared natural gas that would otherwise be wasted, remote hydroelectric, excess wind and solar.\n\nThe global banking system consumes an estimated **260+ TWh annually** (IEA data) when you include data centers, branches, ATMs, and employee commutes. Bitcoin's network secures over **$1 trillion in value** with a fraction of that — and it does it without a single physical branch.",

    "Yes, Bitcoin is volatile in the short term — that's a verifiable fact. It's also up over **17,000,000%** from its first recorded price. No other asset in history has that track record over 15 years.\n\nHere's what's also true: the dollar **loses purchasing power every single year** — the Fed literally targets 2% inflation, meaning they aim to devalue your savings. Bitcoin's volatility trends downward over time as adoption grows and liquidity deepens. The real question isn't whether Bitcoin is volatile — it's whether you'd rather hold an asset that's volatile on its way up or one that's guaranteed to go down.",

    "The Chainalysis 2024 Crypto Crime Report found that illicit activity accounts for **under 0.5%** of total cryptocurrency transaction volume. Meanwhile, the UN Office on Drugs and Crime estimates that **$800 billion to $2 trillion** is laundered through the traditional banking system annually — that's 2-5% of global GDP.\n\nBitcoin's blockchain is a **permanent, public, immutable ledger**. Every transaction is recorded forever and can be traced by anyone. Cash is anonymous. Bitcoin is pseudonymous and auditable. It's genuinely one of the worst tools for crime ever invented.",

    "Here's a factual difference: Bitcoin launched in 2009 with **no pre-mine, no ICO, no venture capital, no company behind it**. Satoshi mined the same blocks available to anyone. Ethereum had a **72 million ETH pre-mine** sold to insiders. Solana, Ripple, Cardano — all had significant insider allocations and centralized foundations.\n\nBitcoin's network is secured by hundreds of thousands of miners across 100+ countries, validated by **15,000+ full nodes** anyone can run. No other cryptocurrency has achieved this level of decentralization. That's not tribalism — it's a measurable, verifiable architectural difference.",

    "**21 million.** That number is enforced by code running on tens of thousands of independent nodes worldwide. Changing it would require convincing the vast majority of node operators to accept a change that devalues their own holdings. It won't happen — it's game theory, not just software.\n\nGold's stock-to-flow ratio is approximately **62** (World Gold Council data). After the April 2024 halving, Bitcoin's ratio is approximately **120** — making it measurably harder than gold. And unlike gold, you can verify Bitcoin's total supply yourself in seconds by running a node. Every four years at the halving, it gets even harder.",

    "The Lightning Network enables Bitcoin payments that settle in **under one second** for fees typically **under one cent**. This isn't theoretical — Jack Mallers' Strike processes real remittances from the U.S. to countries like the Philippines and El Salvador daily.\n\nThe World Bank estimates global remittance fees average **6.2%**. That's billions of dollars extracted from the world's poorest workers every year. Lightning makes those fees essentially zero. Visa handles ~1,700 transactions per second. Lightning's architecture can scale to **millions of TPS**. This isn't hype — it's how payment channels work mathematically.",

    "In 1974, Nixon and Kissinger struck a deal with Saudi Arabia: **price all oil in U.S. dollars** and recycle surplus revenues into U.S. Treasury bonds. In return, the U.S. would provide military protection to the Saudi kingdom. Every OPEC nation followed. This is the Petrodollar system — publicly documented and widely studied.\n\nThis deal is why the dollar survived after Nixon severed it from gold in 1971. The world didn't use dollars because they trusted American fiscal policy — they used dollars because **you couldn't buy oil without them**. Bitcoin offers something no fiat currency ever has: a monetary network that doesn't depend on military enforcement or political deals to maintain its value.",

    "Every fiat currency in recorded history has either **collapsed entirely or been significantly devalued**. The Roman denarius, the Continental dollar, the German papiermark, the Zimbabwean dollar, the Venezuelan bolívar — the pattern is 100% consistent over thousands of years. The U.S. dollar is not exempt from this pattern; it's just earlier in the cycle.\n\nBitcoin is the first monetary system in history with a **provably fixed supply** that no government, central bank, or corporation can alter. That's not ideology — it's verifiable computer science. You can audit the entire supply yourself, right now, with a $300 computer."
  ];

  function getFallbackResponse(userText) {
    const lower = userText.toLowerCase();
    if (lower.includes('energy') || lower.includes('waste') || lower.includes('environment') || lower.includes('climate') || lower.includes('electric')) return fallbackResponses[2];
    if (lower.includes('volatile') || lower.includes('volatility') || lower.includes('unstable') || lower.includes('crash') || lower.includes('risky') || lower.includes('bubble')) return fallbackResponses[3];
    if (lower.includes('crime') || lower.includes('criminal') || lower.includes('illegal') || lower.includes('drug') || lower.includes('launder') || lower.includes('terror')) return fallbackResponses[4];
    if (lower.includes('alt') || lower.includes('ethereum') || lower.includes('eth') || lower.includes('solana') || lower.includes('crypto') || lower.includes('ripple') || lower.includes('cardano')) return fallbackResponses[5];
    if (lower.includes('scarcity') || lower.includes('21 million') || lower.includes('supply') || lower.includes('halving') || lower.includes('cap')) return fallbackResponses[6];
    if (lower.includes('lightning') || lower.includes('payment') || lower.includes('speed') || lower.includes('slow') || lower.includes('transaction') || lower.includes('fee') || lower.includes('remittance')) return fallbackResponses[7];
    if (lower.includes('oil') || lower.includes('petro') || lower.includes('saudi') || lower.includes('nixon') || lower.includes('1971') || lower.includes('gold standard')) return fallbackResponses[8];
    if (lower.includes('fiat') || lower.includes('history') || lower.includes('collapse') || lower.includes('hyperinflation') || lower.includes('roman') || lower.includes('venezuela') || lower.includes('zimbabwe')) return fallbackResponses[9];
    if (lower.includes('dollar') || lower.includes('usd') || lower.includes('money') || lower.includes('inflation') || lower.includes('print')) return fallbackResponses[0];
    if (lower.includes('bank') || lower.includes('bailout') || lower.includes('government') || lower.includes('fed') || lower.includes('federal') || lower.includes('2008')) return fallbackResponses[1];
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
})();
