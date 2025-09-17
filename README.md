# Guest Post Site Status Checker

A small client-side web tool (HTML/CSS/JS) that performs **best-effort** checks on guest-post target pages:
- **Alive** — is the page reachable (HTTP fetch).
- **Indexed (heuristic)** — scans the page for `<meta name="robots">` containing `noindex` (if found → likely not indexed).
- **Likely Dofollow (heuristic)** — scans anchors for `rel="nofollow"` and looks for `meta` robots `nofollow`.

**Important limitations**
- This tool runs in the browser and is limited by CORS. Many sites (and Google) block cross-origin requests from browsers.
- The "Indexed" result is heuristic — it does **not** query Google. To confirm index status, use Google Search Console or use `site:example.com` manually.
- The "Dofollow" result is heuristic — it checks page markup for `rel="nofollow"` or `meta` robots. A site may control outgoing link attributes differently on guest post pages.

## How to use
1. Open `index.html` in your browser (double-click or serve via static server).
2. Paste one URL per line in the textarea.
3. Optionally provide a CORS proxy (e.g. `https://api.allorigins.win/raw?url=` or your own proxy). Without a proxy, some fetches may fail due to CORS.
4. Click **Run Checks**. Results appear in the table. You can download results as CSV.

## Files
- `index.html` — main UI
- `style.css` — styling
- `script.js` — checking logic (client-side)
- `README.md` — this file

## Want server-side checks?
If you need authoritative index checks and header inspection (X-Robots-Tag), I can provide a small Node.js script (Express) that performs server-side fetches and exposes a simple API (no CORS issues). Ask me and I will add it.

## License
MIT — feel free to reuse and adapt.
