/* ================================================================
   AI in the Research Process – workshop companion (static page)
   Remote mode: Supabase RPCs with group codes (see supabase/migrations).
   Local mode (no config or "explore without a code"): this browser only.
   ================================================================ */
const CFG = window.AIRP_CONFIG || {};
const REMOTE_OK = !!(CFG.supabaseUrl && CFG.anonKey);
const TABLES = ['Table 1','Table 2','Table 3','Table 4','Table 5','Table 6','Table 7','Table 8','Table 9','Table 10','Table 11','Table 12','Facilitator'];
const TYP = {ki:'AI-native', gpt:'Custom GPT', et:'Established'};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SHORT = Object.fromEntries(PHASES.map(p => [p.id, p.short]));
const CLUSTER_OF = Object.fromEntries(CLUSTERS.flatMap(c => c.ph.map(id => [id, c.n])));
const TOOL = Object.fromEntries(TOOLS.map(t => [t.n, t]));
const wscore = t => t.r ? (t.c * t.r + 3 * 4) / (t.c + 3) : 0;   // weighted rating: single ratings do not dominate
const byScore = (a, b) => wscore(b) - wscore(a) || b.c - a.c;
const gainLabel = g => (GAINS.find(x => x[0] === g) || [g, g])[1];
const chkOf = r => !!(r && (r.c || r.g === 'n' || r.g === 'u'));   // older data used a permission answer
const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600); };

/* ---------- state ---------- */
const KEY = 'airp-v5', SKEY = 'airp-session';
const blank = () => ({t:{}, c:[], a:'Table 1'});
let state = blank();
try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && v.t) state = {t:v.t, c:Array.isArray(v.c) ? v.c : [], a:v.a || 'Table 1'}; } catch(e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e) {} };
let session = null;            // {code, role, table, workshop}
const ui = {view:'cases', lens:1, phase:0, scope:'room', resPhase:null, toolPhase:null, open:null};
const sync = {dirty:false, timer:0, poll:0, last:null, err:null, busy:false};

const remote = () => !!session;
const myTable = () => session ? (session.table || 'Viewer') : state.a;
const readOnly = () => !!session && session.role === 'viewer';
const tbl = n => (state.t[n] = state.t[n] || {r:{}, fd:{f1:'', f2:'', f3:'', q:''}});
const myR = id => (state.t[myTable()] && state.t[myTable()].r[id]) || {};
const ucsOf = p => p.uc.concat(state.c.filter(c => c.phase === p.id));
const allUcs = () => PHASES.flatMap(ucsOf);
const findUc = id => allUcs().find(u => u.id === id);

/* ---------- Supabase RPC ---------- */
async function rpc(fn, args){
  const r = await fetch(`${CFG.supabaseUrl}/rest/v1/rpc/${fn}`, {method:'POST',
    headers:{'Content-Type':'application/json', apikey:CFG.anonKey, Authorization:'Bearer ' + CFG.anonKey}, body:JSON.stringify(args)});
  const txt = await r.text(); let data = null; try { data = txt ? JSON.parse(txt) : null; } catch(e) {}
  if (!r.ok) { const e = new Error((data && (data.message || data.hint)) || ('HTTP ' + r.status)); e.status = r.status; throw e; }
  return data;
}
async function signIn(code){
  const info = await rpc('join_workshop', {p_code:code});
  session = {code:code.trim().toUpperCase(), role:info.role, table:info.table, workshop:info.workshop};
  try { localStorage.setItem(SKEY, session.code); } catch(e) {}
  await pull(true);
  startPolling();
}
function signOut(){
  session = null; try { localStorage.removeItem(SKEY); } catch(e) {}
  clearInterval(sync.poll); renderAll(); showLogin();
}
async function pull(force){
  if (!session || sync.busy) return;
  if (!force && sync.dirty) return;            // own edits are still being saved
  sync.busy = true;
  try {
    const room = await rpc('load_room', {p_code:session.code});
    const mine = myTable(), keepMine = sync.dirty ? state.t[mine] : null;
    const t = {};
    (room.tables || []).forEach(x => { t[x.name] = {r:(x.data && x.data.r) || {}, fd:Object.assign({f1:'', f2:'', f3:'', q:''}, (x.data && x.data.fd) || {})}; });
    if (keepMine) t[mine] = keepMine;
    state.t = t; state.c = (room.additions || []).filter(c => c && c.id);
    sync.last = new Date(); sync.err = null; save(); softRender();
  } catch(e) { sync.err = e.message; renderIdent(); }
  finally { sync.busy = false; }
}
function startPolling(){ clearInterval(sync.poll); sync.poll = setInterval(() => { if (document.visibilityState === 'visible') pull(false); }, 12000); }
function push(){
  save();
  if (!session || readOnly()) return;
  sync.dirty = true; renderIdent();
  clearTimeout(sync.timer);
  sync.timer = setTimeout(async () => {
    try { await rpc('save_table', {p_code:session.code, p_data:tbl(myTable())}); sync.dirty = false; sync.last = new Date(); sync.err = null; }
    catch(e) { sync.err = 'Not saved – ' + e.message; setTimeout(push, 5000); }
    renderIdent();
  }, 700);
}
async function pushAddition(c, del){
  save();
  if (!session || readOnly()) return;
  try { if (del) await rpc('delete_addition', {p_code:session.code, p_id:c.id}); else await rpc('save_addition', {p_code:session.code, p_item:c}); }
  catch(e) { toast('Could not save the use case: ' + e.message); }
}

/* ---------- room aggregation ---------- */
function room(id){
  const rs = Object.entries(state.t).map(([k, T]) => [k, T.r[id]]).filter(([, r]) => r);
  const both = rs.filter(([, r]) => r.n && r.u && !r.x);
  const avg = k => both.length ? both.reduce((s, [, r]) => s + r[k], 0) / both.length : 0;
  return {k:both.length, n:avg('n'), u:avg('u'), stars:rs.filter(([, r]) => r.f).length,
    gain:Object.fromEntries(GAINS.map(([g]) => [g, rs.filter(([, r]) => (r.b || []).includes(g)).length])),
    x:rs.filter(([, r]) => r.x).map(([k]) => k), chk:rs.filter(([, r]) => chkOf(r)).map(([k]) => k),
    tests:rs.filter(([, r]) => r.tt).map(([k, r]) => ({table:k, o:r.o || '', note:r.note || ''}))};
}
/* Step 2: each table picks up to three use cases and tries them live with Copilot */
const MAXTEST = 3;
const OUTCOME = {y:['Worked well', '#2F6410'], p:['Partly', '#7A4700'], n:['Did not work', '#5F5F5F']};
const myTests = () => allUcs().filter(u => myR(u.id).tt);

