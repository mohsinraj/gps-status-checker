// Guest Post Site Status Checker - client-side (best-effort)
// Notes: due to CORS and Google search restrictions, this tool uses a CORS proxy (optional) to fetch pages.
// It inspects page HTML for meta robots and rel="nofollow" as heuristics for indexability and follow status.

const urlsEl = document.getElementById('urls');
const checkBtn = document.getElementById('checkBtn');
const clearBtn = document.getElementById('clearBtn');
const resultsTbody = document.querySelector('#results tbody');
const statusEl = document.getElementById('status');
const proxyEl = document.getElementById('proxy');
const downloadBtn = document.getElementById('downloadBtn');

function normalizeUrl(u){
  try{
    if(!/^https?:\/\//i.test(u)) u = 'http://' + u;
    const url = new URL(u);
    return url.href;
  } catch(e){
    return null;
  }
}

function domainOf(u){
  try{
    return new URL(u).hostname.replace(/^www\./,'');
  } catch(e){ return ''; }
}

async function checkUrl(rawUrl, proxyPrefix){
  const url = normalizeUrl(rawUrl);
  if(!url) return {url: rawUrl, error: 'invalid url'};

  const target = proxyPrefix ? (proxyPrefix + encodeURIComponent(url)) : url;
  const result = {
    url,
    alive: false,
    status: null,
    indexed: 'unknown',
    likelyDofollow: 'unknown',
    notes: []
  };

  try{
    const resp = await fetch(target, {method:'GET', mode:'cors'});
    result.status = resp.status;
    if(resp.ok){
      result.alive = true;
      const text = await resp.text();

      // meta robots check
      const lower = text.toLowerCase();
      if(/<meta[^>]*name=["']?robots["']?[^>]*>/i.test(text)){
        // extract content attribute if present
        const m = text.match(/<meta[^>]*name=["']?robots["']?[^>]*content=["']([^"']+)["']/i);
        if(m && m[1]){
          const content = m[1].toLowerCase();
          if(content.includes('noindex')){
            result.indexed = 'no (meta noindex)';
            result.notes.push('meta robots contains noindex');
          } else {
            result.indexed = 'possible (no meta noindex)';
          }
          if(content.includes('nofollow')){
            result.likelyDofollow = 'no (meta nofollow)';
            result.notes.push('meta robots contains nofollow');
          }
        } else {
          result.indexed = 'possible';
        }
      } else {
        // try X-Robots-Tag via headers - unavailable client-side usually
        result.indexed = 'likely (no meta robots tag found)';
      }

      // check anchors for rel="nofollow"
      try{
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const anchors = Array.from(doc.querySelectorAll('a[href]'));
        // look for rel="nofollow" on any anchor
        const nofollowAnchors = anchors.filter(a => (a.getAttribute('rel')||'').toLowerCase().includes('nofollow'));
        if(nofollowAnchors.length > 0){
          result.likelyDofollow = 'no (found rel="nofollow" on some anchors)';
          result.notes.push('found rel="nofollow" on anchors');
        } else {
          // If page contains many external links without nofollow, likely dofollow
          result.likelyDofollow = result.likelyDofollow.startsWith('no') ? result.likelyDofollow : 'likely (no rel=nofollow found)';
        }

        // additional heuristic: presence of "guest post" or "write for us" - useful to note
        const bodyText = doc.body ? doc.body.innerText.toLowerCase() : lower;
        if(bodyText.includes('write for us') || bodyText.includes('guest post') || bodyText.includes('submit a guest post')){
          result.notes.push('page mentions guest contributions');
        }
      }catch(e){
        result.notes.push('could not parse HTML for anchors');
      }

    } else {
      result.alive = false;
      result.notes.push('fetch returned non-OK status');
    }
  } catch(err){
    result.alive = false;
    result.notes.push('fetch error: ' + err.message);
    result.indexed = 'unknown';
    result.likelyDofollow = 'unknown';
  }

  return result;
}

function addResultRow(idx, r){
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${idx}</td>
    <td><a href="${r.url}" target="_blank" rel="noopener">${r.url}</a></td>
    <td>${r.alive ? '<span class="tag">Yes</span>' : '<span class="tag" style="opacity:.6">No</span>'}</td>
    <td>${r.status || '-'}</td>
    <td>${r.indexed}</td>
    <td>${r.likelyDofollow}</td>
    <td>${r.notes.join('; ')}</td>
  `;
  resultsTbody.appendChild(tr);
}

function csvEscape(s){
  if(s == null) return '';
  return '"' + String(s).replace(/"/g,'""') + '"';
}

function downloadCSV(rows){
  const header = ['#','url','alive','http_status','indexed','likely_dofollow','notes'];
  const lines = [header.join(',')];
  rows.forEach((r,i)=>{
    lines.push([i+1, r.url, r.alive, r.status, r.indexed, r.likelyDofollow, r.notes.join('; ')].map(csvEscape).join(','));
  });
  const blob = new Blob([lines.join('\n')], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'guestpost-site-check-results.csv';
  a.click();
  URL.revokeObjectURL(url);
}

checkBtn.addEventListener('click', async ()=>{
  const raw = urlsEl.value.trim();
  if(!raw){
    statusEl.textContent = 'Please paste one or more URLs (one per line).';
    return;
  }
  const proxy = proxyEl.value.trim() || "https://cors-proxy.fortranks564.workers.dev/?url=";
  statusEl.textContent = 'Running checks… This may take a few seconds per URL.';
  resultsTbody.innerHTML = '';
  const lines = raw.split('\n').map(l=>l.trim()).filter(Boolean);
  const results = [];
  for(let i=0;i<lines.length;i++){
    const line = lines[i];
    statusEl.textContent = `Checking ${i+1}/${lines.length} — ${line}`;
    try{
      const res = await checkUrl(line, proxy);
      addResultRow(i+1, res);
      results.push(res);
    } catch(e){
      addResultRow(i+1, {url:line, alive:false, status:'error', indexed:'unknown', likelyDofollow:'unknown', notes:[e.message]});
    }
  }
  statusEl.textContent = 'Done — results below. Remember: "indexed" & "dofollow" are heuristic checks; see details.';
  // store latest results for download
  window._gps_results = results;
});

clearBtn.addEventListener('click', ()=>{
  urlsEl.value = '';
  resultsTbody.innerHTML = '';
  statusEl.textContent = '';
  window._gps_results = [];
});

downloadBtn.addEventListener('click', ()=>{
  const rows = window._gps_results || [];
  if(rows.length === 0){
    alert('No results to download. Run checks first.');
    return;
  }
  downloadCSV(rows);
});
