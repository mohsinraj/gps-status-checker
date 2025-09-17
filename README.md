# Guest Post Site Status Checker
A small client-side web tool (HTML/CSS/JS) that performs **best-effort** checks on guest-post target pages:

## How to use
1. Open [Guest Post Checking Tool](https://mohsinraj.github.io/gps-status-checker/) in your browser.
2. Paste one URL per line in the textarea
3. >Make sure urls you are pasting it should be post/blog/article urls not website home page ot other pages.
4. Click **Run Checks**. Results appear in the table. You can download results as CSV.

## How it's work
- **Alive** — is the page reachable (HTTP fetch).
- **Indexed (heuristic)** — scans the page for `<meta name="robots">` containing `noindex` (if found → likely not indexed).
- **Likely Dofollow (heuristic)** — scans anchors for `rel="nofollow"` and looks for `meta` robots `nofollow`.

**Important limitations**
- This tool runs in the browser and is limited by CORS. Many sites (and Google) block cross-origin requests from browsers.
- The "Indexed" result is heuristic — it does **not** query Google. To confirm index status, use Google Search Console or use `site:example.com` manually.
- The "Dofollow" result is heuristic — it checks page markup for `rel="nofollow"` or `meta` robots. A site may control outgoing link attributes differently on guest post pages.




## Check our other resources
1. [Guest Post Checking Tool](https://mohsinraj.github.io/gps-status-checker/).
2. 