/* ---------- header ---------- */
function renderIdent(){
  const el = $('#ident');
  const st = sync.err ? `<span class="sync err">${esc(sync.err)}</span>`
    : session ? `<span class="sync ok">${sync.dirty ? 'Saving…' : sync.last ? 'Saved · updated ' + sync.last.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Connected'}</span>`
    : `<span class="sync">This browser only</span>`;
  const who = session
    ? `<span class="who">${esc(session.role === 'viewer' ? 'Viewing results' : session.table)}</span><button class="btn btn-quiet btn-sm" type="button" id="signOut">Sign out</button>`
    : `<span class="who">${state.a === 'Table 1' ? 'Explore mode' : 'Offline · ' + esc(state.a)}</span>${REMOTE_OK ? '<button class="btn btn-ghost btn-sm" type="button" id="signIn">Sign in</button>' : ''}`;
  const gear = (!session || session.role === 'facilitator') ? `<button class="icon-btn" type="button" id="menuBtn" aria-label="Facilitator menu" title="Facilitator menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button>` : '';
  el.innerHTML = st + who + gear;
}

/* ---------- use cases view ---------- */
function renderLens(){
  document.querySelectorAll('[data-lens]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.lens === ui.lens)));
  const n = myTests().length;
  $('#lensHint').textContent = ui.lens === 1
    ? 'Rate the value for your research, the kind of gain and whether you could start on Monday.'
    : `Pick one to three of your highest-rated use cases and try them live with Copilot · ${n} of ${MAXTEST} selected.`;
}
function renderPhases(){
  $('#phases').innerHTML = PHASES.map((p, i) => {
    const list = ucsOf(p), rated = list.filter(u => { const r = myR(u.id); return r.n && r.u; }).length;
    return `<button class="phase" role="tab" type="button" data-phase="${i}" aria-selected="${ui.phase === i}">
      <span class="no">${p.cross ? 'All phases' : 'Phase ' + (i + 1)}</span><span class="nm">${p.short}</span>
      <span class="ct">${list.length} use cases${rated ? ` · ${rated} rated` : ''}</span></button>`;
  }).join('');
}
function renderIntro(){
  const p = PHASES[ui.phase], el = $('#intro'), open = el.open;
  el.innerHTML = `<summary><h2>${p.name}</h2><span class="q">${p.q}</span><span class="more">Limits & discussion questions</span></summary>
    <div class="body">
      <div><h3>Objective</h3><ul><li>${p.goal}</li></ul><h3 style="margin-top:12px">Wall cluster</h3><ul><li>${CLUSTER_OF[p.id]}</li></ul></div>
      <div><h3>Limits & guardrails</h3><ul>${p.limits.map(t => `<li>${t}</li>`).join('')}</ul></div>
      <div><h3>Discussion questions</h3><ul>${p.disc.map(t => `<li>${t}</li>`).join('')}</ul></div>
    </div>`;
  el.open = open;
}
function card(u){
  const r = myR(u.id), rm = room(u.id);
  const pills = [];
  if (r.x) pills.push('<span class="pill notai">Not an AI task</span>');
  else if (r.n && r.u) pills.push(`<span class="pill rated">Value ${r.n} · Feasibility ${r.u}</span>`);
  if (r.tt) pills.push(r.o ? `<span class="pill v" style="--vc:${OUTCOME[r.o][1]}">Copilot: ${OUTCOME[r.o][0]}</span>` : '<span class="pill test">Testing with Copilot</span>');
  else if (ui.lens === 2 && r.n && r.u && !r.x) pills.push('<span class="pill">Candidate for a test</span>');
  if (!u.custom && u.risk === 3) pills.push('<span class="pill hi">High risk</span>');
  if (u.custom) pills.push(`<span class="pill">${u.by === 'Survey' ? 'From the survey' : 'From the room'}</span>`);
  if (rm.k && session) pills.push(`<span class="pill room">${rm.k} ${rm.k === 1 ? 'table' : 'tables'}</span>`);
  return `<button class="card${r.tt ? ' tested' : ''}" type="button" data-open="${esc(u.id)}" aria-current="${ui.open === u.id}">
    <h3>${r.f ? '<span class="star" aria-label="starred">★</span> ' : ''}${esc(u.t)}</h3>${u.d ? `<p>${esc(u.d)}</p>` : ''}
    <span class="foot">${pills.join('')}</span></button>`;
}
function renderCards(){
  const p = PHASES[ui.phase];
  $('#cards').innerHTML = ucsOf(p).map(card).join('') + (readOnly() ? '' : '<button class="card add" type="button" data-add>+ Add a use case</button>');
}

/* ---------- drawer ---------- */
function scale(key, val, label, hint){
  return `<div><div class="q-label">${label}</div><div class="q-hint">${hint}</div>
    <div class="scale" role="group" aria-label="${label}">${[1,2,3,4,5].map(n => `<button type="button" data-rate="${key}" data-v="${n}" aria-pressed="${val === n}">${n}</button>`).join('')}</div></div>`;
}
function testHtml(u){
  const r = myR(u.id), n = myTests().length, full = !r.tt && n >= MAXTEST;
  if (readOnly()) return '<p class="later">View only.</p>';
  let h = `<button type="button" class="toggle" data-test aria-pressed="${!!r.tt}" ${full ? 'disabled title="Your table already tests three use cases"' : ''}>${r.tt ? '✓ Selected for a Copilot test' : 'Test this with Copilot'}</button>
    <p class="q-hint">${full ? 'Your table already tests three use cases – deselect one first.' : `${n} of ${MAXTEST} selected for your table.`}</p>`;
  if (r.tt) h += `<ol class="howto"><li>Open Copilot Chat with your university login.</li><li>Give it context: your goal, a source or dataset you may share, what a good result looks like.</li><li>Check the answer against the original – then note what happened.</li></ol>
    <div><div class="q-label">How did it go?</div><div class="chips" role="group" aria-label="Copilot result">${Object.entries(OUTCOME).map(([k, v]) => `<button type="button" data-out="${k}" aria-pressed="${r.o === k}">${v[0]}</button>`).join('')}</div></div>
    <div class="field"><label for="testNote">What did you notice?</label><textarea id="testNote" data-note maxlength="400" placeholder="e.g. good first draft, but two invented references">${esc(r.note || '')}</textarea></div>`;
  return h;
}
function openDrawer(id){
  ui.open = id;
  const u = id === '__new' ? null : findUc(id);
  const d = $('#drawer');
  if (!u) {
    d.innerHTML = `<header><h2 id="drawerTitle">Add a use case · ${PHASES[ui.phase].short}</h2><button class="icon-btn" type="button" data-close aria-label="Close">✕</button></header>
      <form class="scroll" id="addForm" autocomplete="off">
        <div class="field"><label for="fTitle">Title</label><input id="fTitle" required maxlength="80" placeholder="e.g. Summarise conference talks"></div>
        <div class="field"><label for="fDesc">What should AI do – and what do you check?</label><textarea id="fDesc" maxlength="300"></textarea></div>
        <div><button class="btn btn-primary" type="submit">Add use case</button></div>
      </form>`;
  } else {
    const r = myR(u.id), rm = room(u.id), ro = readOnly();
    d.innerHTML = `<header><h2 id="drawerTitle">${esc(u.t)}</h2><button class="icon-btn" type="button" data-close aria-label="Close">✕</button></header>
      <div class="scroll">
        ${u.d ? `<p class="desc">${esc(u.d)}</p>` : ''}
        <div class="meta">${u.custom ? `<span>${u.by === 'Survey' ? 'From the pre-event survey' : 'Added in the workshop'} · ${SHORT[u.phase]}</span>` :
          `<span><b>${u.mode}:</b> ${MODE_DEF[u.mode]}</span><span><b>${RISK[u.risk]}:</b> ${RISK_DEF[u.risk]}</span>`}</div>
        <div class="block">
          <h3>Step 1 · Research value${session ? ' · ' + esc(myTable()) : ''}</h3>
          ${ro ? '<p class="later">View only – this code cannot rate.</p>' : `
          ${scale('n', r.n, 'Value', '1 nice to have · 3 saves real time · 5 removes a real bottleneck')}
          <div><div class="q-label">Kind of gain</div><div class="q-hint">Choose all that apply.</div>
            <div class="chips" role="group" aria-label="Kind of gain">${GAINS.map(([k, l]) => `<button type="button" data-gain="${k}" aria-pressed="${(r.b || []).includes(k)}">${l}</button>`).join('')}</div></div>
          ${scale('u', r.u, 'Feasibility', '1 needs data or skills you don’t have · 3 possible with effort · 5 you could start on Monday')}
          <div class="toggles">
            <button type="button" class="toggle" data-flag="f" aria-pressed="${!!r.f}">★ Star</button>
            <button type="button" class="toggle" data-flag="x" aria-pressed="${!!r.x}">Not an AI task</button>
            <button type="button" class="toggle warn" data-flag="c" aria-pressed="${chkOf(r)}">Check rules first</button>
          </div>`}
          ${rm.k ? `<div class="roomline">Room: ${rm.k} ${rm.k === 1 ? 'table' : 'tables'} · value ${rm.n.toFixed(1)} · feasibility ${rm.u.toFixed(1)}${rm.x.length ? ` · ${rm.x.length}× not an AI task` : ''}</div>` : ''}
        </div>
        <div class="block tech">
          <h3>Step 2 · Try it with Copilot</h3>
          ${ui.lens === 2 ? testHtml(u) : '<p class="later">Opens in Step 2 – first discuss the value for your research.</p>'}
        </div>
        ${u.custom && !ro && (!session || u.by === myTable() || session.role === 'facilitator') ? '<div><button class="btn btn-quiet btn-sm" type="button" data-del>Remove this use case</button></div>' : ''}
      </div>`;
  }
  d.hidden = false; $('#scrim').hidden = false;
  renderCards();
  setTimeout(() => (d.querySelector('#fTitle') || d.querySelector('h2')).focus({preventScroll:true}), 30);
  if (d.querySelector('h2')) d.querySelector('h2').tabIndex = -1;
}
function closeDrawer(){
  const id = ui.open; ui.open = null; $('#drawer').hidden = true; $('#scrim').hidden = true; renderCards();
  const back = id && document.querySelector(`[data-open="${CSS.escape(id)}"]`); if (back) back.focus();
}

/* ---------- results view ---------- */
const inPhase = u => !ui.resPhase || u.phase === ui.resPhase;
function rated(){
  const mine = myTable();
  if (ui.scope === 'table') {
    return allUcs().filter(inPhase).map(u => ({u, r:(state.t[mine] && state.t[mine].r[u.id]) || {}})).filter(e => e.r.n && e.r.u && !e.r.x)
      .map(e => ({u:e.u, n:e.r.n, m:e.r.u, f:!!e.r.f, k:1, chk:chkOf(e.r), t:!!e.r.tt})).sort((a, b) => b.n*b.m - a.n*a.m || b.n - a.n);
  }
  return allUcs().filter(inPhase).map(u => ({u, rm:room(u.id)})).filter(e => e.rm.k)
    .map(({u, rm}) => ({u, n:rm.n, m:rm.u, f:rm.stars > 0, k:rm.k, chk:rm.chk.length > 0, t:rm.tests.length > 0}))
    .sort((a, b) => b.n*b.m - a.n*a.m || b.k - a.k || b.n - a.n);
}
function renderMatrix(list){
  const W = 620, H = 460, L = 54, R = 14, T = 14, B = 52;
  const sx = v => L + (v - .5) / 5 * (W - L - R), sy = v => T + (5.5 - v) / 5 * (H - T - B), mx = sx(3), my = sy(3);
  let g = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Matrix of value against feasibility">`;
  g += `<rect x="${mx}" y="${T}" width="${W-R-mx}" height="${my-T}" fill="#EEF7E7"/><rect x="${L}" y="${T}" width="${mx-L}" height="${my-T}" fill="#FDF2F2"/>`;
  g += `<rect x="${mx}" y="${my}" width="${W-R-mx}" height="${H-B-my}" fill="#F7F7F7"/><rect x="${L}" y="${my}" width="${mx-L}" height="${H-B-my}" fill="#FBFBFB"/>`;
  [[W-R-10, T+20, 'Quick wins', 'end', '#2F6410'], [L+10, T+20, 'Strategic bets', 'start', '#A30000'], [W-R-10, H-B-12, 'Easy add-ons', 'end', '#5F5F5F'], [L+10, H-B-12, 'Deprioritise', 'start', '#5F5F5F']]
    .forEach(q => g += `<text x="${q[0]}" y="${q[1]}" text-anchor="${q[3]}" font-size="13" font-weight="700" fill="${q[4]}">${q[2]}</text>`);
  for (let v = 1; v <= 5; v++) g += `<text x="${sx(v)}" y="${H-B+20}" text-anchor="middle" font-size="12" fill="#5F5F5F">${v}</text><text x="${L-12}" y="${sy(v)+4}" text-anchor="end" font-size="12" fill="#5F5F5F">${v}</text>`;
  g += `<line x1="${mx}" y1="${T}" x2="${mx}" y2="${H-B}" stroke="#CFCFCF" stroke-dasharray="4 4"/><line x1="${L}" y1="${my}" x2="${W-R}" y2="${my}" stroke="#CFCFCF" stroke-dasharray="4 4"/>`;
  g += `<line x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}" stroke="#454545"/><line x1="${L}" y1="${T}" x2="${L}" y2="${H-B}" stroke="#454545"/>`;
  g += `<text x="${(L+W-R)/2}" y="${H-10}" text-anchor="middle" font-size="13" font-weight="700" fill="#1F1F1F">Feasibility →</text><text transform="translate(16 ${(T+H-B)/2}) rotate(-90)" text-anchor="middle" font-size="13" font-weight="700" fill="#1F1F1F">Value →</text>`;
  const groups = {};
  list.forEach((e, i) => { e.key = Math.round(e.m*2)/2 + '-' + Math.round(e.n*2)/2; (groups[e.key] = groups[e.key] || []).push(i); });
  list.forEach((e, i) => {
    const grp = groups[e.key], idx = grp.indexOf(i), cnt = grp.length, ang = idx / cnt * Math.PI * 2, rad = cnt > 1 ? 16 + (cnt > 6 ? 8 : 0) : 0;
    const x = sx(e.m) + Math.cos(ang) * rad, y = sy(e.n) + Math.sin(ang) * rad, fill = '#CC0000';
    g += `<g style="cursor:pointer" data-open="${esc(e.u.id)}"><title>${esc(e.u.t)} – value ${e.n.toFixed(1)}, feasibility ${e.m.toFixed(1)}</title>${e.f ? `<circle cx="${x}" cy="${y}" r="15" fill="none" stroke="#1F1F1F" stroke-width="2.5"/>` : ''}<circle cx="${x}" cy="${y}" r="11" fill="${fill}" stroke="#fff" stroke-width="2"/><text x="${x}" y="${y+4}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${i+1}</text></g>`;
  });
  if (!list.length) g += `<text x="${(L+W-R)/2}" y="${(T+H-B)/2}" text-anchor="middle" font-size="14" fill="#5F5F5F">No ratings yet – rate use cases in Step 1.</text>`;
  $('#matrix').innerHTML = g + '</svg>' + `<div class="legend"><span><i style="background:#fff;box-shadow:0 0 0 2px #1F1F1F"></i>Starred</span></div>`;
}
function renderResults(){
  const list = rated(), mine = myTable();
  $('#resPhase').innerHTML = `<button type="button" data-rph="" aria-pressed="${!ui.resPhase}">All phases</button>` + PHASES.map(p => `<button type="button" data-rph="${p.id}" aria-pressed="${ui.resPhase === p.id}">${p.short}</button>`).join('');
  $('#scopeTable').textContent = session && session.role === 'viewer' ? 'My table' : mine;
  $('#scopeTable').disabled = !!session && session.role === 'viewer';
  document.querySelectorAll('[data-scope]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scope === ui.scope)));
  const tabs = Object.keys(state.t).filter(k => Object.keys(state.t[k].r).length);
  $('#resSub').textContent = (ui.resPhase ? SHORT[ui.resPhase] : 'All phases') + ' · ' + (ui.scope === 'room' ? `averages over ${tabs.length} ${tabs.length === 1 ? 'table' : 'tables'} · ${list.length} rated use cases.` : `${mine} · ${list.length} rated use cases.`);
  renderMatrix(list);
  $('#rank').innerHTML = list.length ? list.slice(0, 12).map((e, i) => `<li data-open="${esc(e.u.id)}" tabindex="0"><span class="n" style="background:#CC0000">${i+1}</span><span><b>${esc(e.u.t)}</b><small>${SHORT[e.u.phase]}${ui.scope === 'room' ? ` · ${e.k} ${e.k === 1 ? 'table' : 'tables'}` : ''}${e.chk ? ' · check rules first' : ''}${e.t ? ' · tested with Copilot' : ''}</small></span><span class="sc">V ${e.n.toFixed(1)} · F ${e.m.toFixed(1)}</span></li>`).join('')
    : '<li class="empty" style="display:block;cursor:default">No use cases rated yet.</li>';
  const scope = id => ui.scope === 'room' ? room(id) : (r => ({x:r.x ? [mine] : [], chk:chkOf(r) ? [mine] : []}))(myR(id));
  const all = allUcs().filter(inPhase).map(u => ({u, s:scope(u.id)}));
  const notai = all.filter(e => e.s.x.length), chk = all.filter(e => e.s.chk.length);
  const tests = allUcs().filter(inPhase).flatMap(u => (ui.scope === 'room' ? room(u.id).tests : (r => r.tt ? [{table:mine, o:r.o || '', note:r.note || ''}] : [])(myR(u.id))).map(x => ({u, ...x})));
  const li = (e, who) => `<li data-open="${esc(e.u.id)}" tabindex="0">${esc(e.u.t)} <small>· ${SHORT[e.u.phase]}${ui.scope === 'room' && who.length ? ' · ' + who.join(', ') : ''}</small></li>`;
  $('#tests').innerHTML = `<h2>Tried with Copilot</h2><p class="sub">${tests.length} ${tests.length === 1 ? 'test' : 'tests'}${ui.scope === 'room' ? ' across the room' : ''}.</p>` + (tests.length ? `<ul class="tests">${tests.map(x => `<li data-open="${esc(x.u.id)}" tabindex="0"><span class="pill v" style="--vc:${x.o ? OUTCOME[x.o][1] : '#BDBDBD'}">${x.o ? OUTCOME[x.o][0] : 'Not yet tested'}</span> <b>${esc(x.u.t)}</b> <small>· ${esc(x.table)}</small>${x.note ? `<p>${esc(x.note)}</p>` : ''}</li>`).join('')}</ul>` : '<p class="empty">No use cases selected for a test yet (Step 2).</p>');
  $('#lists').innerHTML = `<div class="panel"><h2>Not an AI task</h2><p class="sub">Where AI is the wrong instrument.</p>${notai.length ? `<ul>${notai.map(e => li(e, e.s.x)).join('')}</ul>` : '<p class="empty">None flagged yet.</p>'}</div>
    <div class="panel"><h2>Check rules before use</h2><p class="sub">Ethics, data or policy rules to clarify first.</p>${chk.length ? `<ul>${chk.map(e => li(e, e.s.chk)).join('')}</ul>` : '<p class="empty">None flagged yet.</p>'}</div>`;
  if (!$('#fdForm').contains(document.activeElement)) renderFindingsForm();
  renderFindingsAll(); renderReport();
}
function renderFindingsForm(){
  const el = $('#fdForm');
  if (readOnly()) { el.innerHTML = '<h2>Your findings</h2><p class="empty">View only.</p>'; return; }
  const fd = tbl(myTable()).fd;
  el.innerHTML = `<h2>Findings · ${esc(myTable())}</h2><p class="sub">Three findings and one open question – as on your poster.</p>
    <div class="fd-form">${['f1','f2','f3'].map((k, i) => `<div class="field"><label for="fd-${k}">Finding ${i+1}</label><textarea id="fd-${k}" data-fd="${k}" maxlength="280">${esc(fd[k])}</textarea></div>`).join('')}
    <div class="field"><label for="fd-q">Open question</label><textarea id="fd-q" data-fd="q" maxlength="280">${esc(fd.q)}</textarea></div></div>`;
}
function fdTables(){ return Object.keys(state.t).sort((a, b) => TABLES.indexOf(a) - TABLES.indexOf(b)).filter(k => Object.values(state.t[k].fd || {}).some(Boolean)); }
function renderFindingsAll(){
  const rows = fdTables();
  $('#fdAll').innerHTML = `<h2>Findings from the room</h2><p class="sub">${rows.length} ${rows.length === 1 ? 'table' : 'tables'} with findings.</p>` +
    (rows.length ? rows.map(k => { const f = state.t[k].fd; return `<div class="fdt"><h3>${esc(k)}</h3><ul>${['f1','f2','f3'].filter(x => f[x]).map(x => `<li>${esc(f[x])}</li>`).join('')}</ul>${f.q ? `<p><b>Open question:</b> ${esc(f.q)}</p>` : ''}</div>`; }).join('') : '<p class="empty">No findings yet.</p>');
}

/* ---------- report ---------- */
function reportData(){
  const ucs = allUcs().map(u => ({u, rm:room(u.id)}));
  const ranked = ucs.filter(e => e.rm.k).sort((a, b) => b.rm.n*b.rm.u - a.rm.n*a.rm.u || b.rm.k - a.rm.k);
  return {ranked, tabs:Object.keys(state.t).filter(k => Object.keys(state.t[k].r).length || Object.values(state.t[k].fd || {}).some(Boolean)),
    notai:ucs.filter(e => e.rm.x.length), chk:ranked.filter(e => e.rm.chk.length),
    tests:ucs.flatMap(e => e.rm.tests.map(x => ({u:e.u, ...x}))),
    gains:GAINS.map(([g, l]) => ({l, n:ucs.reduce((s, e) => s + e.rm.gain[g], 0), top:ranked.filter(e => e.rm.gain[g]).sort((a, b) => b.rm.gain[g] - a.rm.gain[g] || b.rm.n - a.rm.n).slice(0, 3)})),
    fds:fdTables().map(k => [k, state.t[k].fd])};
}
function renderReport(){
  const d = reportData(), el = $('#reportBody');
  if (!d.ranked.length && !d.fds.length && !d.tests.length) { el.innerHTML = '<p class="empty">The report fills automatically once tables have rated use cases or entered findings.</p>'; return; }
  const top = d.ranked.slice(0, 10), done = d.tests.filter(x => x.o), ok = done.filter(x => x.o === 'y').length;
  el.innerHTML = `<div class="rk"><div><b>${d.tabs.length}</b><span>tables contributed</span></div><div><b>${d.ranked.length}</b><span>use cases rated</span></div><div><b>${done.length}</b><span>Copilot tests (${ok} worked well)</span></div><div><b>${d.notai.length}</b><span>not an AI task</span></div></div>
    <div class="rgrid"><div><h3>Top use cases from the room</h3><ol class="rlist">${top.map(e => `<li><b>${esc(e.u.t)}</b> <small>· ${SHORT[e.u.phase]} · value ${e.rm.n.toFixed(1)} · feasibility ${e.rm.u.toFixed(1)} · ${e.rm.k} ${e.rm.k === 1 ? 'table' : 'tables'}</small></li>`).join('')}</ol></div>
      <div><h3>Top use case per cluster</h3><ul class="rlist">${CLUSTERS.map(c => { const e = d.ranked.find(x => c.ph.includes(x.u.phase)); return `<li><b>${c.n}:</b> ${e ? esc(e.u.t) : '<small>not rated</small>'}</li>`; }).join('')}</ul>
      ${d.chk.length ? `<h3>Check rules before use</h3><ul class="rlist">${d.chk.map(e => `<li>${esc(e.u.t)}</li>`).join('')}</ul>` : ''}</div></div>
    ${d.tests.length ? `<h3>Tried with Copilot</h3><ul class="rlist">${d.tests.map(x => `<li><b>${esc(x.u.t)}</b> <small>· ${esc(x.table)} · ${x.o ? OUTCOME[x.o][0] : 'not yet tested'}</small>${x.note ? ` – ${esc(x.note)}` : ''}</li>`).join('')}</ul>` : ''}
    ${d.gains.some(x => x.n) ? `<h3>Where the room sees the gain</h3><div class="gains">${d.gains.map(x => `<div><b>${x.n}</b><span>${x.l}</span>${x.top.length ? `<ul>${x.top.map(e => `<li>${esc(e.u.t)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div>` : ''}
    <p class="rnote">Method: Step 1 research value (value 1–5 · kind of gain · feasibility 1–5); Step 2 each table tried up to three of its use cases live with Copilot. Room values are means over the tables that rated a use case; “not an AI task” ratings are excluded from the means.</p>`;
}
function reportMarkdown(){
  const d = reportData(), top = d.ranked.slice(0, 10);
  const L = ['# Results report – Generative AI in Your Research', `Workshop, 4 November 2026 · generated ${new Date().toISOString().slice(0, 10)} · ${VERSION}`, '',
    `- Tables contributed: ${d.tabs.length}`, `- Use cases rated: ${d.ranked.length}`, `- Copilot tests: ${d.tests.filter(x => x.o).length}`, `- Flagged “not an AI task”: ${d.notai.length}`, `- Tables with findings: ${d.fds.length}`, '',
    '## Top use cases from the room', ...top.map((e, i) => `${i+1}. **${e.u.t}** (${SHORT[e.u.phase]}) – value ${e.rm.n.toFixed(1)}, feasibility ${e.rm.u.toFixed(1)}, ${e.rm.k} table(s)`), '',
    '## Top use case per cluster', ...CLUSTERS.map(c => { const e = d.ranked.find(x => c.ph.includes(x.u.phase)); return `- ${c.n}: ${e ? e.u.t : 'not rated'}`; }), ''];
  if (d.tests.length) L.push('## Tried with Copilot', ...d.tests.map(x => `- ${x.u.t} (${x.table}): ${x.o ? OUTCOME[x.o][0] : 'not yet tested'}${x.note ? ' – ' + x.note : ''}`), '');
  if (d.gains.some(x => x.n)) L.push('## Where the room sees the gain', ...d.gains.map(x => `- ${x.l}: ${x.n}${x.top.length ? ' – e.g. ' + x.top.map(e => e.u.t).join('; ') : ''}`), '');
  if (d.notai.length) L.push('## Not an AI task', ...d.notai.map(e => `- ${e.u.t} (${SHORT[e.u.phase]})`), '');
  if (d.chk.length) L.push('## Check rules before use', ...d.chk.map(e => `- ${e.u.t} (${SHORT[e.u.phase]})`), '');
  if (d.fds.length) { L.push('## Findings and open questions'); d.fds.forEach(([k, f]) => { L.push(`### ${k}`, ...['f1','f2','f3'].filter(x => f[x]).map(x => `- ${f[x]}`)); if (f.q) L.push(`- Open question: ${f.q}`); L.push(''); }); }
  L.push('## Method', 'Step 1 research value (value 1–5 · kind of gain · feasibility 1–5); Step 2 each table tried up to three of its use cases live with Copilot. Room values are means over the tables that rated a use case; “not an AI task” ratings are excluded from the means.', '', 'Prof. Dr. Manuel Kern · Delivered by Hitachi Solutions');
  return L.join('\n');
}
/* ---------- tools view ---------- */
function renderTools(){
  const counts = PHASES.map(p => TOOLS.filter(t => t.ph.includes(p.id)).length);
  $('#toolFilter').innerHTML = `<button type="button" data-tph="" aria-pressed="${!ui.toolPhase}">All (${TOOLS.length})</button>` +
    PHASES.map((p, i) => `<button type="button" data-tph="${p.id}" aria-pressed="${ui.toolPhase === p.id}">${p.short} (${counts[i]})</button>`).join('');
  $('#toolGrid').innerHTML = TCATS.map((c, ci) => {
    const ts = TOOLS.filter(t => t.cat === ci && (!ui.toolPhase || t.ph.includes(ui.toolPhase))).sort(byScore);
    if (!ts.length) return '';
    return `<div class="panel tcat"><h2>${c}<span>${ts.length}</span></h2>${ts.map(t => `<div class="tool"><span>${t.url ? `<a href="https://${t.url}" target="_blank" rel="noopener">${esc(t.n)}</a>` : `<span class="nm">${esc(t.n)}</span>`}<span class="typ">${TYP[t.typ]}</span></span>${t.r ? `<span class="stars${t.c < 3 ? ' low' : ''}" title="${t.c < 3 ? 'Fewer than 3 ratings – indicative only' : 'Mean rating'}"><span class="bar"><i style="width:${t.r/5*100}%"></i></span>${t.r.toFixed(1)} <small>(${t.c})</small></span>` : '<span class="stars nr">not rated</span>'}<span class="nt">${esc(t.nt)}</span></div>`).join('')}</div>`;
  }).join('');
}

/* ---------- facilitator menu ---------- */
function openMenu(){
  const fac = session && session.role === 'facilitator';
  $('#modal').innerHTML = `<div class="box" role="dialog" aria-modal="true" aria-labelledby="menuTitle">
    <div class="ptools"><h2 id="menuTitle">Facilitator</h2><button class="icon-btn" type="button" data-mclose aria-label="Close">✕</button></div>
    <section><h3>Export</h3><div class="row"><button class="btn btn-quiet btn-sm" type="button" id="mCsv">Download results (.csv)</button><button class="btn btn-quiet btn-sm" type="button" id="mJson">Download all data (.json)</button><button class="btn btn-quiet btn-sm" type="button" id="mTsv">Copy results for Excel</button></div></section>
    <section><h3>Import survey use cases</h3><p class="sub">Paste rows from the survey export: column 1 = stage of the research journey, column 2 = use case text, optional column 3 = short title. Rows that may contain names, e-mails, links or numbers are skipped.</p>
      <textarea id="svText" placeholder="Data analysis&#9;Help me check my R code for a mixed model"></textarea><p class="sub" id="svInfo"></p><div class="row"><button class="btn btn-primary btn-sm" type="button" id="svGo">Import</button></div></section>
    ${session ? '' : `<section><h3>Offline fallback</h3><p class="sub">Only if sign-in is not possible (no network): give each laptop its own table name, so their data can be merged later.</p>
      <div class="row"><label class="sr" for="tableSel">Rate as</label><select id="tableSel" class="selectbox">${TABLES.map(t => `<option${t === state.a ? ' selected' : ''}>${t}</option>`).join('')}</select></div></section>
    <section><h3>Merge data from other laptops</h3><p class="sub">Paste the “table data” each offline laptop copied, or choose the exported files.</p>
      <textarea id="mgText"></textarea><div class="row"><button class="btn btn-primary btn-sm" type="button" id="mgGo">Merge</button><button class="btn btn-quiet btn-sm" type="button" id="mgCopy">Copy this table’s data</button><label class="btn btn-quiet btn-sm">Choose files<input type="file" id="mgFile" accept="application/json" multiple hidden></label></div></section>`}
    <section><h3>Reset</h3><p class="sub">${fac ? 'Deletes all ratings, findings and additions of this workshop for everyone.' : 'Deletes everything stored in this browser.'}</p><div class="row"><button class="btn btn-quiet btn-sm" type="button" id="mReset">${fac ? 'Reset workshop' : 'Reset this browser'}</button></div></section>
  </div>`;
  $('#modal').hidden = false; $('#modal').querySelector('[data-mclose]').focus();
}
function closeMenu(){ $('#modal').hidden = true; const b = $('#menuBtn'); if (b) b.focus(); }

/* ---------- login ---------- */
function showLogin(msg){
  $('#login').innerHTML = `<div class="box" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
    <h2 id="loginTitle">Sign in with your table code</h2>
    <p>Your table facilitator has the code. Ratings are saved for your table and appear in the results for the whole room.</p>
    <form id="loginForm" autocomplete="off"><label class="sr" for="codeIn">Table code</label><input id="codeIn" placeholder="T1-XXXX-XXXX" required>
    <p class="err" id="loginErr">${msg ? esc(msg) : ''}</p>
    <div class="acts"><button class="btn btn-primary" type="submit">Sign in</button><button class="link" type="button" id="explore">Explore without a code (this browser only)</button></div></form></div>`;
  $('#login').hidden = false; setTimeout(() => $('#codeIn').focus(), 30);
}

/* ---------- render ---------- */
function setView(v){
  ui.view = v;
  ['cases','results','tools'].forEach(k => { $('#view-' + k).hidden = k !== v; $('#tab-' + k).setAttribute('aria-selected', String(k === v)); });
  if (v === 'results') renderResults(); if (v === 'tools') renderTools();
  window.scrollTo({top:0});
}
function softRender(){
  renderIdent(); renderPhases(); renderCards();
  if (ui.view === 'results') renderResults();
  if (ui.open && ui.open !== '__new' && !$('#drawer').hidden && !$('#drawer').contains(document.activeElement)) openDrawer(ui.open);
}
function renderAll(){ renderIdent(); renderLens(); renderPhases(); renderIntro(); renderCards(); if (ui.view === 'results') renderResults(); if (ui.view === 'tools') renderTools(); }

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const tab = t.closest('[data-view]'); if (tab) { setView(tab.dataset.view); return; }
  const ln = t.closest('[data-lens]'); if (ln) { ui.lens = +ln.dataset.lens; renderLens(); renderCards(); if (ui.open && !$('#drawer').hidden) openDrawer(ui.open); return; }
  const ph = t.closest('[data-phase]'); if (ph) { ui.phase = +ph.dataset.phase; renderPhases(); renderIntro(); renderCards(); return; }
  const op = t.closest('[data-open]'); if (op) { const u = findUc(op.dataset.open); if (u) { ui.phase = PHASES.findIndex(p => p.id === u.phase); if (ui.view !== 'cases') setView('cases'); renderPhases(); renderIntro(); openDrawer(u.id); } return; }
  if (t.closest('[data-add]')) { openDrawer('__new'); return; }
  if (t.closest('[data-close]') || t === $('#scrim')) { closeDrawer(); return; }
  const sc = t.closest('[data-scope]'); if (sc && !sc.disabled) { ui.scope = sc.dataset.scope; renderResults(); return; }
  const rp = t.closest('[data-rph]'); if (rp) { ui.resPhase = rp.dataset.rph || null; renderResults(); return; }
  if (t.closest('#pdfBtn')) { if (ui.view !== 'results') setView('results'); document.title = 'Results – AI in the Research Process – ' + new Date().toISOString().slice(0, 10); window.print(); setTimeout(() => { document.title = 'AI in the Research Process'; }, 1000); return; }
  const tp = t.closest('[data-tph]'); if (tp) { ui.toolPhase = tp.dataset.tph || null; renderTools(); return; }
  if (t.closest('#signOut')) { signOut(); return; }
  if (t.closest('#signIn')) { showLogin(); return; }
  if (t.closest('#explore')) { $('#login').hidden = true; renderAll(); return; }
  if (t.closest('#menuBtn')) { openMenu(); return; }
  if (t.closest('[data-mclose]') || t === $('#modal')) { closeMenu(); return; }
  if (t.closest('#repCopy')) { copyText(reportMarkdown(), 'Report'); return; }
  if (t.closest('#repDl')) { download(`${stamp()}_ai-research-process_report.md`, reportMarkdown(), 'text/markdown'); return; }
  if (t.closest('#mCsv')) { download(`${stamp()}_ai-research-process_results.csv`, '﻿' + csv(), 'text/csv'); return; }
  if (t.closest('#mJson')) { download(`${stamp()}_ai-research-process_data.json`, JSON.stringify({version:5, exported:new Date().toISOString(), t:state.t, c:state.c}, null, 2), 'application/json'); return; }
  if (t.closest('#mTsv')) { copyText(tsv(), 'Results'); return; }
  if (t.closest('#mgCopy')) { copyText(JSON.stringify({version:5, t:{[myTable()]:tbl(myTable())}, c:state.c.filter(c => c.by === myTable())}), 'Table data'); return; }
  if (t.closest('#mgGo')) { try { const n = merge(parseBlocks($('#mgText').value)); toast(`Merged ${n} ${n === 1 ? 'table' : 'tables'}`); $('#mgText').value = ''; } catch(err) { toast('Could not read the pasted text'); } return; }
  if (t.closest('#svGo')) { importSurvey(); return; }
  if (t.closest('#mReset')) { resetArmed(t.closest('#mReset')); return; }

  // drawer controls
  const d = $('#drawer'); if (d.hidden || !d.contains(t)) return;
  const id = ui.open, u = findUc(id); if (!u || readOnly()) return;
  const rb = t.closest('[data-rate]'), gb = t.closest('[data-gain]'), fb = t.closest('[data-flag]'), tb = t.closest('[data-test]'), ob = t.closest('[data-out]');
  const T = tbl(myTable()); const r = T.r[id] = T.r[id] || {};
  if (rb) { const k = rb.dataset.rate, v = +rb.dataset.v; r[k] = r[k] === v ? 0 : v; }
  else if (gb) { const g = gb.dataset.gain, b = r.b || []; r.b = b.includes(g) ? b.filter(x => x !== g) : b.concat(g); }
  else if (fb) { const k = fb.dataset.flag; if (k === 'c') { r.c = !chkOf(r); delete r.g; } else r[k] = !r[k]; }
  else if (tb) { if (!r.tt && myTests().length >= MAXTEST) { toast('Your table already tests three use cases'); return; } r.tt = !r.tt; renderLens(); }
  else if (ob) { r.o = r.o === ob.dataset.out ? '' : ob.dataset.out; }
  else if (t.closest('[data-del]')) { state.c = state.c.filter(x => x.id !== id); Object.values(state.t).forEach(X => delete X.r[id]); pushAddition(u, true); push(); closeDrawer(); renderPhases(); toast('Use case removed'); return; }
  else return;
  push(); openDrawer(id); renderPhases();
  const again = $('#drawer').querySelector(rb ? `[data-rate="${rb.dataset.rate}"][data-v="${rb.dataset.v}"]` : gb ? `[data-gain="${gb.dataset.gain}"]` : fb ? `[data-flag="${fb.dataset.flag}"]` : tb ? '[data-test]' : `[data-out="${ob.dataset.out}"]`); if (again) again.focus();
});
document.addEventListener('change', e => {
  if (e.target.id === 'tableSel') { state.a = e.target.value; save(); renderAll(); toast('Rating as ' + state.a); }
  if (e.target.id === 'mgFile') { Promise.all([...e.target.files].map(f => f.text().then(JSON.parse))).then(list => { const n = merge(list); toast(`Merged ${n} ${n === 1 ? 'table' : 'tables'}`); }).catch(() => toast('Could not read the file')); e.target.value = ''; }
});
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.fd;
  if (e.target.dataset && 'note' in e.target.dataset && ui.open && !readOnly()) { const T = tbl(myTable()); (T.r[ui.open] = T.r[ui.open] || {}).note = e.target.value; push(); }
  if (k && !readOnly()) { tbl(myTable()).fd[k] = e.target.value; push(); clearTimeout(renderFindingsAll.t); renderFindingsAll.t = setTimeout(() => { renderFindingsAll(); renderReport(); }, 500); }
  if (e.target.id === 'svText') { const rows = parseSurvey(e.target.value), bad = rows.filter(r => !r.phase).length, risky = rows.filter(r => r.risky).length;
    $('#svInfo').textContent = rows.length ? `${rows.length} rows · ${rows.length - bad - risky} ready${bad ? ` · ${bad} without a recognised stage` : ''}${risky ? ` · ${risky} skipped (possible personal data)` : ''}` : ''; }
});
document.addEventListener('submit', async e => {
  e.preventDefault();
  if (e.target.id === 'addForm') {
    const t = $('#fTitle').value.trim(); if (!t) return;
    const nc = {id:'c-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), phase:PHASES[ui.phase].id, t, d:$('#fDesc').value.trim(), cap:[], mode:'Assist', custom:true, by:myTable()};
    state.c.push(nc); pushAddition(nc); renderPhases(); openDrawer(nc.id); toast('Use case added');
  }
  if (e.target.id === 'loginForm') {
    const code = $('#codeIn').value.trim(); if (!code) return;
    try { await signIn(code); $('#login').hidden = true; renderAll(); toast('Signed in as ' + (session.table || 'viewer')); if (session.role === 'viewer') setView('results'); }
    catch(err) { $('#loginErr').textContent = err.status === 400 || /Unknown code/.test(err.message) ? 'This code is not valid – check the spelling.' : 'Could not connect – check the network and try again.'; }
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!$('#modal').hidden) closeMenu(); else if (!$('#drawer').hidden) closeDrawer(); }
  if (e.key === 'Enter' && e.target.matches && e.target.matches('li[data-open]')) e.target.click();
});

/* ---------- helpers: export, merge, survey ---------- */
const stamp = () => new Date().toISOString().slice(0, 10);
function download(name, text, type){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type:type + ';charset=utf-8'})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
function copyText(text, what){
  const fallback = () => { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast(what + ' copied'); } catch(e) { toast('Copy failed – select and copy manually'); } ta.remove(); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => toast(what + ' copied'), fallback); else fallback();
}
function csv(){
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const head = ['Table','Phase','Wall cluster','Use case','Description','Value (1-5)','Kind of gain','Feasibility (1-5)','Score','Starred','Not an AI task','Check rules first','Tested with Copilot','Copilot result','Test note','Workshop addition'];
  const rows = [];
  Object.entries(state.t).forEach(([tn, T]) => PHASES.forEach(p => ucsOf(p).forEach(u => { const r = T.r[u.id]; if (!r || !(r.n || r.u || (r.b || []).length || chkOf(r) || r.f || r.x || r.tt)) return;
    rows.push([tn, p.name, CLUSTER_OF[p.id], u.t, u.d, r.n || '', (r.b || []).map(gainLabel).join(', '), r.u || '', (r.n && r.u) ? r.n * r.u : '', r.f ? 'yes' : '', r.x ? 'yes' : '', chkOf(r) ? 'yes' : '', r.tt ? 'yes' : '', r.o ? OUTCOME[r.o][0] : '', r.note || '', u.custom ? 'yes' : ''].map(q).join(',')); })));
  Object.entries(state.t).forEach(([tn, T]) => ['f1','f2','f3','q'].forEach(k => { if ((T.fd || {})[k]) rows.push([tn, '', '', k === 'q' ? 'OPEN QUESTION' : 'FINDING', T.fd[k]].map(q).join(',')); }));
  return [head.map(q).join(','), ...rows].join('\r\n');
}
function tsv(){
  const c = v => String(v ?? '').replace(/[\t\r\n]+/g, ' ');
  const head = ['Use case','Phase','Tables rated','Value (avg)','Feasibility (avg)','Score','Stars','Kind of gain','Not an AI task','Check rules first','Copilot tests'];
  const rows = allUcs().map(u => ({u, rm:room(u.id)})).filter(e => e.rm.k || e.rm.x.length || e.rm.chk.length || e.rm.stars || e.rm.tests.length).sort((a, b) => b.rm.n*b.rm.u - a.rm.n*a.rm.u)
    .map(({u, rm}) => [u.t, SHORT[u.phase], rm.k, rm.k ? rm.n.toFixed(1) : '', rm.k ? rm.u.toFixed(1) : '', rm.k ? (rm.n*rm.u).toFixed(1) : '', rm.stars, GAINS.filter(([g]) => rm.gain[g]).map(([g, l]) => `${l} ×${rm.gain[g]}`).join(', '), rm.x.join(' / '), rm.chk.join(' / '), rm.tests.map(x => `${x.table}: ${x.o ? OUTCOME[x.o][0] : 'selected'}`).join(' / ')].map(c).join('\t'));
  const fds = fdTables().flatMap(k => ['f1','f2','f3','q'].filter(x => state.t[k].fd[x]).map(x => [k, x === 'q' ? 'Open question' : 'Finding', c(state.t[k].fd[x])].join('\t')));
  return [head.join('\t'), ...rows, '', 'Table\tType\tText', ...fds].join('\n');
}
function parseBlocks(text){
  const out = []; let depth = 0, start = -1, inStr = false, escp = false;
  for (let i = 0; i < text.length; i++) { const ch = text[i];
    if (inStr) { if (escp) escp = false; else if (ch === '\\') escp = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true; else if (ch === '{') { if (!depth) start = i; depth++; } else if (ch === '}') { depth--; if (!depth && start >= 0) { out.push(JSON.parse(text.slice(start, i + 1))); start = -1; } } }
  if (!out.length) throw new Error('empty'); return out;
}
function merge(list){
  let n = 0;
  list.forEach(s => { if (!s || !s.t) throw new Error('bad');
    Object.entries(s.t).forEach(([k, T]) => { if (T && (Object.keys(T.r || {}).length || Object.values(T.fd || {}).some(Boolean))) { state.t[k] = {r:T.r || {}, fd:Object.assign({f1:'', f2:'', f3:'', q:''}, T.fd || {})}; n++; } });
    (s.c || []).forEach(c => { const i = state.c.findIndex(x => x.id === c.id); if (i >= 0) state.c[i] = c; else state.c.push(c); }); });
  save(); renderAll(); return n;
}
const STAGE = [[/lit|question/i,'literatur'],[/collect/i,'erhebung'],[/analy/i,'analyse'],[/writ|publish/i,'publikation'],[/plan|admin/i,'querschnitt']];
const RISKY = [/[\w.+-]+@[\w-]+\.[\w.]+/, /https?:\/\//i, /\+?\d[\d\s()-]{7,}\d/, /\b(Dr|Prof|Professor|Mr|Mrs|Ms)\.?\s+[A-Z][a-z]+/];
function parseSurvey(text){
  const phaseFor = s => { s = String(s || '').trim(); const p = PHASES.find(p => p.id === s || p.short.toLowerCase() === s.toLowerCase()); if (p) return p.id; const m = STAGE.find(([re]) => re.test(s)); return m ? m[1] : null; };
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => (l.includes('\t') ? l.split('\t') : l.split(/;|,(?=(?:[^"]*"[^"]*")*[^"]*$)/)).map(x => x.replace(/^"|"$/g, '').trim()))
    .filter(r => r.length >= 2 && r[1] && !/^(stage|phase|cluster)$/i.test(r[0]))
    .map(r => ({phase:phaseFor(r[0]), d:r[1], t:r[2] || r[1].split(/\s+/).slice(0, 7).join(' ') + (r[1].split(/\s+/).length > 7 ? ' …' : ''), risky:RISKY.some(re => re.test(r.join(' ')))}));
}
function importSurvey(){
  const rows = parseSurvey($('#svText').value).filter(r => r.phase && !r.risky);
  if (!rows.length) { toast('No rows to import – check the column order: stage, use case text'); return; }
  rows.forEach((r, i) => { const nc = {id:'s-' + Date.now().toString(36) + i, phase:r.phase, t:r.t, d:r.d, cap:[], mode:'Assist', custom:true, by:'Survey'}; state.c.push(nc); pushAddition(nc); });
  save(); renderAll(); $('#svText').value = ''; $('#svInfo').textContent = ''; toast(`${rows.length} survey use cases imported`);
}
function resetArmed(b){
  if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Click again to confirm'; b.classList.add('btn-dark'); setTimeout(() => { delete b.dataset.armed; b.classList.remove('btn-dark'); b.textContent = session ? 'Reset workshop' : 'Reset this browser'; }, 4000); return; }
  if (session && session.role === 'facilitator') { rpc('reset_workshop', {p_code:session.code}).then(() => { state.t = {}; state.c = []; save(); renderAll(); closeMenu(); toast('Workshop reset'); }).catch(e => toast('Reset failed: ' + e.message)); }
  else { state = blank(); save(); renderAll(); closeMenu(); toast('Browser data deleted'); }
}

/* ---------- start ---------- */
document.querySelectorAll('.version').forEach(e => e.textContent = VERSION);
$('#sources').innerHTML = SOURCES.map(s => `<li><a href="${s[1]}" target="_blank" rel="noopener">${s[0]}</a></li>`).join('');
renderAll();
(async () => {
  if (!REMOTE_OK) return;
  let code = null; try { code = localStorage.getItem(SKEY); } catch(e) {}
  if (code) { try { await signIn(code); renderAll(); if (session.role === 'viewer') setView('results'); return; } catch(e) { try { localStorage.removeItem(SKEY); } catch(_) {} } }
  showLogin();
})();
