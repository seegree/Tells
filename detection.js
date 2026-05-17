// detection.js
// Rule set + analyzer for AI-writing tells.
// Each rule has a tier (strong/medium/soft), a category label, a "why" blurb
// shown in hover tooltips, and a list of regex patterns.
// Exports window.Tells = { RULES, analyze, toMarkedText, TIER_MARKERS }.

const RULES = [
  // ════════════════════════════════════════════════════════════════
  // STRONG — distinctive, high-confidence AI signatures
  // ════════════════════════════════════════════════════════════════
  {
    id: "setup_payoff",
    category: "Setup–payoff opener",
    tier: "strong",
    why: "A formulaic hook common in AI intros. Cut to the substance.",
    patterns: [
      /\bin a world where\b/gi,
      /\bimagine (?:a world|if you|for a moment|this[:;])/gi,
      /\bpicture (?:this|a world)\b/gi,
      /\blet'?s (?:dive in|unpack this|explore together)\b/gi,
      /\bbuckle up\b/gi,
    ],
  },
  {
    id: "closing_cliche",
    category: "Closing cliché",
    tier: "strong",
    why: "Sign-off boilerplate that rarely earns its position.",
    patterns: [
      /\bin conclusion\b/gi,
      /\bto sum (?:it )?up\b/gi,
      /\bat the end of the day\b/gi,
      /\bwhen all is said and done\b/gi,
      /\bat its core\b/gi,
      /\bthe bottom line is\b/gi,
      /\bultimately,?\s+what (?:matters|counts)\b/gi,
    ],
  },
  {
    id: "listicle",
    category: "Listicle scaffolding",
    tier: "strong",
    why: "Numbered-list framing that reads as content-mill output.",
    patterns: [
      /\bhere are (?:\d+|a few|some|several|the) (?:ways|tips|reasons|things|steps|key|top)\b/gi,
      /\bthe top \d+\b/gi,
      /\b\d+ (?:ways|reasons|tips|things) to\b/gi,
    ],
  },
  {
    id: "negation_affirmation",
    category: "Negation–affirmation pivot",
    tier: "strong",
    why: "The “it’s not X — it’s Y” twist. Overused; almost never earned.",
    patterns: [
      /\b(?:it'?s|this is|that'?s|they'?re|we'?re) not (?:just|only|merely|simply)\b/gi,
      /\b(?:isn'?t|aren'?t|wasn'?t|weren'?t) (?:just|only|merely|simply) (?:a |an |the )?[a-z]+(?:,| —| -)\s*(?:it'?s|they'?re|but)\b/gi,
    ],
  },
  {
    id: "sycophancy",
    category: "Sycophancy / chat padding",
    tier: "strong",
    why: "Chatbot scaffolding. Cut entirely — it serves the assistant, not the reader.",
    patterns: [
      /\b(?:that'?s|what) (?:a |an )?(?:great|excellent|fantastic|wonderful|brilliant|fascinating|insightful) (?:question|point|observation)!?/gi,
      /\byour (?:insight|question|point|observation) is (?:incredibly |truly |very |really )?(?:sharp|astute|insightful|on point|brilliant)/gi,
      /\bi (?:completely |totally |fully )?understand your (?:concern|question|frustration|perspective)/gi,
      /\bi hope (?:this|that) helps[.!]?/gi,
      /\blet me (?:walk you through|break (?:this|it) down|explain this)\b/gi,
      /^(?:certainly|absolutely|of course|sure thing)[!,.]/gim,
      /\bhappy to (?:help|explain|elaborate|clarify)\b/gi,
      /\bfeel free to (?:ask|let me know|reach out)\b/gi,
    ],
  },
  {
    id: "ai_disclaimer",
    category: "AI disclaimer",
    tier: "strong",
    why: "A literal AI tell — the model identifying itself. Always remove.",
    patterns: [
      /\bas an? (?:ai|large language model|language model|ai language model)\b/gi,
      /\b(?:as of|up to) my (?:last )?(?:knowledge (?:update|cutoff)|training (?:update|data|cutoff))\b/gi,
      /\bi don'?t have (?:real[- ]time|access to|the ability)\b/gi,
      /\bi cannot (?:browse|access|provide real[- ]time)\b/gi,
    ],
  },
  {
    id: "corporate",
    category: "Corporate-speak",
    tier: "strong",
    why: "LinkedIn-thinkpiece vocabulary. Says little; signals a lot.",
    patterns: [
      /\bleverag(?:e|ing|ed|es)\b/gi,
      /\bsynerg(?:y|ies|istic)\b/gi,
      /\bcircle back\b/gi,
      /\bdeep[- ]div(?:e|ing|es|ed)\b/gi,
      /\bmove the needle\b/gi,
      /\bgame[- ]chang(?:er|ing|ers)\b/gi,
      /\bin today'?s (?:fast[- ]paced|rapidly[- ]evolving|ever[- ]changing) world\b/gi,
      /\bever[- ]evolving\b/gi,
      /\brapidly evolving\b/gi,
      /\bcutting[- ]edge\b/gi,
      /\bparadigm shift\b/gi,
      /\bdriv(?:e|es|ing) value\b/gi,
      /\bunlock(?:s|ing|ed)? (?:the )?(?:potential|value|power)\b/gi,
      /\bharness(?:es|ing|ed)? (?:the )?(?:power|potential)\b/gi,
      /\bbest[- ]in[- ]class\b/gi,
      /\blow[- ]hanging fruit\b/gi,
      /\bmission[- ]critical\b/gi,
      /\bnext[- ]level\b/gi,
    ],
  },
  {
    id: "ai_signature",
    category: "AI signature word",
    tier: "strong",
    why: "Strongly associated with AI output. Rare in unedited human writing.",
    patterns: [
      /\bdelv(?:e|ing|es|ed)\b/gi,
      /\btapestry\b/gi,
      /\bin the realm of\b/gi,
      /\brealm of [a-z]+/gi,
      /\bnavigat(?:e|ing) (?:the )?(?:complexit|landscape|intricaci|nuances)[a-z]*/gi,
      /\bmultifaceted\b/gi,
      /\bbear in mind\b/gi,
      /\bsymphon(?:y|ic) of\b/gi,
      /\bkaleidoscop(?:e|ic) of\b/gi,
      /\bintricac(?:y|ies)\b/gi,
      /\bmeticulous(?:ly)?\b/gi,
      /\bdiverse array\b/gi,
      /\bstands? as a testament\b/gi,
      /\bindelible mark\b/gi,
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // MEDIUM — common throat-clearing and AI-flavored vocabulary
  // ════════════════════════════════════════════════════════════════
  {
    id: "hedge",
    category: "Hedge / throat-clearing",
    tier: "medium",
    why: "Signals importance instead of demonstrating it. Cut without loss.",
    patterns: [
      /\bit'?s worth (?:noting|mentioning|pointing out|remembering|considering)\b/gi,
      /\bit'?s important to (?:note|mention|remember|consider|recognize|understand|highlight)\b/gi,
      /\bit should be noted that\b/gi,
      /\bneedless to say\b/gi,
      /\bas (?:we|you) (?:all )?know\b/gi,
      /\bkeep in mind that\b/gi,
      /\bone (?:might|could) (?:argue|say|note)\b/gi,
      /\bsuffice it to say\b/gi,
    ],
  },
  {
    id: "transition",
    category: "Hollow transition",
    tier: "medium",
    why: "A connective word doing no actual connecting.",
    patterns: [
      /(?:^|(?<=[.!?]["')\]]?\s))(?:Furthermore|Moreover|That said|Additionally|Conversely|In essence|In summary|Indeed|Notably)\b/g,
    ],
  },
  {
    id: "intensifier",
    category: "Vague intensifier",
    tier: "medium",
    why: "Adverb padding that adds emphasis without substance.",
    patterns: [
      /\b(?:truly|deeply|profoundly|genuinely|incredibly|remarkably|fundamentally|undeniably|absolutely(?! not)|wholeheartedly)\b/gi,
    ],
  },
  {
    id: "ai_vocab_medium",
    category: "AI vocabulary",
    tier: "medium",
    why: "Word common in AI output, often hollow on inspection.",
    patterns: [
      /\brobust\b/gi,
      /\bcomprehensive\b/gi,
      /\bseamless(?:ly)?\b/gi,
      /\bvibrant\b/gi,
      /\bunderscor(?:e|es|ed|ing)\b/gi,
      /\bshowcas(?:e|es|ing|ed)\b/gi,
      /\bfoster(?:s|ing|ed)?\b/gi,
      /\btransformative\b/gi,
      /\bpivotal\b/gi,
      /\bmyriad\b/gi,
      /\bplethora\b/gi,
      /\bnuanced\b/gi,
      /\bholistic(?:ally)?\b/gi,
      /\bprofound(?:ly)?\b/gi,
      /\bcommendable\b/gi,
      /\bgroundbreaking\b/gi,
      /\bgarnered\b/gi,
      /\bbolster(?:ed|ing|s)?\b/gi,
      /\bsurpass(?:es|ing|ed)?\b/gi,
      /\bintricate(?:ly)?\b/gi,
      /\baligns? with\b/gi,
      /\bresonat(?:e|es|ed|ing)\b/gi,
      /\binterplay\b/gi,
      /\bnecessitat(?:e|es|ed|ing)\b/gi,
      /\benhanc(?:e|es|ed|ing)\b/gi,
      /\bexemplif(?:y|ies|ied)\b/gi,
    ],
  },
  {
    id: "participle_tail",
    category: "Participle tail",
    tier: "medium",
    why: "AI loves tagging sentences with `, -ing…` clauses to fake analysis. Cut or rewrite as its own sentence.",
    patterns: [
      /,\s+(?:highlighting|underscoring|emphasizing|showcasing|fostering|reflecting|illustrating|demonstrating|signaling|revealing|cementing|solidifying|ensuring|contributing(?: to)?|paving the way|reinforcing|underpinning)\b/gi,
    ],
  },
  {
    id: "vague_attribution",
    category: "Vague attribution",
    tier: "medium",
    why: "Weasel-word citation. Either name a source or drop the appeal to authority.",
    patterns: [
      /\bindustry (?:reports|experts|sources|leaders|observers)\b/gi,
      /\b(?:experts|observers|critics|analysts|researchers|scholars) (?:argue|note|cite|suggest|believe|contend|maintain)\b/gi,
      /\bsome (?:critics|experts|observers)\b/gi,
      /\bstudies (?:show|suggest|indicate|reveal)\b/gi,
      /\bresearch (?:shows|suggests|indicates|reveals)\b/gi,
      /\bit (?:is|has been) (?:widely|generally|often) (?:argued|believed|recognized|acknowledged)\b/gi,
    ],
  },
  {
    id: "fluff",
    category: "Travel-brochure fluff",
    tier: "medium",
    why: "Promotional filler. Generic enough to apply to anything; meaning anything.",
    patterns: [
      /\bnestled (?:in|between|among|amidst)\b/gi,
      /\bin the heart of\b/gi,
      /\bdeeply rooted\b/gi,
      /\bsetting the stage for\b/gi,
      /\bnatural beauty\b/gi,
      /\bcommitment to (?:excellence|quality|innovation)\b/gi,
      /\brich (?:history|tradition|tapestry|heritage)\b/gi,
      /\bbreathtaking\b/gi,
      /\bstunning (?:views|vistas|scenery|beauty)\b/gi,
      /\bunparalleled\b/gi,
    ],
  },
  {
    id: "tricolon",
    category: "Tricolon / rule-of-three",
    tier: "medium",
    why: "The three-beat rhythm AI loves. Fine sometimes; suspicious in bulk.",
    patterns: [
      /\bnot (?:just|only) [^,.!?\n]{1,30}, but [^,.!?\n]{1,30} and [^,.!?\n]{1,30}/gi,
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // SOFT — context-dependent; flag for review, not deletion
  // ════════════════════════════════════════════════════════════════
  {
    id: "emdash",
    category: "Em-dash",
    tier: "soft",
    why: "AI loves em-dashes. One is fine; a sprinkle is a tell.",
    patterns: [/—/g],
  },
  {
    id: "guess_hedge",
    category: "Guess / hedge word",
    tier: "soft",
    why: "Soft hedging that sands down claims.",
    patterns: [
      /\b(?:perhaps|arguably|in some sense|to some extent|in many ways|in some ways)\b/gi,
    ],
  },
  {
    id: "generality",
    category: "Generality",
    tier: "soft",
    why: "Imprecise quantifier. Replace with specifics or cut.",
    patterns: [
      /\bmany people\b/gi,
      /\bpeople often\b/gi,
      /\bwe often\b/gi,
      /\bvarious\b/gi,
      /\bnumerous\b/gi,
      /\ba wide (?:range|variety) of\b/gi,
      /\ba variety of\b/gi,
      /\bin today'?s world\b/gi,
      /\bin modern times\b/gi,
    ],
  },
  {
    id: "ai_vocab_soft",
    category: "AI vocabulary (soft)",
    tier: "soft",
    why: "Common in AI prose. Fine in moderation; check intent.",
    patterns: [
      /\bjourney\b/gi,
      /\bembrac(?:e|ing|ed|es)\b/gi,
      /\bembark(?:s|ing|ed)?\b/gi,
      /\bembod(?:y|ies|ied|iment)\b/gi,
      /\bcrucial\b/gi,
      /\bessential\b/gi,
      /\bvital\b/gi,
      /\bkey (?:to|takeaway|driver|component)\b/gi,
      /\bever[- ](?:present|growing|expanding)\b/gi,
      /\bnotable\b/gi,
      /\bvaluable\b/gi,
      /\bera of\b/gi,
      /\blandscape\b/gi,
      /\bboast(?:s|ing|ed)?\b/gi,
      /\btestament to\b/gi,
    ],
  },
  {
    id: "copula_avoidance",
    category: "Copula avoidance",
    tier: "soft",
    why: "AI dodges plain `is/are` with elevated stand-ins. Often a plain verb reads better.",
    patterns: [
      /\bserves? as\b/gi,
      /\bstands? as\b/gi,
      /\brefers? to\b/gi,
    ],
  },
];

// Build a quick lookup by id (used for tooltips, prompt templates, etc.)
const RULES_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r]));

const TIER_MARKERS = {
  strong: { open: "[!!!", close: "]" },
  medium: { open: "[!!", close: "]" },
  soft: { open: "[!", close: "]" },
};

const TIER_WEIGHT = { strong: 3, medium: 2, soft: 1 };

function analyze(text) {
  if (!text || typeof text !== "string") {
    return { segments: [], matches: [], counts: {}, tierCounts: {}, total: 0 };
  }

  // 1) Collect every match across every rule.
  const matches = [];
  for (const rule of RULES) {
    for (const pat of rule.patterns) {
      pat.lastIndex = 0;
      let m;
      while ((m = pat.exec(text)) !== null) {
        if (m[0].length === 0) {
          pat.lastIndex++;
          continue;
        }
        matches.push({
          start: m.index,
          end: m.index + m[0].length,
          text: m[0],
          ruleId: rule.id,
          category: rule.category,
          tier: rule.tier,
          why: rule.why,
        });
      }
    }
  }

  // 2) Sort: start asc, then stronger tier first, then longer match first.
  matches.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    const tw = TIER_WEIGHT[b.tier] - TIER_WEIGHT[a.tier];
    if (tw !== 0) return tw;
    return b.end - b.start - (a.end - a.start);
  });

  // 3) Greedy non-overlap: skip anything that begins before the cursor.
  const kept = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start >= cursor) {
      kept.push(m);
      cursor = m.end;
    }
  }

  // 4) Build alternating segments for rendering.
  const segments = [];
  let i = 0;
  for (const m of kept) {
    if (m.start > i) segments.push({ kind: "plain", text: text.slice(i, m.start) });
    segments.push({ kind: "flag", ...m });
    i = m.end;
  }
  if (i < text.length) segments.push({ kind: "plain", text: text.slice(i) });

  // 5) Counts.
  const counts = {};
  const tierCounts = { strong: 0, medium: 0, soft: 0 };
  for (const m of kept) {
    counts[m.category] = (counts[m.category] || 0) + 1;
    tierCounts[m.tier]++;
  }

  return { segments, matches: kept, counts, tierCounts, total: kept.length };
}

function toMarkedText(segments) {
  return segments
    .map((s) => {
      if (s.kind === "plain") return s.text;
      const mk = TIER_MARKERS[s.tier];
      return mk.open + s.text + mk.close;
    })
    .join("");
}

// Sample text packed with tells, useful for the empty state "try with sample".
const SAMPLE_TEXT = `In today's fast-paced world, it's important to note that businesses must leverage cutting-edge AI to truly unlock their potential. Furthermore, organizations that embrace this transformative journey will find themselves navigating the complexities of a rapidly evolving landscape — one in which seamless integration and robust frameworks are absolutely essential.

It's not just about adopting new tools — it's about fostering a vibrant culture of innovation. Indeed, many people often underestimate the profound impact of comprehensive change. Here are 5 ways to delve into this multifaceted topic.

In conclusion, at the end of the day, success is a tapestry of bold decisions and pivotal moments. Imagine a world where every team moves the needle on what truly matters.`;

window.Tells = { RULES, RULES_BY_ID, analyze, toMarkedText, TIER_MARKERS, SAMPLE_TEXT };
