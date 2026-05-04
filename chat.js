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

  // --- Knowledge-based response engine ---
  const knowledge = [
    {
      id: 'what_is_bitcoin',
      triggers: ['what is bitcoin', 'what\'s bitcoin', 'explain bitcoin', 'tell me about bitcoin', 'how does bitcoin work', 'what does bitcoin do', 'why bitcoin', 'understand bitcoin'],
      answer: 'Bitcoin is a **decentralized digital monetary network** launched on January 3, 2009 by the pseudonymous Satoshi Nakamoto. It allows anyone to send value to anyone else on Earth without a bank, government, or middleman.',
      stats: 'There will only ever be **21 million bitcoin** — enforced by code on **15,000+ independent nodes** worldwide. The network has maintained **99.99%+ uptime** since launch. Over **200 million people** have used it globally. It is secured by proof-of-work mining consuming real energy, making it the most secure computing network ever built.',
      btc_case: 'Bitcoin is the first money in history with a **verifiably fixed supply** that no person, company, or government can change. It\'s open 24/7/365, borderless, and permissionless.'
    },
    {
      id: 'price',
      triggers: ['price', 'how much', 'cost', 'worth', 'value of bitcoin', 'current price', 'what is bitcoin at', 'trading at', 'market cap'],
      answer: 'For the live Bitcoin price, I\'d normally pull real-time data from CoinGecko. You can always check the current price at **coinmarketcap.com** or **coingecko.com**.',
      stats: 'What I can tell you: Bitcoin is up over **17,000,000%** from its first recorded price. It\'s the **best-performing asset of the last 15 years** — outperforming stocks, gold, real estate, and bonds by orders of magnitude. BlackRock\'s spot Bitcoin ETF (IBIT) became the **fastest ETF in history to reach $10 billion** in assets.',
      btc_case: 'Short-term price moves don\'t define Bitcoin. Zoom out: the trajectory has been relentlessly upward because the supply is fixed at **21 million** while demand grows every year.'
    },
    {
      id: 'inflation_dollar',
      triggers: ['inflation', 'dollar', 'usd', 'purchasing power', 'money printing', 'print money', 'devalue', 'savings', 'why are prices rising', 'cost of living', 'fed', 'federal reserve'],
      answer: 'The U.S. dollar has lost **~96% of its purchasing power** since the Federal Reserve was created in 1913, according to the Bureau of Labor Statistics\' own CPI data. What cost $1 in 1913 costs roughly **$31 today**. The Fed targets **2% annual inflation** as official policy — meaning they *plan* to devalue your savings every year.',
      stats: 'The U.S. national debt now exceeds **$36 trillion** (U.S. Treasury). The Fed\'s balance sheet ballooned from **$900 billion to $9 trillion** between 2008-2022 through money printing (quantitative easing). The M2 money supply increased by **40%** between 2020-2022 alone.',
      btc_case: 'Bitcoin has a **fixed supply of 21 million** that cannot be inflated by any central bank. While the dollar loses value every year by design, Bitcoin\'s scarcity increases every 4 years at the halving. It\'s the escape hatch from monetary debasement.'
    },
    {
      id: 'crisis_2008',
      triggers: ['2008', 'financial crisis', 'recession', 'bailout', 'subprime', 'mortgage', 'lehman', 'housing crash', 'bank crash', 'too big to fail', 'tarp'],
      answer: 'The 2008 financial crisis was caused by banks issuing **subprime mortgages** to unqualified borrowers (NINJA loans — No Income, No Job, No Assets). By 2006, subprime loans made up **24% of all new mortgages** (up from 8% in 2003). Wall Street bundled these into CDOs and rating agencies gave them **fake AAA ratings**. When housing prices fell **33%**, the entire system collapsed.',
      stats: 'Mortgage delinquency hit **10.4%** — one in ten Americans couldn\'t pay. Lehman Brothers (158 years old) went bankrupt overnight. The Dow dropped **54%**. **$11 trillion** in household wealth vanished. **8.7 million** jobs were lost. The government responded with a **$700 billion TARP bailout**. AIG alone got **$182 billion**. Bailed-out banks paid **$32.6 billion in bonuses** in 2009 while **3.8 million** Americans faced foreclosure. The Fed then printed **$4.5 trillion** through quantitative easing.',
      btc_case: 'Satoshi Nakamoto launched Bitcoin on January 3, 2009 — embedding the headline "Chancellor on brink of second bailout for banks" in the genesis block. Bitcoin was built as a direct response: **no bailouts, no money printing, no special rules for the powerful**.'
    },
    {
      id: 'nixon_1971',
      triggers: ['1971', 'nixon', 'gold standard', 'bretton woods', 'off gold', 'gold backing', 'wtf happened'],
      answer: 'On August 15, 1971, President Nixon went on live television and ended the dollar\'s convertibility to gold. This is called the **Nixon Shock**. Before this, every dollar was backed by gold at $35/oz under the Bretton Woods agreement (1944). Nixon closed the gold window because countries like France were demanding gold for their dollars — and the U.S. had **printed far more dollars than it had gold to back**.',
      stats: 'Since 1971: U.S. national debt went from **$398 billion to $36+ trillion**. The dollar has lost over **85% of its purchasing power**. Real wages have stagnated while productivity doubled. Income inequality exploded. The cost of housing, education, and healthcare went parabolic.',
      btc_case: 'Every economic chart breaks at 1971 — because that\'s when money broke. Bitcoin fixes this by providing money with a **fixed supply that can\'t be debased by any president or central bank**.'
    },
    {
      id: 'petrodollar',
      triggers: ['petrodollar', 'saudi', 'oil', 'kissinger', 'opec', 'oil dollar', 'reserve currency'],
      answer: 'In 1974, Nixon and Secretary of State Henry Kissinger struck a deal with **Saudi Arabia**: all oil sales worldwide would be priced in U.S. dollars, and Saudi Arabia would reinvest surplus oil revenues into U.S. Treasury bonds. In exchange, the U.S. would provide **full military protection** to the Saudi kingdom. Every OPEC nation followed suit.',
      stats: 'This created the **Petrodollar system** — forcing every country on Earth to hold U.S. dollars just to buy energy. It\'s why the dollar remained the world\'s reserve currency after Nixon severed it from gold. The dollar went from being backed by **gold** to being backed by **oil and aircraft carriers**.',
      btc_case: 'The dollar\'s value depends on geopolitical deals and military enforcement. Bitcoin\'s value comes from **mathematics, code, and voluntary global consensus**. No deals, no armies, no politics.'
    },
    {
      id: 'energy',
      triggers: ['energy', 'waste', 'environment', 'climate', 'electric', 'mining energy', 'carbon', 'pollution', 'bad for environment', 'power consumption'],
      answer: 'Bitcoin mining\'s energy use is one of the most misunderstood topics. The **Cambridge Bitcoin Electricity Consumption Index** estimates that **over 50-60% of Bitcoin mining** uses sustainable energy — more than almost any other major industry. Miners seek the cheapest energy, which increasingly means renewables and stranded energy.',
      stats: 'Bitcoin miners monetize **flared natural gas** that would otherwise be wasted, **remote hydroelectric** power with no nearby customers, and **excess wind/solar**. The global banking system consumes an estimated **260+ TWh annually** (IEA data) when you include data centers, 80,000+ branches, ATMs, and employee commutes. Bitcoin secures over **$1 trillion in value** without a single physical branch.',
      btc_case: 'Bitcoin doesn\'t waste energy — it **converts energy into monetary security**. Securing a trillion-dollar network that serves hundreds of millions of people 24/7 without intermediaries is arguably the most productive use of energy in the world.'
    },
    {
      id: 'volatility',
      triggers: ['volatile', 'volatility', 'unstable', 'crash', 'risky', 'bubble', 'drop', 'fell', 'bear market', 'risk', 'safe', 'gamble', 'specul'],
      answer: 'Bitcoin is volatile — that\'s a fact. It has experienced multiple **50-80% drawdowns** in its history. But context matters: it\'s a brand new monetary asset being adopted globally in real-time. Every new asset goes through price discovery.',
      stats: 'Despite the volatility, Bitcoin is up **17,000,000%+** from its first recorded price. It has been the **best-performing asset of the past 1, 3, 5, and 10 year periods** multiple times. Its volatility is also **declining over time** as adoption grows and liquidity deepens — 30-day volatility in 2024 was significantly lower than 2014.',
      btc_case: 'The dollar doesn\'t crash dramatically — it just **loses value slowly every single year**, guaranteed. Would you rather hold something volatile on its way up, or something stable on its way to zero?'
    },
    {
      id: 'crime',
      triggers: ['crime', 'criminal', 'illegal', 'drug', 'launder', 'terror', 'scam', 'fraud', 'dark web', 'ransomware'],
      answer: 'The **Chainalysis 2024 Crypto Crime Report** found that illicit activity accounts for **under 0.5%** of total cryptocurrency transaction volume. That number has been declining for years as the ecosystem matures.',
      stats: 'Compare that to cash: the **UN Office on Drugs and Crime** estimates that **$800 billion to $2 trillion** is laundered through the traditional banking system annually — roughly **2-5% of global GDP**. HSBC paid a $1.9 billion fine for laundering cartel money. Deutsche Bank, Wachovia, and others have all been caught. No one suggests banning cash.',
      btc_case: 'Bitcoin\'s blockchain is a **permanent, public, immutable ledger**. Every transaction is traceable forever by anyone. It\'s actually one of the **worst tools for crime** and one of the **best for financial transparency** ever created.'
    },
    {
      id: 'altcoins',
      triggers: ['altcoin', 'ethereum', 'eth', 'solana', 'sol', 'ripple', 'xrp', 'cardano', 'ada', 'crypto', 'other coin', 'better crypto', 'dogecoin', 'shib', 'meme coin'],
      answer: 'There\'s a fundamental architectural difference between Bitcoin and every other cryptocurrency. Bitcoin launched in 2009 with **no pre-mine, no ICO, no venture capital, and no company behind it**. Satoshi mined the same blocks available to anyone, then disappeared.',
      stats: 'Ethereum had a **72 million ETH pre-mine** sold to insiders before launch. Solana, Ripple, Cardano — all had significant **insider allocations and centralized foundations** that control development. Bitcoin has **15,000+ full nodes** anyone can run, secured by hundreds of thousands of miners across **100+ countries**. No other network comes close to this level of decentralization.',
      btc_case: 'Decentralization isn\'t a feature you can add later — it\'s the **foundational property** that makes a monetary network trustworthy. Bitcoin is the only cryptocurrency that has truly achieved it. As Jack Mallers puts it: there\'s Bitcoin, and then there\'s everything else.'
    },
    {
      id: 'scarcity_halving',
      triggers: ['scarc', '21 million', 'supply', 'halving', 'cap', 'how many bitcoin', 'limit', 'total supply', 'stock to flow', 'hard money', 'sound money'],
      answer: 'Bitcoin has an absolute hard cap of **21 million coins** — enforced by code running on tens of thousands of independent nodes worldwide. This cannot be changed without convincing the vast majority of node operators to devalue their own holdings. It\'s game theory, not just software.',
      stats: 'Every **210,000 blocks (~4 years)**, the mining reward is cut in half — called the "halving." The current reward is **3.125 BTC per block** (since April 2024). Gold\'s stock-to-flow ratio is approximately **62** (World Gold Council). Bitcoin\'s is now approximately **~120** — making it **harder than gold** by this measure. The last bitcoin will be mined around the year **2140**.',
      btc_case: 'Unlike gold, you can verify Bitcoin\'s total supply yourself in seconds by running a node. **Absolute, auditable, unchangeable scarcity** — nothing like it has ever existed in human history.'
    },
    {
      id: 'lightning',
      triggers: ['lightning', 'payment', 'speed', 'slow', 'transaction', 'fee', 'remittance', 'send money', 'transfer', 'strike', 'jack mallers', 'visa', 'mastercard', 'buy coffee'],
      answer: 'The **Lightning Network** is a payment layer built on top of Bitcoin. It enables transactions that settle in **under one second** for fees typically **under one cent**. It works by opening payment channels between users that can process unlimited transactions, only settling the final balance on Bitcoin\'s secure base layer.',
      stats: 'Jack Mallers\' **Strike** uses Lightning to process real remittances daily. The World Bank estimates global remittance fees average **6.2%** — that\'s billions extracted from the world\'s poorest workers. Lightning makes those fees essentially **zero**. Visa handles ~**1,700 transactions per second**. Lightning\'s architecture can theoretically scale to **millions of TPS**.',
      btc_case: 'Bitcoin\'s base layer prioritizes security and decentralization (~7 TPS). Lightning handles speed and volume. Together, they create the **most secure AND fastest monetary network ever built**.'
    },
    {
      id: 'fiat_history',
      triggers: ['fiat', 'history of money', 'collapse', 'hyperinflation', 'roman', 'venezuela', 'zimbabwe', 'argentina', 'weimar', 'germany', 'debasement', 'empire', 'fail'],
      answer: 'Every fiat currency in recorded history has either **collapsed entirely or been significantly devalued**. The pattern is 100% consistent over thousands of years with **zero exceptions** over a long enough timeline.',
      stats: 'The Roman denarius was debased from **95% silver to under 5%** over 200 years as emperors funded wars. The German papiermark went from **4.2 per dollar to 4.2 trillion per dollar** in 1923. Zimbabwe printed **$100 trillion bills** in 2008. Venezuela\'s inflation exceeded **1,000,000%** in 2018. Argentina has devalued its currency **multiple times** in living memory. The British pound has lost **99.5%** of its value since the Bank of England was created in 1694.',
      btc_case: 'The U.S. dollar is not exempt from this pattern — it\'s just earlier in the cycle. Bitcoin is the first money in history with a **provably fixed supply** that no government can alter. You can audit it yourself with a $300 computer.'
    },
    {
      id: 'adoption',
      triggers: ['adopt', 'country', 'countries', 'el salvador', 'legal tender', 'etf', 'blackrock', 'institution', 'microstrategy', 'strategy', 'saylor', 'mainstream', 'who uses', 'growing', 'nation'],
      answer: 'Bitcoin adoption is accelerating across individuals, corporations, and nation-states.',
      stats: 'Key milestones: **2010** — first real purchase (10,000 BTC for two pizzas). **2020** — MicroStrategy (now Strategy) begins buying, now holds **499,000+ BTC**. **2021** — El Salvador becomes the first country to adopt Bitcoin as **legal tender**. **January 2024** — U.S. approves **spot Bitcoin ETFs**; BlackRock\'s IBIT becomes the fastest ETF to $10B in history. **2025** — the U.S. explores a **Strategic Bitcoin Reserve**. Over **200 million people** worldwide have interacted with Bitcoin.',
      btc_case: 'Nation-state game theory is now in play: once one major country holds Bitcoin, **others can\'t afford not to**. We\'re watching the early stages of a global monetary shift.'
    },
    {
      id: 'blockchain',
      triggers: ['blockchain', 'how it works', 'mining', 'proof of work', 'node', 'decentrali', 'hash', 'block', 'ledger', 'consensus', 'secure'],
      answer: 'Bitcoin\'s blockchain is a **public, permanent ledger** of every transaction ever made, stored on thousands of computers (nodes) worldwide. Every ~10 minutes, miners compete to solve a cryptographic puzzle. The winner adds the next block and receives newly created bitcoin as reward.',
      stats: 'The network is secured by approximately **600+ exahashes per second** of computing power. There are **15,000+ full nodes** worldwide validating every transaction. The current block reward is **3.125 BTC** (~$300K+ per block). To attack Bitcoin, you\'d need to control **51%+ of all mining power** simultaneously — costing tens of billions of dollars with no guarantee of success.',
      btc_case: 'Proof of work anchors digital scarcity to **physical reality** — real energy, real hardware, real cost. This is what makes Bitcoin\'s security fundamentally different from every other digital system. **Not your keys, not your coins** — hold your own keys and no one on Earth can seize your funds.'
    },
    {
      id: 'satoshi',
      triggers: ['satoshi', 'who created', 'inventor', 'founder', 'anonymous', 'whitepaper', 'genesis block', 'who made bitcoin', 'nakamoto'],
      answer: 'Bitcoin was created by **Satoshi Nakamoto** — a pseudonymous figure whose real identity remains unknown. On October 31, 2008, Satoshi published a 9-page whitepaper titled "Bitcoin: A Peer-to-Peer Electronic Cash System." On January 3, 2009, they mined the genesis block.',
      stats: 'Satoshi communicated via forums and email for about two years, improving the code. In April 2011, they sent a final message — **"I\'ve moved on to other things"** — and vanished. They left behind approximately **1 million bitcoin** that has **never been moved**. No one knows who Satoshi is.',
      btc_case: 'Bitcoin is the only major technology in history created by an anonymous founder who disappeared. There\'s **no CEO, no company, no headquarters**. This ensures Bitcoin belongs to no one and everyone — a protocol, like the internet itself.'
    },
    {
      id: 'invest_buy',
      triggers: ['should i buy', 'invest', 'good investment', 'how to buy', 'where to buy', 'worth buying', 'too late', 'already too expensive'],
      answer: 'I can\'t give financial advice — that\'s a decision only you can make based on your own situation. What I can do is share the facts.',
      stats: 'Bitcoin has been the **best-performing asset class** since its inception in 2009, outperforming stocks, bonds, gold, and real estate. It has a fixed supply of **21 million** while demand continues to grow. Major institutions like **BlackRock, Fidelity, and Goldman Sachs** now offer Bitcoin products. Strategy (MicroStrategy) holds **499,000+ BTC** as corporate treasury. Nation-states are beginning to hold it as a reserve asset.',
      btc_case: 'People have said "it\'s too late" at $1, $100, $1,000, $10,000, and $100,000. Only **~2% of the world\'s population** owns any bitcoin. If you believe a fixed-supply, decentralized, borderless monetary network has value — the math says adoption is still very early.'
    }
  ];

  const STOP_WORDS = new Set([
    'bitcoin', 'btc', 'what', 'how', 'why', 'the', 'is', 'are', 'was',
    'does', 'did', 'can', 'about', 'tell', 'for', 'and', 'that', 'this',
    'with', 'not', 'you', 'your', 'has', 'have', 'too', 'its', 'it',
    'from', 'been', 'will', 'than', 'who', 'all', 'made', 'other'
  ]);

  function getFallbackResponse(userText) {
    const q = userText.toLowerCase();

    const scored = knowledge.map(topic => {
      let score = 0;
      for (const trigger of topic.triggers) {
        if (q.includes(trigger)) {
          score += trigger.split(' ').length * 3;
        } else {
          const words = trigger.split(' ');
          for (const w of words) {
            if (w.length > 3 && !STOP_WORDS.has(w) && q.includes(w)) {
              score += 1;
            }
          }
        }
      }
      return { topic, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];
    const second = scored[1];

    if (best.score < 2) {
      const pick = knowledge[Math.floor(Math.random() * knowledge.length)];
      return "Great question. Here's what you should know:\n\n" + pick.answer + '\n\n' + pick.stats + '\n\n' + pick.btc_case;
    }

    let response = best.topic.answer + '\n\n' + best.topic.stats;

    if (second && second.score >= 2 && second.topic.id !== best.topic.id) {
      response += '\n\n' + second.topic.btc_case;
    } else {
      response += '\n\n' + best.topic.btc_case;
    }

    return response;
  }
})();
