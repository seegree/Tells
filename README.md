# Tells

A small in-browser tool for sniffing AI-writing tells out of pasted text. Paste a block in, get an annotated copy back with **strong / medium / soft** markers around the patterns that read like LLM output. Copy the marked-up text — or the full LLM rewrite handoff — and feed it back to any model for a more human-sounding rewrite.

Live: <!-- TODO: paste your GitHub Pages URL here once deployed -->

## What it flags

About 90 patterns across 15 categories, tiered by how distinctive each tell is:

- **Strong** — corporate-speak, AI signature words (`delve`, `tapestry`, `realm of`), sycophancy ("Great question!"), AI disclaimers ("As an AI language model"), setup-payoff hooks, closing clichés, listicle scaffolding, the negation–affirmation pivot.
- **Medium** — hedge phrases ("it's worth noting"), hollow transitions ("Furthermore", "Moreover"), vague intensifiers, AI vocabulary (`robust`, `seamless`, `pivotal`), tricolons, vague attribution ("studies show"), travel-brochure fluff ("nestled in", "in the heart of"), participle tails (", highlighting…").
- **Soft** — em-dashes, hedge words ("perhaps", "arguably"), generalities ("many people", "various"), AI-flavoured soft vocabulary (`journey`, `embark`, `vital`), copula avoidance ("serves as", "stands as").

Three copy actions:

1. **Copy marked text** — plain text with `[!!!]` / `[!!]` / `[!]` wrappers around flagged phrases.
2. **Copy LLM rewrite handoff** — the marked text plus a prompt template explaining the markers and asking the model for alternative phrasings.
3. **Copy flag list** — just the unique flagged phrases, grouped by tier.

The prompt template is editable in the Tweaks panel. Three aesthetic themes (editorial serif, mono terminal, minimal sans) are switchable in the same panel.

## Files

| File                 | What it is                                                                 |
| -------------------- | -------------------------------------------------------------------------- |
| `index.html`         | The host page. CSS, theme tokens, default tweak values.                   |
| `detection.js`       | All detection rules + the `analyze()` function. Edit here to add patterns. |
| `app.jsx`            | The React app — layout, copy actions, tooltips, counts strip.              |
| `tweaks-panel.jsx`   | Shared Tweaks-panel helpers (slider/radio/textarea controls).              |

No build step. No npm. Open `index.html` in a browser and it works — React + Babel run in-browser via CDN.

## Running locally

Easiest: open `index.html` directly in a browser. That's it.

If you want a local server (some browsers are stricter about loading sibling `.jsx` files via `file://`):

```sh
# Python 3
python3 -m http.server 8000

# or Node, if installed
npx serve .
```

Then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Push this folder to a public GitHub repo.
2. Repo → **Settings → Pages**.
3. Source: `Deploy from a branch` → Branch: `main`, Folder: `/ (root)`. Save.
4. Wait ~60 seconds. Your tool is live at `https://<your-username>.github.io/<repo-name>/`.

Custom domain: in **Settings → Pages → Custom domain**, add e.g. `tells.yoursite.com` and create a `CNAME` DNS record pointing at `<your-username>.github.io`.

## Adding or tweaking detection rules

Every rule lives in `detection.js` as an object in the `RULES` array:

```js
{
  id: "fluff",
  category: "Travel-brochure fluff",
  tier: "medium",                 // strong | medium | soft
  why: "Promotional filler …",    // shown in the hover tooltip
  patterns: [
    /\bnestled (?:in|between|among|amidst)\b/gi,
    /\bin the heart of\b/gi,
    // …
  ],
}
```

To add a phrase to an existing category, drop another regex into its `patterns` array. To add a whole new category, copy the shape above and append it to `RULES`. Patterns must be regexes with the `g` (and usually `i`) flag set. Word boundaries (`\b`) matter — without them you'll match substrings.

Tier weight matters for overlap resolution: at the same start position, the analyzer keeps the strongest match.

## Customizing the prompt template

The rewrite-prompt the "Copy LLM rewrite handoff" button uses is editable in the **Tweaks panel** at runtime (bottom-right toolbar in your deployed app). Inside the template, `{{TEXT}}` is replaced with the marked-up text.

The default lives inline at the top of `index.html`, inside `DEFAULT_PROMPT`. Edit that string to change the baked-in default.

## License

MIT, or whatever you like — pick one and put it here once you're ready to share.
