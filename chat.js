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
    "The dollar has lost **96% of its value** since 1913. Bitcoin's supply is capped at **21 million** — forever. Which one sounds broken to you?\n\nBitcoin has had **99.99% uptime** since January 2009. No bank, no government system, no tech company can match that. It's the most reliable monetary network ever built.",

    "You're comparing Bitcoin to the current system? The current system **bailed out banks** with $700 billion of taxpayer money in 2008 while executives got bonuses. Bitcoin has **no CEO, no bailouts, no special treatment**.\n\nAs Saifedean Ammous writes in *The Bitcoin Standard*: sound money is the foundation of a prosperous civilization. Fiat money is the foundation of debt, war, and decay.",

    "**60%+ of Bitcoin mining** uses renewable energy — more than almost any other industry on Earth. Mining monetizes **stranded energy** that would otherwise go to waste: flared gas, remote hydro, excess solar.\n\nSecuring a **$1 trillion+ monetary network** that serves hundreds of millions of people without any intermediary is not waste. It's the most productive use of energy in human history.",

    "Volatility is the **price of monetization**. Every asset goes through price discovery. Zoom out: Bitcoin is up **hundreds of thousands of percent** since inception.\n\nMeanwhile, the dollar's volatility is **entirely downward** — it loses purchasing power every single year, guaranteed. I'll take an asset that's volatile on its way up over one that's stable on its way to zero.",

    "Less than **1% of Bitcoin transactions** are illicit, according to Chainalysis. Compare that to the U.S. dollar — roughly **$2 trillion** in money laundering flows through the traditional banking system annually.\n\nBitcoin's blockchain is **permanently public**. Every transaction is traceable forever. It's actually the worst currency for crime and the best for transparency.",

    "Altcoins are **centralized experiments** with venture capital funding, pre-mines, and founders who can change the rules. Bitcoin has **no CEO, no foundation controlling it, no pre-mine**.\n\nAs Jack Mallers puts it: there's Bitcoin, and then there's everything else. Bitcoin solved the double-spend problem with true decentralization. No altcoin has replicated that — because you can't replicate the immaculate conception.",

    "**21 million. Forever.** Not a policy decision — a mathematical certainty enforced by global consensus. No politician, no central bank, no executive can change it.\n\nGold's stock-to-flow ratio is ~62. Bitcoin's is now **~120** — making it the hardest money in human history. And it gets harder every four years at the halving.",

    "The Lightning Network settles payments in **under one second** for less than **a penny**. Jack Mallers' Strike sends money from the U.S. to the Philippines instantly — no banks, no 5-day waits, no 10% fees.\n\nVisa processes ~1,700 transactions per second. Lightning can handle **millions**. We're not replacing Visa. We're making it irrelevant."
  ];

  function getFallbackResponse(userText) {
    const lower = userText.toLowerCase();
    if (lower.includes('energy') || lower.includes('waste') || lower.includes('environment') || lower.includes('climate')) return fallbackResponses[2];
    if (lower.includes('volatile') || lower.includes('volatility') || lower.includes('unstable') || lower.includes('crash')) return fallbackResponses[3];
    if (lower.includes('crime') || lower.includes('criminal') || lower.includes('illegal') || lower.includes('drug') || lower.includes('launder')) return fallbackResponses[4];
    if (lower.includes('alt') || lower.includes('ethereum') || lower.includes('eth') || lower.includes('solana') || lower.includes('crypto')) return fallbackResponses[5];
    if (lower.includes('scarcity') || lower.includes('21 million') || lower.includes('supply') || lower.includes('halving') || lower.includes('inflation')) return fallbackResponses[6];
    if (lower.includes('lightning') || lower.includes('payment') || lower.includes('speed') || lower.includes('slow') || lower.includes('transaction') || lower.includes('fee')) return fallbackResponses[7];
    if (lower.includes('dollar') || lower.includes('fiat') || lower.includes('usd') || lower.includes('money')) return fallbackResponses[0];
    if (lower.includes('bank') || lower.includes('bailout') || lower.includes('government') || lower.includes('fed') || lower.includes('federal')) return fallbackResponses[1];
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
})();
