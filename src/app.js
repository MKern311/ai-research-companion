/* ================================================================
   AI in the Research Process – workshop companion (static page)
   Remote mode: Supabase RPCs with group codes (see supabase/migrations).
   Local mode (no config or "explore without a code"): this browser only.
   ================================================================ */
const CFG = window.AIRP_CONFIG || {};
const REMOTE_OK = !!(CFG.supabaseUrl && CFG.anonKey);
const TABLES = ['Group 1','Group 2','Group 3','Group 4','Group 5','Group 6','Group 7','Group 8','Group 9','Group 10','Group 11','Group 12','Facilitator'];
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
const blank = () => ({t:{}, c:[], a:'Group 1'});
let state = blank();
try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && v.t) state = {t:v.t, c:Array.isArray(v.c) ? v.c : [], a:(v.a && v.a !== 'Table 1' ? v.a : 'Group 1'), off:!!v.off, remote:!!v.remote}; } catch(e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e) {} };
let session = null;            // {code, role, table, workshop}
const ui = {gmode:'practice', view:'agenda', lens:1, phase:0, scope:'room', resTable:null, resPhase:null, resDisc:'', toolPhase:null, toolMcp:false, open:null, back:null, explore:false};
const sync = {dirty:false, timer:0, poll:0, last:null, err:null, busy:false, rev:0};
// step and explore choice survive a reload within the same browser tab
const UKEY = 'airp-ui';
try { const v = JSON.parse(sessionStorage.getItem(UKEY) || 'null'); if (v) { ui.lens = v.lens === 2 ? 2 : 1; ui.explore = !!v.explore; } } catch(e) {}
const saveUi = () => { try { sessionStorage.setItem(UKEY, JSON.stringify({lens:ui.lens, explore:ui.explore})); } catch(e) {} };

const remote = () => !!session;
// the facilitator rates as "Facilitator" to demonstrate the tool; those ratings never count in room values, rankings or results
const DEMO = 'Facilitator';
const myTable = () => session ? (session.role === 'facilitator' ? DEMO : session.table || 'Viewer') : state.a;
const readOnly = () => !!session && session.role === 'viewer';
const tbl = n => (state.t[n] = state.t[n] || {r:{}, fd:{f1:'', f2:'', f3:'', q:''}, disc:''});
const tblFrom = d => ({r:(d && d.r) || {}, fd:Object.assign({f1:'', f2:'', f3:'', q:''}, (d && d.fd) || {}), disc:String((d && d.disc) || '').slice(0, 60)});
// discipline of a group, e.g. "Marketing"; groups with the same discipline are compared together
const discOf = k => ((state.t[k] && state.t[k].disc) || '').trim();
const discKey = s => s.trim().toLowerCase().replace(/\s+/g, ' ');
const groupLabel = k => discOf(k) ? `${k} · ${discOf(k)}` : k;
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
async function signIn(code, ask){
  const info = await rpc('join_workshop', {p_code:code});
  const local = !session && !state.remote && state.t[state.a], localN = local ? Object.keys(local.r).filter(id => findUc(id)).length : 0;
  session = {code:code.trim().toUpperCase(), role:info.role, table:info.table, workshop:info.workshop};
  try { localStorage.setItem(SKEY, session.code); } catch(e) {}
  await pull(true);
  // ratings made in explore mode before signing in: offer to carry them over instead of dropping them
  if (ask && localN && session.role === 'table' && window.confirm(`Transfer the ${localN} ${localN === 1 ? 'use case' : 'use cases'} you rated or tested in explore mode into ${session.table}? What ${session.table} already has is kept.`)) {
    const T = tbl(myTable());
    Object.entries(local.r).forEach(([id, r]) => { if (!findUc(id) || T.r[id]) return; const c = Object.assign({}, r); if (c.tt && myTests().length >= MAXTEST) { delete c.tt; delete c.o; delete c.note; } T.r[id] = c; });
    if (!T.disc && local.disc) T.disc = local.disc;
    push(); softRender();
  }
  startPolling();
}
function signOut(){
  session = null; try { localStorage.removeItem(SKEY); } catch(e) {}
  state = blank(); save();                        // do not keep the room's data in explore mode
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
    (room.tables || []).forEach(x => { t[x.name] = tblFrom(x.data); });
    if (keepMine) t[mine] = keepMine;
    state.t = t; state.c = (room.additions || []).filter(c => c && c.id); state.remote = true;
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
  const rev = ++sync.rev;                     // a newer edit during the request keeps the group "dirty"
  sync.timer = setTimeout(async () => {
    try { await rpc('save_table', {p_code:session.code, p_data:tbl(myTable())}); if (sync.rev === rev) sync.dirty = false; sync.last = new Date(); sync.err = null; }
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
// disc: only groups of this discipline (key from discKey); empty = whole room
const inDisc = (k, disc) => k !== DEMO && (!disc || discKey(discOf(k)) === disc);
function room(id, disc){
  const rs = Object.entries(state.t).filter(([k]) => inDisc(k, disc)).map(([k, T]) => [k, T.r[id]]).filter(([, r]) => r);
  const both = rs.filter(([, r]) => r.n && r.u && !r.x);
  const avg = k => both.length ? both.reduce((s, [, r]) => s + r[k], 0) / both.length : 0;
  return {k:both.length, n:avg('n'), u:avg('u'), stars:rs.filter(([, r]) => r.f).length,
    gain:Object.fromEntries(GAINS.map(([g]) => [g, rs.filter(([, r]) => (r.b || []).includes(g)).length])),
    x:rs.filter(([, r]) => r.x).map(([k]) => k), chk:rs.filter(([, r]) => chkOf(r)).map(([k]) => k),
    tests:rs.filter(([, r]) => r.tt).map(([k, r]) => ({table:k, o:r.o || '', note:r.note || ''}))};
}
// room ranking: means shrunk towards the scale midpoint by two virtual groups, so one group's 5×5 does not beat three groups' 5×4
const shrink = (v, k) => (k * v + 2 * 3) / (k + 2);
const roomScore = rm => shrink(rm.n, rm.k) * shrink(rm.u, rm.k);
const byRoom = (a, b) => roomScore(b) - roomScore(a) || b.k - a.k || b.n - a.n;
/* Step 2: each group picks up to three use cases and tries them live with Copilot */
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
    ? `<span class="who" title="${esc(session.role === 'viewer' ? 'Viewing results' : groupLabel(session.table))}">${esc(session.role === 'viewer' ? 'Viewing results' : groupLabel(session.table))}</span><button class="btn btn-quiet btn-sm" type="button" id="signOut">Sign out</button>`
    : `<span class="who">${state.off ? 'Offline · ' + esc(groupLabel(state.a)) : 'Explore mode'}</span>${REMOTE_OK ? '<button class="btn btn-ghost btn-sm" type="button" id="signIn">Sign in</button>' : ''}`;
  const gear = (!session || session.role === 'facilitator') ? `<button class="icon-btn" type="button" id="menuBtn" aria-label="Facilitator menu" title="Facilitator menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button>` : '';
  el.innerHTML = st + who + gear;
}

/* ---------- use cases view ---------- */
const canRate = () => !readOnly();
function renderDisc(){
  const el = $('#discBar');
  el.hidden = !canRate() || myTable() === DEMO;
  if (el.hidden) return;
  const own = discOf(myTable()), inp = $('#discIn');
  const others = [...new Set(Object.keys(state.t).filter(k => k !== myTable()).map(discOf).filter(Boolean))].sort();
  if (!inp) {
    el.innerHTML = `<label for="discIn">Your group’s discipline</label>
      <input id="discIn" list="discList" maxlength="60" autocomplete="off" placeholder="e.g. Marketing, Mechanical engineering, Psychology">
      <datalist id="discList"></datalist>
      <p class="q-hint">Rate and test every use case from the point of view of this discipline – in Step 1 and Step 2. Two groups may share a discipline; the results compare disciplines.</p>`;
  }
  if (document.activeElement !== $('#discIn')) $('#discIn').value = own;
  $('#discList').innerHTML = others.map(d => `<option value="${esc(d)}">`).join('');
}
function renderLens(){
  document.querySelectorAll('[data-lens]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.lens === ui.lens)));
  const n = myTests().length;
  $('#lensHint').textContent = ui.lens === 1
    ? 'Rate the value for your research, the kind of gain and whether you could start on Monday.'
    : readOnly() ? 'View only – open a use case to see how to try it with Copilot.'
    : `Pick one to three of your highest-rated use cases and try them live with Copilot · ${n} of ${MAXTEST} selected.`;
  $('#levels').hidden = ui.lens !== 2;
  $('#levels').innerHTML = `<h2>Four levels of working with Copilot</h2><p class="sub">Start at level 1. In round 2, go further – the guide in each use case shows how to take it to the next level.</p>
    <ol class="lv-grid">${LEVELS.map(([t, d, r], i) => `<li><span class="lv-n">Level ${i + 1} · ${r}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ol>`;
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
      <div><h3>Objective</h3><ul><li>${p.goal}</li></ul></div>
      <div><h3>Limits & guardrails</h3><ul>${p.limits.map(t => `<li>${t}</li>`).join('')}</ul></div>
      <div><h3>Discussion questions</h3><ul>${p.disc.map(t => `<li>${t}</li>`).join('')}</ul></div>
    </div>`;
  el.open = open;
}
function card(u, rank){
  const r = myR(u.id), rm = room(u.id);
  const pills = [];
  if (u.ex) pills.push('<span class="pill ex">Excursus</span>');
  if (r.x) pills.push('<span class="pill notai">Not an AI task</span>');
  else if (r.n && r.u) pills.push(`<span class="pill rated">Value ${r.n} · Feasibility ${r.u}</span>`);
  if (r.tt) pills.push(r.o ? `<span class="pill v" style="--vc:${OUTCOME[r.o][1]}">Copilot: ${OUTCOME[r.o][0]}</span>` : '<span class="pill test">Testing with Copilot</span>');
  else if (ui.lens === 2 && r.n && r.u && !r.x) pills.push('<span class="pill">Candidate for a test</span>');
  if (!u.custom && u.risk === 3) pills.push('<span class="pill hi">High risk</span>');
  if (u.custom) pills.push(`<span class="pill">${u.by === 'Survey' ? 'From the survey' : 'From the room'}</span>`);
  if (rm.k && session) pills.push(`<span class="pill room">${rm.k} ${rm.k === 1 ? 'group' : 'groups'}</span>`);
  const low = ui.lens === 2 && !readOnly() && (r.x || !(r.n && r.u));
  if (low && !r.x) pills.push('<span class="pill">Not rated yet</span>');
  const wish = !u.custom && WISH[u.id];
  return `<button class="card${r.tt ? ' tested' : ''}${low ? ' low' : ''}${wish ? ' wish' : ''}" type="button" data-open="${esc(u.id)}" aria-current="${ui.open === u.id}"${wish ? ' title="Asked for in the pre-workshop survey"' : ''}>
    ${rank ? `<span class="rankno">#${rank} in this phase · ${r.n}×${r.u}</span>` : ''}<h3>${r.f ? '<span class="star" aria-label="starred">★</span> ' : ''}${esc(u.t)}</h3>${u.d ? `<p>${esc(u.d)}</p>` : ''}
    <span class="foot">${pills.join('')}</span>${wish ? '<span class="sr-only">Asked for in the pre-workshop survey.</span>' : ''}</button>`;
}
const prio = u => { const r = myR(u.id); return r.x ? -2 : (r.n && r.u) ? r.n * r.u + (r.f ? .5 : 0) + (r.tt ? .25 : 0) : -1; };
function renderCards(){
  const p = PHASES[ui.phase];
  let list = ucsOf(p);
  if (ui.lens === 2) list = list.slice().sort((a, b) => prio(b) - prio(a));
  let rank = 0;
  // Step 2: the group's best-rated use cases across all phases, so the pick is not limited to the phase on screen
  const top = ui.lens === 2 && !readOnly() ? allUcs().filter(u => prio(u) > 0).sort((a, b) => prio(b) - prio(a)).slice(0, 5) : [];
  const topHtml = top.length ? `<div class="topstrip"><b>Your top use cases (all phases)</b><ol>${top.map(u => { const r = myR(u.id); return `<li><button type="button" class="linkbtn" data-open="${esc(u.id)}">${r.tt ? '✓ ' : ''}${esc(u.t)}</button> <small>${SHORT[u.phase]} · ${r.n}×${r.u}</small></li>`; }).join('')}</ol></div>` : '';
  const wishKey = list.some(u => !u.custom && WISH[u.id]) ? '<p class="wishkey"><i aria-hidden="true"></i>Red outline: asked for in the pre-workshop survey</p>' : '';
  $('#cards').innerHTML = wishKey + (ui.lens === 2 && !readOnly() ? `${topHtml}<p class="sortnote">Sorted by your group’s priority in this phase (value × feasibility). Pick one to three use cases in total and try them with Copilot.</p>` : '') +
    list.map(u => card(u, ui.lens === 2 && prio(u) > 0 ? ++rank : 0)).join('') + (readOnly() ? '' : '<button class="card add" type="button" data-add>+ Add a use case</button>');
}

/* ---------- drawer ---------- */
function scale(key, val, label, hint){
  return `<div><div class="q-label">${label}</div><div class="q-hint">${hint}</div>
    <div class="scale" role="group" aria-label="${label}">${[1,2,3,4,5].map(n => `<button type="button" data-rate="${key}" data-v="${n}" aria-pressed="${val === n}">${n}</button>`).join('')}</div></div>`;
}
const GENERIC = {bring:'Material for your own example: a short text, an open-access paper or a dummy dataset – nothing personal or confidential.',
  steps:['Open Copilot Chat with your university login.','Describe your goal and attach or paste the material.','Say what a good result looks like (format, length).','Compare the answer with your material and note what happened.'],
  prompt:'I am a postgraduate researcher in [discipline]. My goal: [what you want to achieve]. Material: [attached file / pasted text]. Please [task]. Give the result as [format, length]. If you are not sure about something, say so; do not invent sources.',
  check:'The result is correct against your material and saves you real time.'};
const COPILOT_URL = 'https://m365.cloud.microsoft/chat';   // Microsoft 365 Copilot Chat, university sign-in
const practiceOf = id => (typeof DETAILS !== 'undefined' && DETAILS[id] && DETAILS[id].practice) || null;
// the group's discipline replaces the placeholder in own-material prompts
const withDisc = t => discOf(myTable()) ? t.replace(/\[(your )?discipline\]/gi, discOf(myTable())) : t;
const promptOf = id => { const pr = practiceOf(id); return pr && ui.gmode === 'practice' ? pr.prompt : withDisc(((typeof GUIDES !== 'undefined' && GUIDES[id]) || GENERIC).prompt); };
const refList = () => PACK.papers.map(p => `${p.id} ${p.cite} https://doi.org/${p.doi}`).join('\n');
function packFiles(id){
  if (id === 'papers') return `<li><b>All ${PACK.papers.length} papers</b> <a href="${PACK_URL}ai-research-practice-pack.zip" download>practice pack · ZIP · ${mb(PACK.zips.all)}</a> <button type="button" class="linkbtn" data-copyrefs>Copy all ${PACK.papers.length} references</button></li>`;
  const x = (PACK.extras || []).find(e => e.id === id);
  if (x) return `<li><b>${id}</b> <a href="${fileUrl(x.file)}" download>${esc(x.title)} · ${x.file.split('.').pop().toUpperCase()} · ${mb(x.size)}</a></li>`;
  const p = PACK.papers.find(x => x.id === id);
  if (p) return `<li><b>${id}</b> <a href="${fileUrl(p.file)}" target="_blank" rel="noopener">${esc(packLabel(id))} · PDF · ${mb(p.size)}</a></li>`;
  const d = PACK.data.find(x => x.id === id);
  return d ? `<li><b>${id}</b> ${esc(d.title)}: ${d.files.map(f => `<a href="${fileUrl(f.f)}" download>${esc(f.f.split('/').pop())} · ${mb(f.size)}</a>`).join(', ')}</li>` : '';
}
function levelsOf(u){
  const x = (typeof DETAILS !== 'undefined' && DETAILS[u.id]) || {tech:{routes:[], data:[], connect:[], repos:[]}}, t = x.tech;
  const con = (u.ix || []).concat((t.connect || []).filter(n => !(u.ix || []).includes(n)));
  // level 3 names only real agent skills; level 4 only tools Copilot Studio can reach (remote MCP server or Copilot connector)
  const reach = n => (MCP[n] && MCP[n][1]) || (M365[n] || []).some(x => x[0] === 'copilot');
  return {two: t.routes.includes('files') || t.data.length > 1, con, studio: con.filter(reach), repos: (t.repos || []).filter(k => REPOS[k] && REPOS[k][2] === 'Agent skill')};
}
function furtherHtml(u){
  const L = levelsOf(u), pr = practiceOf(u.id), files = pr && pr.data.length ? pr.data.map(id => id === 'papers' ? 'the practice papers' : id).join(', ') : 'your files';
  const items = [];
  if (L.two) items.push(`<li><b>Level 2 · Project</b> Create a Copilot notebook (or a Cowork project), add ${esc(files)} as references and paste the starter prompt as the notebook's instructions. Ask follow-up questions across all files – the notebook keeps the context.</li>`);
  items.push(`<li><b>Level 3 · Agent</b> In Copilot Chat choose New agent (Agent Builder): turn the starter prompt into standing instructions${L.two ? ', add the files as knowledge' : ''}${L.repos.length ? `, and add a matching skill (${L.repos.map(k => esc(REPOS[k][0])).join(', ')})` : ''}. Test it, then reuse it for every new ${u.phase === 'analyse' || u.phase === 'erhebung' ? 'dataset' : u.phase === 'publikation' ? 'draft' : 'paper or question'}.</li>`);
  if (L.studio.length) items.push(`<li><b>Level 4 · Copilot Studio</b> Connect ${L.studio.map(esc).join(', ')} so the agent can search or use them directly – via MCP or a connector, which an agent alone cannot hold. Needs your IT team; <button type="button" class="linkbtn" data-view="tools" data-mcpinfo>how it works →</button></li>`);
  return `<div class="further"><h4>Take it further</h4><ol>${items.join('')}</ol></div>`;
}
function guideHtml(u, open){
  const g = (typeof GUIDES !== 'undefined' && GUIDES[u.id]) || GENERIC, pr = practiceOf(u.id), pm = pr && ui.gmode === 'practice';
  const seg = pr ? `<div class="seg gseg" role="group" aria-label="Material for the test"><button type="button" data-gmode="practice" aria-pressed="${pm}">With the practice data</button><button type="button" data-gmode="own" aria-pressed="${!pm}">With your own material</button></div>` : '';
  if (pm) return `<details class="guide"${open ? ' open' : ''}><summary>How to try it with Copilot · about 10 minutes</summary>${seg}
    <p>${esc(pr.task)}</p>
    ${pr.data.length || pr.attach_note ? `<p><b>Attach to Copilot:</b></p><ul class="pfiles">${pr.data.map(id => packFiles(id)).join('')}${pr.attach_note ? `<li>${esc(pr.attach_note)}</li>` : ''}</ul>` : '<p><b>Nothing to attach</b> – the prompt contains all Copilot needs.</p>'}
    ${(pr.ref || []).length ? `<p><b>Keep open for checking – do not attach:</b></p><ul class="pfiles ref">${pr.ref.map(id => packFiles(id)).join('')}</ul>` : ''}
    <div class="prompt"><div class="ptools"><b>Starter prompt · practice data</b><span class="row"><button type="button" class="btn btn-quiet btn-sm" data-copyprompt>Copy prompt</button><a class="btn btn-primary btn-sm" href="${COPILOT_URL}" target="_blank" rel="noopener" data-opencopilot title="Copies the prompt and opens Copilot in a new tab">Open Copilot ↗</a></span></div><pre>${esc(pr.prompt)}</pre></div>
    <p><b>Check:</b> ${esc(pr.check)}</p>${g.limit ? `<p class="limit"><b>Limit:</b> ${esc(g.limit)}</p>` : ''}
    ${furtherHtml(u)}
    <p class="sub">All files and test ideas: <button type="button" class="linkbtn" data-view="data">Practice data →</button></p></details>`;
  return `<details class="guide"${open ? ' open' : ''}><summary>How to try it with Copilot · about 10 minutes</summary>${seg}
    <p><b>Bring:</b> ${esc(g.bring)}</p>
    <ol class="howto">${g.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
    <div class="prompt"><div class="ptools"><b>Starter prompt</b><span class="row"><button type="button" class="btn btn-quiet btn-sm" data-copyprompt>Copy prompt</button><a class="btn btn-primary btn-sm" href="${COPILOT_URL}" target="_blank" rel="noopener" data-opencopilot title="Copies the prompt and opens Copilot in a new tab">Open Copilot ↗</a></span></div><pre>${esc(withDisc(g.prompt))}</pre></div>
    <p><b>Check:</b> ${esc(g.check)}</p>${g.limit ? `<p class="limit"><b>Limit:</b> ${esc(g.limit)}</p>` : ''}
    ${furtherHtml(u)}
    <p class="sub">No suitable material at hand? <button type="button" class="linkbtn" data-view="data">Use the practice data →</button></p></details>`;
}
function testHtml(u){
  const r = myR(u.id), n = myTests().length, full = !r.tt && n >= MAXTEST;
  if (!canRate()) return guideHtml(u, false);
  const warn = r.tt ? '' : r.x ? ' You flagged this as not an AI task in Step 1.' : !(r.n && r.u) ? ' Not rated yet – rate it in Step 1 first.' : '';
  let h = `<button type="button" class="toggle" data-test aria-pressed="${!!r.tt}" ${full ? 'disabled title="Your group already tests three use cases"' : ''}>${r.tt ? '✓ Selected for a Copilot test' : 'Test this with Copilot'}</button>
    <p class="q-hint">${full ? 'Your group already tests three use cases – deselect one first.' : `${n} of ${MAXTEST} selected for your group.`}${warn ? `<span class="warnhint">${warn}</span>` : ''}</p>`;
  h += guideHtml(u, !!r.tt);
  if (r.tt) h += `
    <div><div class="q-label">After testing: how did it go?</div><div class="chips" role="group" aria-label="Copilot result">${Object.entries(OUTCOME).map(([k, v]) => `<button type="button" data-out="${k}" aria-pressed="${r.o === k}">${v[0]}</button>`).join('')}</div></div>
    <div class="field"><label for="testNote">What did you notice?</label><textarea id="testNote" data-note maxlength="400" placeholder="e.g. good first draft, but two invented references">${esc(r.note || '')}</textarea></div>`;
  return h;
}
let drawerHtml = '';
function step1Html(u){
  const r = myR(u.id), rm = room(u.id);
  return `<div class="block">
          <h3>Step 1 · Research value${session && canRate() ? ' · ' + (myTable() === DEMO ? 'Facilitator demo' : esc(groupLabel(myTable()))) : ''}</h3>
          ${myTable() === DEMO ? '<p class="q-hint">Your ratings as facilitator are for demonstration only and never count in the room results.</p>' : ''}
          ${!canRate() ? '<p class="later">View only – this code cannot rate.</p>' : `
          ${scale('n', r.n, 'Value', '1 nice to have · 3 saves real time · 5 removes a real bottleneck')}
          <div><div class="q-label">Kind of gain</div><div class="q-hint">Choose all that apply.</div>
            <div class="chips" role="group" aria-label="Kind of gain">${GAINS.map(([k, l]) => `<button type="button" data-gain="${k}" aria-pressed="${(r.b || []).includes(k)}">${l}</button>`).join('')}</div></div>
          ${scale('u', r.u, 'Feasibility', '1 needs data or skills you don’t have · 3 possible with effort · 5 you could start on Monday')}
          <div class="toggles">
            <button type="button" class="toggle" data-flag="f" aria-pressed="${!!r.f}">★ Star</button>
            <button type="button" class="toggle" data-flag="x" aria-pressed="${!!r.x}">Not an AI task</button>
            <button type="button" class="toggle warn" data-flag="c" aria-pressed="${chkOf(r)}">Check rules first</button>
          </div>
          <p class="q-hint">★ = we want to try this in Step 2 · Not an AI task = AI is the wrong instrument here · Check rules first = ethics, data or policy rules to clarify before use</p>`}
          ${rm.k ? `<div class="roomline">Room: ${rm.k} ${rm.k === 1 ? 'group' : 'groups'} · value ${rm.n.toFixed(1)} · feasibility ${rm.u.toFixed(1)}${rm.x.length ? ` · ${rm.x.length}× not an AI task` : ''}</div>` : ''}
        </div>`;
}
function step2Html(u){
  return `<div class="block tech">
          <h3>Step 2 · Try it with Copilot</h3>
          ${ui.lens === 2 ? testHtml(u) : `<p class="later">Opens in Step 2 – first discuss the value for your research. <button type="button" class="linkbtn" data-lens="2">Switch to Step 2 →</button></p>`}
        </div>`;
}
function openDrawer(id){
  const d = $('#drawer'), again = !d.hidden && ui.open === id;   // re-render of the open use case (poll, rating, lens)
  const sc = again && d.querySelector('.scroll'), top = sc ? sc.scrollTop : 0;
  const gd = again && d.querySelector('details.guide'), gOpen = gd ? gd.open : null;
  const bd = again && d.querySelector('details.bg'), bOpen = bd ? bd.open : null;
  if (!again) ui.gmode = 'practice';                              // every use case starts with the practice data
  ui.open = id;
  const u = id === '__new' ? null : findUc(id);
  let h;
  if (!u) {
    h = `<header><h2 id="drawerTitle">Add a use case · ${PHASES[ui.phase].short}</h2><button class="icon-btn" type="button" data-close aria-label="Close">✕</button></header>
      <form class="scroll" id="addForm" autocomplete="off">
        <div class="field"><label for="fTitle">Title</label><input id="fTitle" required maxlength="80" placeholder="e.g. Summarise conference talks"></div>
        <div class="field"><label for="fDesc">What should AI do – and what do you check?</label><textarea id="fDesc" maxlength="300"></textarea></div>
        <div><button class="btn btn-primary" type="submit">Add use case</button></div>
      </form>`;
  } else {
    const ro = readOnly(), x = (typeof DETAILS !== 'undefined' && DETAILS[u.id]) || null;
    // the step in progress comes first; background, methods and technology are folded away below
    h = `<header><h2 id="drawerTitle">${esc(u.t)}</h2><button class="icon-btn" type="button" data-close aria-label="Close">✕</button></header>
      <div class="scroll">
        ${u.ex ? '<p class="exnote"><b>Excursus.</b> Research on language models, not a method for every discipline: model outputs are not valid data about real people.</p>' : ''}
        ${u.d ? `<p class="desc">${esc(u.d)}</p>` : ''}
        <div class="meta">${u.custom ? `<span>${u.by === 'Survey' ? 'From the pre-event survey' : 'Added in the workshop'} · ${SHORT[u.phase]}</span>` :
          `<span><b>${u.mode}:</b> ${MODE_DEF[u.mode]}</span><span><b>${RISK[u.risk]}:</b> ${RISK_DEF[u.risk]}</span>`}</div>
        ${!u.custom && WISH[u.id] ? `<div class="wishq"><b>Asked for in the survey</b>${WISH[u.id].map(q => `<q>${esc(q)}</q>`).join('')}</div>` : ''}
        ${x ? `<div class="ux"><div class="ux-pr"><div><h4>The problem</h4><p>${esc(x.problem)}</p></div><div><h4>Result and value</h4><p>${esc(x.result)}</p></div></div></div>` : ''}
        ${ui.lens === 2 ? step2Html(u) + step1Html(u) : step1Html(u) + step2Html(u)}
        ${backgroundHtml(u)}
        ${u.custom && !ro && (!session || u.by === myTable() || session.role === 'facilitator') ? '<div><button class="btn btn-quiet btn-sm" type="button" data-del>Remove this use case</button></div>' : ''}
      </div>`;
  }
  if (again && h === drawerHtml) return;                          // nothing changed – leave the DOM and scroll position alone
  drawerHtml = h; d.innerHTML = h;
  if (again) {
    const g = d.querySelector('details.guide'); if (g && gOpen !== null) g.open = gOpen;
    const b = d.querySelector('details.bg'); if (b && bOpen !== null) b.open = bOpen;
    const s2 = d.querySelector('.scroll'); if (s2) s2.scrollTop = top;
  }
  d.hidden = false; $('#scrim').hidden = false; setInert(true);
  renderCards();
  if (!again) setTimeout(() => (d.querySelector('#fTitle') || d.querySelector('h2')).focus({preventScroll:true}), 30);
  if (d.querySelector('h2')) d.querySelector('h2').tabIndex = -1;
}
function closeDrawer(){
  const id = ui.open; ui.open = null; $('#drawer').hidden = true; $('#scrim').hidden = true; setInert(false); renderCards();
  const back = id && document.querySelector(`[data-open="${CSS.escape(id)}"]`); if (back) back.focus();
}

/* ---------- results view ---------- */
const inPhase = u => !ui.resPhase || u.phase === ui.resPhase;
const groupOrder = (a, b) => (TABLES.indexOf(a) + 1 || 99) - (TABLES.indexOf(b) + 1 || 99) || a.localeCompare(b);
// facilitator, viewer and explore mode may open any group; a group sees itself
const canPick = () => !session || session.role !== 'table';
const hasData = k => !!state.t[k] && (Object.keys(state.t[k].r).length > 0 || Object.values(state.t[k].fd || {}).some(Boolean));
const shownTable = () => canPick() ? (ui.resTable || TABLES.find(hasData) || TABLES[0]) : myTable();
const rOf = (k, id) => (state.t[k] && state.t[k].r[id]) || {};
// disciplines entered by the groups: spelling variants ("marketing", "Marketing ") count as one
function disciplines(){
  const m = new Map();
  Object.keys(state.t).filter(k => k !== DEMO && discOf(k) && Object.keys(state.t[k].r).length).sort(groupOrder).forEach(k => { const key = discKey(discOf(k)); if (!m.has(key)) m.set(key, {key, label:discOf(k), groups:[]}); m.get(key).groups.push(k); });
  return [...m.values()].sort((a, b) => a.label.localeCompare(b.label));
}
const discLabel = key => (disciplines().find(d => d.key === key) || {label:key}).label;
const roomTabs = disc => Object.keys(state.t).filter(k => Object.keys(state.t[k].r).length && inDisc(k, disc));
function rated(){
  const mine = shownTable();
  if (ui.scope === 'table') {
    return allUcs().filter(inPhase).map(u => ({u, r:(state.t[mine] && state.t[mine].r[u.id]) || {}})).filter(e => e.r.n && e.r.u && !e.r.x)
      .map(e => ({u:e.u, n:e.r.n, m:e.r.u, f:!!e.r.f, k:1, chk:chkOf(e.r), t:!!e.r.tt})).sort((a, b) => b.n*b.m - a.n*a.m || b.n - a.n);
  }
  return allUcs().filter(inPhase).map(u => ({u, rm:room(u.id, ui.resDisc)})).filter(e => e.rm.k).sort((a, b) => byRoom(a.rm, b.rm))
    .map(({u, rm}) => ({u, n:rm.n, m:rm.u, f:rm.stars > 0, k:rm.k, chk:rm.chk.length > 0, t:rm.tests.length > 0}));
}
function renderMatrix(list){
  const W = 620, H = 460, L = 54, R = 14, T = 14, B = 52;
  const sx = v => L + (v - .5) / 5 * (W - L - R), sy = v => T + (5.5 - v) / 5 * (H - T - B), mx = sx(3), my = sy(3);
  let g = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Matrix of value against feasibility; the numbers match the list of top use cases">`;
  g += `<rect x="${mx}" y="${T}" width="${W-R-mx}" height="${my-T}" fill="#EEF7E7"/><rect x="${L}" y="${T}" width="${mx-L}" height="${my-T}" fill="#FDF2F2"/>`;
  g += `<rect x="${mx}" y="${my}" width="${W-R-mx}" height="${H-B-my}" fill="#F7F7F7"/><rect x="${L}" y="${my}" width="${mx-L}" height="${H-B-my}" fill="#FBFBFB"/>`;
  [[W-R-10, T+20, 'Quick wins', 'end', '#2F6410'], [L+10, T+20, 'Strategic bets', 'start', '#A30000'], [W-R-10, H-B-12, 'Easy add-ons', 'end', '#5F5F5F'], [L+10, H-B-12, 'Deprioritise', 'start', '#5F5F5F']]
    .forEach(q => g += `<text x="${q[0]}" y="${q[1]}" text-anchor="${q[3]}" font-size="13" font-weight="700" fill="${q[4]}">${q[2]}</text>`);
  for (let v = 1; v <= 5; v++) g += `<text x="${sx(v)}" y="${H-B+20}" text-anchor="middle" font-size="12" fill="#5F5F5F">${v}</text><text x="${L-12}" y="${sy(v)+4}" text-anchor="end" font-size="12" fill="#5F5F5F">${v}</text>`;
  g += `<line x1="${mx}" y1="${T}" x2="${mx}" y2="${H-B}" stroke="#CFCFCF" stroke-dasharray="4 4"/><line x1="${L}" y1="${my}" x2="${W-R}" y2="${my}" stroke="#CFCFCF" stroke-dasharray="4 4"/>`;
  g += `<line x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}" stroke="#454545"/><line x1="${L}" y1="${T}" x2="${L}" y2="${H-B}" stroke="#454545"/>`;
  g += `<text x="${(L+W-R)/2}" y="${H-10}" text-anchor="middle" font-size="13" font-weight="700" fill="#1F1F1F">Feasibility →</text><text transform="translate(16 ${(T+H-B)/2}) rotate(-90)" text-anchor="middle" font-size="13" font-weight="700" fill="#1F1F1F">Value →</text>`;
  // start at the exact position, then push overlapping points apart (deterministic, a few px per step)
  const P = list.map((e, i) => ({x:sx(e.m) + (i % 3 - 1) * .01, y:sy(e.n) + (i % 2 ? .01 : -.01)}));
  for (let it = 0; it < 60; it++) {
    let moved = false;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const dx = P[j].x - P[i].x, dy = P[j].y - P[i].y, dist = Math.hypot(dx, dy) || .01;
      if (dist < 24) { const push = (24 - dist) / 2, ux = dx / dist, uy = dy / dist; P[i].x -= ux * push; P[i].y -= uy * push; P[j].x += ux * push; P[j].y += uy * push; moved = true; }
    }
    P.forEach(p => { p.x = Math.min(W - R - 12, Math.max(L + 12, p.x)); p.y = Math.min(H - B - 12, Math.max(T + 12, p.y)); });
    if (!moved) break;
  }
  list.forEach((e, i) => {
    const {x, y} = P[i];
    g += `<g class="pt" style="cursor:pointer" data-open="${esc(e.u.id)}" tabindex="0" role="button" aria-label="${i+1}: ${esc(e.u.t)}"><title>${i+1} · ${esc(e.u.t)} – value ${e.n.toFixed(1)}, feasibility ${e.m.toFixed(1)}</title>${e.f ? `<circle cx="${x}" cy="${y}" r="15" fill="none" stroke="#1F1F1F" stroke-width="2.5"/>` : ''}<circle cx="${x}" cy="${y}" r="11" fill="#CC0000" stroke="#fff" stroke-width="2"/><text x="${x}" y="${y+4}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${i+1}</text></g>`;
  });
  if (!list.length) g += `<text x="${(L+W-R)/2}" y="${(T+H-B)/2}" text-anchor="middle" font-size="14" fill="#5F5F5F">No ratings yet – rate use cases in Step 1.</text>`;
  $('#matrix').innerHTML = `<div class="mx-scroll">${g}</svg></div>` + `<div class="legend"><span><i style="background:#fff;box-shadow:0 0 0 2px #1F1F1F"></i>Starred – the group wants to try it in Step 2</span></div>`;
}
function renderGroups(){
  const el = $('#groups');
  el.hidden = !(canPick() && ui.scope === 'room');
  if (el.hidden) return;
  const rows = Object.keys(state.t).filter(k => hasData(k) && inDisc(k, ui.resDisc)).sort(groupOrder).map(k => {
    const r = state.t[k].r, ids = Object.keys(r).filter(id => findUc(id) && inPhase(findUc(id)));
    const ok = ids.filter(id => r[id].n && r[id].u && !r[id].x).sort((a, b) => r[b].n*r[b].u - r[a].n*r[a].u);
    return {k, n:ok.length, top:ok.slice(0, 3).map(id => findUc(id).t), tests:ids.filter(id => r[id].tt).length, fd:Object.values(state.t[k].fd || {}).filter(Boolean).length};
  });
  el.innerHTML = `<h2>Groups</h2><p class="sub">${rows.length} ${rows.length === 1 ? 'group' : 'groups'} with results. Select a group to see its own matrix, ranking and tests.</p>` +
    (rows.length ? `<div class="gtable"><table><thead><tr><th>Group</th><th>Discipline</th><th>Rated</th><th>Top use cases</th><th>Copilot tests</th><th>Findings</th></tr></thead><tbody>${rows.map(x =>
      `<tr data-group="${esc(x.k)}"><th><button type="button" class="linkbtn" data-group="${esc(x.k)}">${esc(x.k)}</button></th><td>${esc(discOf(x.k)) || '–'}</td><td>${x.n}</td><td>${x.top.length ? x.top.map(esc).join(' · ') : '–'}</td><td>${x.tests}</td><td>${x.fd ? '✓' : '–'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">No group has saved results yet.</p>');
}
// "3 selected · 2 tested (1 worked well)" – the same count in the results panel and in the report
const testCount = tests => { const done = tests.filter(x => x.o), ok = done.filter(x => x.o === 'y').length; return `${tests.length} selected · ${done.length} tested (${ok} worked well)`; };
function renderResults(){
  const mine = shownTable();
  const ds = disciplines();
  if (ui.resDisc && !ds.some(d => d.key === ui.resDisc)) ui.resDisc = '';
  const room1 = ui.scope === 'room';
  const list = rated();
  const pick = $('#scopePick');
  pick.hidden = !(canPick() && ui.scope === 'table');
  if (canPick()) pick.innerHTML = [...new Set(TABLES.concat(Object.keys(state.t).filter(hasData)))].sort(groupOrder).map(k => `<option value="${esc(k)}"${k === mine ? ' selected' : ''}>${esc(groupLabel(k))}${hasData(k) ? '' : ' (no results yet)'}</option>`).join('');
  renderGroups();
  $('#resPhase').innerHTML = `<button type="button" data-rph="" aria-pressed="${!ui.resPhase}">All phases</button>` + PHASES.map(p => `<button type="button" data-rph="${p.id}" aria-pressed="${ui.resPhase === p.id}">${p.short}</button>`).join('');
  const rd = $('#resDisc');
  rd.hidden = !room1 || !ds.length;
  rd.innerHTML = rd.hidden ? '' : `<span class="tlab">Discipline</span><button type="button" data-rdisc="" aria-pressed="${!ui.resDisc}">All disciplines</button>` + ds.map(d => `<button type="button" data-rdisc="${esc(d.key)}" aria-pressed="${ui.resDisc === d.key}">${esc(d.label)} (${d.groups.length})</button>`).join('');
  $('#scopeTable').textContent = canPick() ? 'One group' : 'My group';
  document.querySelectorAll('[data-scope]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scope === ui.scope)));
  const tabs = roomTabs(ui.resDisc);
  $('#resSub').textContent = (ui.resPhase ? SHORT[ui.resPhase] : 'All phases') + ' · ' + (room1 ? `${ui.resDisc ? discLabel(ui.resDisc) + ' · ' : ''}averages over ${tabs.length} ${tabs.length === 1 ? 'group' : 'groups'} · ${list.length} rated use cases.` : `${groupLabel(mine)} · ${list.length} rated use cases.`);
  renderMatrix(list);
  $('#rankSub').textContent = room1 ? 'Ranked by value × feasibility; use cases rated by more groups count more. The numbers match the matrix.' : 'Ranked by value × feasibility. The numbers match the matrix.';
  $('#rank').innerHTML = list.length ? list.map((e, i) => `<li data-open="${esc(e.u.id)}" tabindex="0" role="button"${i >= 20 ? ' class="pmore"' : ''}><span class="n" style="background:#CC0000">${i+1}</span><span><b>${esc(e.u.t)}</b><small>${SHORT[e.u.phase]}${room1 ? ` · ${e.k} ${e.k === 1 ? 'group' : 'groups'}` : ''}${e.chk ? ' · check rules first' : ''}${e.t ? ' · tested with Copilot' : ''}</small></span><span class="sc">V ${e.n.toFixed(1)} · F ${e.m.toFixed(1)}</span></li>`).join('')
    : '<li class="empty" style="display:block;cursor:default">No use cases rated yet.</li>';
  if (list.length > 20) $('#rank').insertAdjacentHTML('beforeend', `<li class="pnote">Top 20 of ${list.length} – the full list is in the results export (.csv).</li>`);
  const scope = id => room1 ? room(id, ui.resDisc) : (r => ({x:r.x ? [mine] : [], chk:chkOf(r) ? [mine] : []}))(rOf(mine, id));
  const all = allUcs().filter(inPhase).map(u => ({u, s:scope(u.id)}));
  const notai = all.filter(e => e.s.x.length), chk = all.filter(e => e.s.chk.length);
  const tests = allUcs().filter(inPhase).flatMap(u => (room1 ? room(u.id, ui.resDisc).tests : (r => r.tt ? [{table:mine, o:r.o || '', note:r.note || ''}] : [])(rOf(mine, u.id))).map(x => ({u, ...x})));
  const li = (e, who) => `<li data-open="${esc(e.u.id)}" tabindex="0" role="button">${esc(e.u.t)} <small>· ${SHORT[e.u.phase]}${room1 && who.length ? ' · ' + who.map(k => esc(groupLabel(k))).join(', ') : ''}</small></li>`;
  $('#tests').innerHTML = `<h2>Tried with Copilot</h2><p class="sub">${testCount(tests)}${room1 ? ' across the room' : ''}.</p>` + (tests.length ? `<ul class="tests">${tests.map(x => `<li data-open="${esc(x.u.id)}" tabindex="0" role="button"><span class="pill v" style="--vc:${x.o ? OUTCOME[x.o][1] : '#BDBDBD'}">${x.o ? OUTCOME[x.o][0] : 'Not yet tested'}</span> <b>${esc(x.u.t)}</b> <small>· ${esc(groupLabel(x.table))}</small>${x.note ? `<p>${esc(x.note)}</p>` : ''}</li>`).join('')}</ul>` : '<p class="empty">No use cases selected for a test yet (Step 2).</p>');
  $('#lists').innerHTML = `<div class="panel"><h2>Not an AI task</h2><p class="sub">Where AI is the wrong instrument.</p>${notai.length ? `<ul>${notai.map(e => li(e, e.s.x)).join('')}</ul>` : '<p class="empty">None flagged yet.</p>'}</div>
    <div class="panel"><h2>Check rules before use</h2><p class="sub">Ethics, data or policy rules to clarify first.</p>${chk.length ? `<ul>${chk.map(e => li(e, e.s.chk)).join('')}</ul>` : '<p class="empty">None flagged yet.</p>'}</div>`;
  if (!$('#fdForm').contains(document.activeElement)) renderFindingsForm();
  renderFindingsAll(); renderReport();
}
function fdList(f){ return `<ul>${['f1','f2','f3'].filter(x => f[x]).map(x => `<li>${esc(f[x])}</li>`).join('')}</ul>${f.q ? `<p><b>Open question:</b> ${esc(f.q)}</p>` : ''}`; }
function renderFindingsForm(){
  const el = $('#fdForm'), other = ui.scope === 'table' && canPick() && shownTable() !== myTable();
  if (other || !canRate()) {
    const k = other ? shownTable() : null, f = k && state.t[k] ? state.t[k].fd : null;
    el.innerHTML = k ? `<h2>Findings · ${esc(groupLabel(k))}</h2>${f && Object.values(f).some(Boolean) ? fdList(f) : '<p class="empty">This group has not entered findings yet.</p>'}`
      : '<h2>Findings</h2><p class="empty">View only – each group enters its findings with its own code.</p>';
    return;
  }
  const fd = tbl(myTable()).fd;
  el.innerHTML = `<h2>Findings · ${esc(groupLabel(myTable()))}</h2><p class="sub">Three findings and one open question from your group.</p>
    <div class="fd-form">${['f1','f2','f3'].map((k, i) => `<div class="field"><label for="fd-${k}">Finding ${i+1}</label><textarea id="fd-${k}" data-fd="${k}" maxlength="280">${esc(fd[k])}</textarea></div>`).join('')}
    <div class="field"><label for="fd-q">Open question</label><textarea id="fd-q" data-fd="q" maxlength="280">${esc(fd.q)}</textarea></div></div>`;
}
function fdTables(){ return Object.keys(state.t).sort(groupOrder).filter(k => Object.values(state.t[k].fd || {}).some(Boolean)); }
function renderFindingsAll(){
  const rows = fdTables().filter(k => ui.scope !== 'room' || inDisc(k, ui.resDisc));
  $('#fdAll').innerHTML = `<h2>Findings from the room</h2><p class="sub">${rows.length} ${rows.length === 1 ? 'group' : 'groups'} with findings${ui.scope === 'room' && ui.resDisc ? ' · ' + esc(discLabel(ui.resDisc)) : ''}.</p>` +
    (rows.length ? rows.map(k => `<div class="fdt"><h3>${esc(groupLabel(k))}</h3>${fdList(state.t[k].fd)}</div>`).join('') : '<p class="empty">No findings yet.</p>');
}

/* ---------- report ---------- */
const METHOD = 'Step 1 research value (value 1–5 · kind of gain · feasibility 1–5), rated by each group from the point of view of its discipline; Step 2 each group tried up to three of its use cases live with Copilot. Room values are means over the groups that rated a use case; “not an AI task” ratings are excluded from the means. The ranking shrinks each mean towards the scale midpoint by two virtual groups, so use cases rated by more groups count more.';
function reportData(){
  const ucs = allUcs().map(u => ({u, rm:room(u.id)}));
  const ranked = ucs.filter(e => e.rm.k).sort((a, b) => byRoom(a.rm, b.rm));
  const byDisc = disciplines().map(d => ({d, top:allUcs().map(u => ({u, rm:room(u.id, d.key)})).filter(e => e.rm.k).sort((a, b) => byRoom(a.rm, b.rm)).slice(0, 3)})).filter(x => x.top.length);
  return {ranked, byDisc, tabs:Object.keys(state.t).filter(k => k !== DEMO).filter(k => Object.keys(state.t[k].r).length || Object.values(state.t[k].fd || {}).some(Boolean)),
    notai:ucs.filter(e => e.rm.x.length), chk:ranked.filter(e => e.rm.chk.length),
    tests:ucs.flatMap(e => e.rm.tests.map(x => ({u:e.u, ...x}))),
    gains:GAINS.map(([g, l]) => ({l, n:ucs.reduce((s, e) => s + e.rm.gain[g], 0), top:ranked.filter(e => e.rm.gain[g]).sort((a, b) => b.rm.gain[g] - a.rm.gain[g] || byRoom(a.rm, b.rm)).slice(0, 3)})),
    fds:fdTables().map(k => [k, state.t[k].fd])};
}
function renderReport(){
  const d = reportData(), el = $('#reportBody');
  if (!d.ranked.length && !d.fds.length && !d.tests.length) { el.innerHTML = '<p class="empty">The report fills automatically once groups have rated use cases or entered findings.</p>'; return; }
  const top = d.ranked.slice(0, 10), done = d.tests.filter(x => x.o), ok = done.filter(x => x.o === 'y').length;
  el.innerHTML = `<p class="sub">Always the whole room, whatever is selected above.</p><div class="rk"><div><b>${d.tabs.length}</b><span>groups contributed</span></div><div><b>${d.ranked.length}</b><span>use cases rated</span></div><div><b>${done.length}</b><span>Copilot tests (${d.tests.length} selected · ${ok} worked well)</span></div><div><b>${d.notai.length}</b><span>not an AI task</span></div></div>
    <div class="rgrid"><div><h3>Top use cases from the room</h3><ol class="rlist">${top.map(e => `<li><b>${esc(e.u.t)}</b> <small>· ${SHORT[e.u.phase]} · value ${e.rm.n.toFixed(1)} · feasibility ${e.rm.u.toFixed(1)} · ${e.rm.k} ${e.rm.k === 1 ? 'group' : 'groups'}</small></li>`).join('')}</ol></div>
      <div><h3>Top use case per cluster</h3><ul class="rlist">${CLUSTERS.map(c => { const e = d.ranked.find(x => c.ph.includes(x.u.phase)); return `<li><b>${c.n}:</b> ${e ? esc(e.u.t) : '<small>not rated</small>'}</li>`; }).join('')}</ul>
      ${d.chk.length ? `<h3>Check rules before use</h3><ul class="rlist">${d.chk.map(e => `<li>${esc(e.u.t)}</li>`).join('')}</ul>` : ''}</div></div>
    ${d.byDisc.length ? `<h3>Top use cases per discipline</h3><div class="gains">${d.byDisc.map(x => `<div><b>${esc(x.d.label)}</b><span>${x.d.groups.length} ${x.d.groups.length === 1 ? 'group' : 'groups'}</span><ol>${x.top.map(e => `<li>${esc(e.u.t)}</li>`).join('')}</ol></div>`).join('')}</div>` : ''}
    ${d.tests.length ? `<h3>Tried with Copilot</h3><ul class="rlist">${d.tests.map(x => `<li><b>${esc(x.u.t)}</b> <small>· ${esc(groupLabel(x.table))} · ${x.o ? OUTCOME[x.o][0] : 'not yet tested'}</small>${x.note ? ` – ${esc(x.note)}` : ''}</li>`).join('')}</ul>` : ''}
    ${d.gains.some(x => x.n) ? `<h3>Where the room sees the gain</h3><div class="gains">${d.gains.map(x => `<div><b>${x.n}</b><span>${x.l}</span>${x.top.length ? `<ul>${x.top.map(e => `<li>${esc(e.u.t)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div>` : ''}
    <p class="rnote">Method: ${METHOD}</p>`;
}
function reportMarkdown(){
  const d = reportData(), top = d.ranked.slice(0, 10);
  const L = ['# Results report – Generative AI in Your Research', `Workshop, 4 November 2026 · generated ${new Date().toISOString().slice(0, 10)} · ${VERSION}`, '',
    `- Groups contributed: ${d.tabs.length}`, `- Use cases rated: ${d.ranked.length}`, `- Copilot tests: ${testCount(d.tests)}`, `- Flagged “not an AI task”: ${d.notai.length}`, `- Groups with findings: ${d.fds.length}`, '',
    '## Top use cases from the room', ...top.map((e, i) => `${i+1}. **${e.u.t}** (${SHORT[e.u.phase]}) – value ${e.rm.n.toFixed(1)}, feasibility ${e.rm.u.toFixed(1)}, ${e.rm.k} ${e.rm.k === 1 ? 'group' : 'groups'}`), '',
    '## Top use case per cluster', ...CLUSTERS.map(c => { const e = d.ranked.find(x => c.ph.includes(x.u.phase)); return `- ${c.n}: ${e ? e.u.t : 'not rated'}`; }), ''];
  if (d.byDisc.length) L.push('## Top use cases per discipline', ...d.byDisc.map(x => `- ${x.d.label} (${x.d.groups.length} ${x.d.groups.length === 1 ? 'group' : 'groups'}): ${x.top.map(e => e.u.t).join('; ')}`), '');
  if (d.tests.length) L.push('## Tried with Copilot', ...d.tests.map(x => `- ${x.u.t} (${groupLabel(x.table)}): ${x.o ? OUTCOME[x.o][0] : 'not yet tested'}${x.note ? ' – ' + x.note : ''}`), '');
  if (d.gains.some(x => x.n)) L.push('## Where the room sees the gain', ...d.gains.map(x => `- ${x.l}: ${x.n}${x.top.length ? ' – e.g. ' + x.top.map(e => e.u.t).join('; ') : ''}`), '');
  if (d.notai.length) L.push('## Not an AI task', ...d.notai.map(e => `- ${e.u.t} (${SHORT[e.u.phase]})`), '');
  if (d.chk.length) L.push('## Check rules before use', ...d.chk.map(e => `- ${e.u.t} (${SHORT[e.u.phase]})`), '');
  if (d.fds.length) { L.push('## Findings and open questions'); d.fds.forEach(([k, f]) => { L.push(`### ${groupLabel(k)}`, ...['f1','f2','f3'].filter(x => f[x]).map(x => `- ${f[x]}`)); if (f.q) L.push(`- Open question: ${f.q}`); L.push(''); }); }
  L.push('## Method', METHOD, '', 'Prof. Dr. Manuel Kern · Delivered by Hitachi Solutions');
  return L.join('\n');
}
/* ---------- tools view ---------- */
const packLabel = id => { if (id === 'papers') return `All ${PACK.papers.length} papers`; const x = (PACK.extras || []).find(e => e.id === id); if (x) return x.title; const p = PACK.papers.find(x => x.id === id); if (p) return `${p.cite.split(',')[0]} ${(p.cite.match(/\((\d{4})\)/) || [])[1] || ''}`.trim(); const d = PACK.data.find(x => x.id === id); return d ? d.title : id; };
const toolUrl = n => { const t = TOOLS.find(x => x.n === n); return t && t.url ? 'https://' + t.url.replace(/^https?:\/\//, '') : null; };
function connectHtml(names){
  return names.map(n => {
    const m = MCP[n], c = (M365[n] || []).find(x => x[0] === 'copilot');
    return `<li><b>${esc(n)}</b>${c ? `<a class="msb cp" href="${c[1]}" target="_blank" rel="noopener">Copilot connector</a>` : ''}${m ? `<a class="mcpb ${m[0]}" href="${m[2]}" target="_blank" rel="noopener" title="${m[0] === 'o' ? 'Official MCP server' : 'Community MCP server'} – open the documentation">MCP · ${m[0] === 'o' ? 'official' : 'community'}</a>${m[1] ? '' : '<span class="mcpr loc" title="Runs on your own computer – not reachable from Copilot Studio">runs locally</span>'}` : ''}</li>`;
  }).join('');
}
function backgroundHtml(u){
  const x = (typeof DETAILS !== 'undefined' && DETAILS[u.id]) || null, t = x ? x.tech : {routes:[], data:[], tools:[], connect:[], repos:[]};
  const con = (u.ix || []).concat((t.connect || []).filter(n => !(u.ix || []).includes(n)));
  if (!x && !con.length) return '';
  const row = (label, html) => html ? `<div class="ux-row"><span class="ux-l">${label}</span><div>${html}</div></div>` : '';
  const tech = `<div class="ux-tech"><h4>How it works technically</h4>
    ${t.routes.length ? `<div class="ux-routes">${t.routes.map((r, i) => `<span class="route${i ? '' : ' main'}" title="${esc(ROUTES[r][1])}">${esc(ROUTES[r][0])}</span>`).join('')}</div>` : ''}
    ${t.text ? `<p>${esc(t.text)}</p>` : ''}
    ${row('Copilot levels', (() => { const L = levelsOf(u); return LEVELS.map(([n, d], i) => { const on = i === 0 || i === 2 || (i === 1 && L.two) || (i === 3 && L.studio.length); return `<span class="lvl${on ? ' on' : ''}" title="${esc(d)}">${i + 1} ${esc(n)}</span>`; }).join('') + '<small class="lvl-note">Highlighted: the levels of working with Copilot that fit this use case – explained in Step 2.</small>'; })())}
    ${row('Practice data', t.data.map(id => `<button type="button" class="pk" data-pack="${id}" title="${esc(packLabel(id))}">${id === 'papers' ? '' : `<b>${id}</b> `}${esc(packLabel(id))}</button>`).join(''))}
    ${row('Other supportive academic tools', t.tools.map(n => toolUrl(n) ? `<a class="tk" href="${toolUrl(n)}" target="_blank" rel="noopener">${esc(n)}</a>` : `<span class="tk">${esc(n)}</span>`).join(''))}
    ${row('Connect to Copilot', con.length ? `<ul class="ux-con">${connectHtml(con)}</ul><button type="button" class="linkbtn" data-view="tools" data-mcpinfo>How to connect a tool to Copilot →</button>` : '')}
    ${row('Open source', t.repos.filter(k => REPOS[k]).map(k => `<a class="tk repo" href="${REPOS[k][1]}" target="_blank" rel="noopener" title="${esc(REPOS[k][0] + ' – ' + REPOS[k][2])}">${esc(REPOS[k][0])}</a>`).join(''))}
  </div>`;
  if (!x) return `<details class="bg"><summary>Technology</summary><div class="ux">${tech}</div></details>`;
  return `<details class="bg"><summary>Background, methods and technology</summary><div class="ux">
    <div><h4>How you go about it</h4><ol class="ux-steps">${x.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>
    ${x.method ? `<div class="ux-method"><h4>Methods and concepts</h4><dl>${x.method.concepts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      ${x.method.refs.length ? `<p class="ux-refs-h">Key references</p><ul class="ux-refs">${x.method.refs.map(r => `<li>${esc(r.cite)}${r.doi ? ` <a href="https://doi.org/${esc(r.doi)}" target="_blank" rel="noopener">doi.org/${esc(r.doi)}</a>` : ''}</li>`).join('')}</ul>` : ''}</div>` : ''}
    ${tech}</div></details>`;
}
function mcpHtml(t){
  const m = MCP[t.n], ms = M365[t.n];
  const m365 = ms ? `<span class="mcp m365"><span class="mlab">Microsoft 365</span>${ms.map(([k, url]) => `<a class="msb${k === 'copilot' ? ' cp' : ''}" href="${url}" target="_blank" rel="noopener">${M365_TYPE[k]}</a>`).join('')}</span>` : '';
  if (!m) return m365;
  return m365 + `<span class="mcp"><a class="mcpb ${m[0]}" href="${m[2]}" target="_blank" rel="noopener" title="${m[0] === 'o' ? 'Official MCP server' : 'Community MCP server'} – open the documentation">MCP · ${m[0] === 'o' ? 'official' : 'community'}</a>${m[1] ? '<span class="mcpr">Copilot Studio</span>' : '<span class="mcpr loc">local</span>'} ${esc(m[3])}</span>`;
}
function renderTools(){
  const counts = PHASES.map(p => TOOLS.filter(t => t.ph.includes(p.id)).length);
  $('#toolFilter').innerHTML = `<button type="button" data-tph="" aria-pressed="${!ui.toolPhase && !ui.toolMcp}">All (${TOOLS.length})</button>` +
    PHASES.map((p, i) => `<button type="button" data-tph="${p.id}" aria-pressed="${ui.toolPhase === p.id}">${p.short} (${counts[i]})</button>`).join('') +
    `<button type="button" class="mcpf" data-tmcp="mcp" aria-pressed="${ui.toolMcp === 'mcp'}">MCP server (${TOOLS.filter(t => MCP[t.n]).length})</button>` +
    `<button type="button" class="mcpf" data-tmcp="m365" aria-pressed="${ui.toolMcp === 'm365'}">Microsoft 365 integration (${TOOLS.filter(t => M365[t.n]).length})</button>`;
  $('#toolGrid').innerHTML = TCATS.map((c, ci) => {
    const ts = TOOLS.filter(t => t.cat === ci && (!ui.toolPhase || t.ph.includes(ui.toolPhase)) && (!ui.toolMcp || (ui.toolMcp === 'mcp' ? MCP : M365)[t.n])).sort(byScore);
    if (!ts.length) return '';
    return `<div class="panel tcat"><h2>${c}<span>${ts.length}</span></h2>${ts.map(t => `<div class="tool"><span>${t.url ? `<a href="https://${t.url}" target="_blank" rel="noopener">${esc(t.n)}</a>` : `<span class="nm">${esc(t.n)}</span>`}<span class="typ">${TYP[t.typ]}</span></span>${t.r ? `<span class="stars${t.c < 3 ? ' low' : ''}" title="${t.c < 3 ? 'Fewer than 3 ratings – indicative only' : 'Mean rating'}"><span class="bar"><i style="width:${t.r/5*100}%"></i></span>${t.r.toFixed(1)} <small>(${t.c})</small></span>` : '<span class="stars nr">not rated</span>'}<span class="nt">${esc(t.nt)}</span>${mcpHtml(t)}</div>`).join('')}</div>`;
  }).join('');
}

/* ---------- facilitator menu ---------- */
function openMenu(){
  const fac = session && session.role === 'facilitator';
  $('#modal').innerHTML = `<div class="box" role="dialog" aria-modal="true" aria-labelledby="menuTitle">
    <div class="ptools"><h2 id="menuTitle">Facilitator</h2><button class="icon-btn" type="button" data-mclose aria-label="Close">✕</button></div>
    <section><h3>Export</h3><div class="row"><button class="btn btn-quiet btn-sm" type="button" id="mCsv">Download results (.csv)</button><button class="btn btn-quiet btn-sm" type="button" id="mJson">Download all data (.json)</button><button class="btn btn-quiet btn-sm" type="button" id="mTsv">Copy results for Excel</button></div></section>
    <section><h3 id="svHead">Import survey use cases</h3><p class="sub">Paste rows copied from the survey spreadsheet (tab-separated) or a CSV file: column 1 = stage of the research journey, column 2 = use case text, optional column 3 = short title. Rows with an e-mail address, a link, a phone number or a titled name (Dr, Prof …) are skipped; other names are not detected, so check the rows first. Example rows and rows already imported are skipped too.</p>
      <textarea id="svText" aria-labelledby="svHead" placeholder="Data analysis&#9;Help me check my R code for a mixed model"></textarea><p class="sub" id="svInfo"></p><div class="row"><button class="btn btn-primary btn-sm" type="button" id="svGo">Import</button></div></section>
    ${session ? '' : `<section><h3>Offline fallback</h3><p class="sub">Only if sign-in is not possible (no network): give each laptop its own group name, so their data can be merged later.</p>
      <div class="row"><label class="sr" for="tableSel">Rate as</label><select id="tableSel" class="selectbox"><option value=""${state.off ? '' : ' selected'}>Explore mode (no group)</option>${TABLES.filter(t => t !== 'Facilitator').map(t => `<option${state.off && t === state.a ? ' selected' : ''}>${t}</option>`).join('')}</select></div></section>
    <section><h3 id="mgHead">Merge data from other laptops</h3><p class="sub">Paste the “group data” each offline laptop copied, or choose the exported files.</p>
      <textarea id="mgText" aria-labelledby="mgHead"></textarea><div class="row"><button class="btn btn-primary btn-sm" type="button" id="mgGo">Merge</button><button class="btn btn-quiet btn-sm" type="button" id="mgCopy">Copy this group’s data</button><label class="btn btn-quiet btn-sm">Choose files<input type="file" id="mgFile" accept="application/json" multiple hidden></label></div></section>`}
    <section><h3>Reset</h3><p class="sub">${fac ? 'Deletes all ratings, findings and additions of this workshop for everyone.' : 'Deletes everything stored in this browser.'}</p><div class="row"><button class="btn btn-quiet btn-sm" type="button" id="mReset">${fac ? 'Reset workshop' : 'Reset this browser'}</button></div></section>
  </div>`;
  $('#modal').hidden = false; setInert(true); $('#modal').querySelector('[data-mclose]').focus();
}
function closeMenu(){ $('#modal').hidden = true; setInert(!$('#drawer').hidden); const b = $('#menuBtn'); if (b) b.focus(); }
// while a dialog is open, the page behind it is inert (no tabbing or clicking past the scrim)
function setInert(on){ ['header.top', 'main', 'footer'].forEach(q => { const el = document.querySelector(q); if (el) el.inert = on; }); }

/* ---------- login ---------- */
function showLogin(msg){
  $('#login').innerHTML = `<div class="box" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
    <h2 id="loginTitle">Sign in with your group code</h2>
    <p>Your facilitator gives you the code, e.g. “group 3”. Ratings are saved for your group and appear in the results for the whole room.</p>
    <p class="sub"><b>One laptop per group signs in.</b> Everyone else in the group explores without a code – two laptops with the same group code overwrite each other.</p>
    <form id="loginForm" autocomplete="off"><label class="sr" for="codeIn">Group code</label><input id="codeIn" placeholder="group 3" required>
    <p class="err" id="loginErr">${msg ? esc(msg) : ''}</p>
    <div class="acts"><button class="btn btn-primary" type="submit">Sign in</button><button class="link" type="button" id="explore">Explore without a code (this browser only)</button></div></form></div>`;
  $('#login').hidden = false; setInert(true); setTimeout(() => $('#codeIn').focus(), 30);
}
function closeLogin(){ $('#login').hidden = true; setInert(!$('#drawer').hidden); }

/* ---------- render ---------- */
/* ---------- practice data ---------- */
const PACK_URL = 'https://github.com/MKern311/ai-research-companion/releases/download/practice-data-' + PACK.snapshot + '/';
const mb = n => n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' kB';
const fileUrl = f => 'materials/' + f.split('/').map(encodeURIComponent).join('/');
const linkify = t => esc(t).replace(/https:\/\/[^\s<)]+[^\s<).,;]/g, m => `<a href="${m}" target="_blank" rel="noopener">${m}</a>`);
// banner in the data and tools views that leads back to the use case the participant came from
const backHtml = () => { const u = ui.back && findUc(ui.back); return u ? `<div class="backbar"><button type="button" class="btn btn-quiet btn-sm" data-back>← Back to: ${esc(u.t)}</button></div>` : ''; };
const licChip = l => `<span class="lic${/NC/.test(l) ? ' nc' : ''}">${esc(l)}</span>`;
function renderData(){
  const date = new Date(PACK.snapshot + 'T12:00:00Z').toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});
  $('#dlMain').innerHTML = `<h2>Download</h2><p class="sub">${PACK.papers.length} papers and ${PACK.data.reduce((n, d) => n + d.files.length, 0)} data files on ${esc(PACK.topic.toLowerCase())} · snapshot of ${date} · with a README listing licences and how to cite.</p>
    <div class="dl-btns"><a class="btn btn-primary" href="${PACK_URL}ai-research-practice-pack.zip" download>Download papers and data (.zip, ${mb(PACK.zips.all)})</a>
    <a class="btn btn-quiet" href="${PACK_URL}ai-research-practice-data.zip" download>Data only (.zip, ${mb(PACK.zips.data)})</a>
    <a class="btn btn-quiet" href="https://github.com/MKern311/ai-research-companion/blob/main/materials/README.md" target="_blank" rel="noopener">README</a></div>
    <p class="sub">If the download is slow on the workshop Wi-Fi, take the data-only pack and download single papers below as you need them.</p>`;
  $('#dlPairs').innerHTML = `<h2>Ideas for your test</h2><p class="sub">Each idea combines papers and data files from the pack, so you can check Copilot’s summary or analysis against the source. The last column opens the matching use case with a step-by-step guide.</p>
    <div class="gtable"><table><thead><tr><th>Paper</th><th>Data</th><th>Test idea</th><th>Use case</th></tr></thead><tbody>${PACK.pairs.map(([a, b, c, id]) => { const u = id && findUc(id); return `<tr><td>${esc(a)}</td><td>${esc(b)}</td><td>${esc(c)}</td><td>${u ? `<button type="button" class="linkbtn" data-open="${esc(u.id)}">${esc(u.t)}</button>` : '–'}</td></tr>`; }).join('')}</tbody></table></div>`;
  let grp = '';
  $('#dlPapers').innerHTML = `<h2>Papers</h2><p class="sub">Open access. A1 is the accepted manuscript, C6 a preprint.</p>` + (PACK.extras || []).map(x => `<div class="dl-item" id="pk-${x.id}"><span class="dl-id">${x.id}</span><div><p class="dl-cite"><b>${esc(x.title)}</b></p><p class="dl-about">${esc(x.about)}</p>
      <p class="dl-meta">${licChip(x.licence)}<a href="${fileUrl(x.file)}" download>${esc(x.file.split('/').pop())} · ${mb(x.size)}</a><button type="button" class="linkbtn" data-copyrefs>Copy all ${PACK.papers.length} references</button></p></div></div>`).join('') + PACK.papers.map(p => {
    const h = p.group !== grp ? `<h3 class="dl-grp">${esc(grp = p.group)}</h3>` : '';
    return h + `<div class="dl-item" id="pk-${p.id}"><span class="dl-id">${p.id}</span><div><p class="dl-cite">${esc(p.cite)}</p><p class="dl-about">${esc(p.about)}${p.version ? ` <i>${esc(p.version)}.</i>` : ''}</p>
      <p class="dl-meta">${licChip(p.licence)}<a href="${fileUrl(p.file)}" target="_blank" rel="noopener">PDF · ${mb(p.size)}</a><a href="https://doi.org/${p.doi}" target="_blank" rel="noopener">doi.org/${esc(p.doi)}</a>${p.data.length ? `<span>Data: ${p.data.join(' · ')}</span>` : ''}</p></div></div>`;
  }).join('');
  $('#dlData').innerHTML = `<h2>Raw data</h2><p class="sub">Original provider files, unchanged. Format quirks are part of the exercise.</p>` + PACK.data.map(d => `<div class="dl-item" id="pk-${d.id}"><span class="dl-id">${d.id}</span><div>
      <p class="dl-cite"><b>${esc(d.title)}</b> · ${esc(d.provider)}</p><p class="dl-about">${esc(d.span)} · ${esc(d.format)}. ${esc(d.notes)}</p>
      <p class="dl-meta">${licChip(d.licence)}${d.files.map(x => `<a href="${fileUrl(x.f)}" download>${esc(x.f.split('/').pop())} · ${mb(x.size)}</a>`).join('')}<a href="${d.source}" target="_blank" rel="noopener">Source</a></p>
      <p class="dl-about"><small>Cite: ${esc(d.cite)}</small></p></div></div>`).join('') +
    `<h3 class="dl-grp">Not included</h3><ul class="dl-excl">${PACK.excluded.map(([a, b]) => `<li><b>${esc(a)}</b> – ${linkify(b)}</li>`).join('')}</ul>`;
}

/* ---------- agenda ---------- */
function londonNow(){
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/London', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false}).formatToParts(new Date()).map(x => [x.type, x.value]));
  return {day:`${p.year}-${p.month}-${p.day}`, min:(+p.hour % 24) * 60 + +p.minute};
}
function renderAgenda(){
  const now = londonNow(), mins = t => +t.slice(0, 2) * 60 + +t.slice(3);
  $('#agenda').innerHTML = AGENDA.map(([a, b, title, who], i) => {
    const live = now.day === AGENDA_DAY && now.min >= mins(a) && now.min < mins(b);
    return `<li class="${who ? '' : 'brk'}${live ? ' live' : ''}"><span class="t">${a}–${b}</span><span><b>${esc(title)}</b>${who ? `<small>${esc(who)}</small>` : ''}${i === TOOL_SLOT ? '<small class="here">This tool · Steps 1 and 2 below</small>' : ''}${i === SURVEY_SLOT ? '<small><button type="button" class="linkbtn" data-view="survey">Survey results: you told us</button></small>' : ''}${SLIDES.start[i] ? `<small><button type="button" class="linkbtn" data-slides="${SLIDES.start[i]}">View slides</button></small>` : ''}</span>${live ? '<span class="now">Now</span>' : ''}</li>`;
  }).join('');
  $('#team').innerHTML = TEAM.map(m => `<div class="member">${m.photo ? `<img src="${esc(m.photo)}" alt="" width="64" height="64">` : `<span class="avatar" aria-hidden="true">${esc(m.n[0])}</span>`}<b>${esc(m.n)}</b></div>`).join('');
  $('#slidesPanel').innerHTML = `<div class="sl-head"><button type="button" class="sl-thumb" data-slides="1" aria-label="Open the slides"><img src="${slideSrc(1)}" alt="" width="320" height="180" loading="lazy"></button>
    <div><h2>Slides · ${esc(SLIDES.title)}</h2><p class="sub">${SLIDES.n} slides from ${esc(SLIDES.who)}’s sessions. Move through them with the arrow keys or by swiping.</p>
    <div class="row"><button type="button" class="btn btn-primary btn-sm" data-slides="1">View slides</button><a class="btn btn-quiet btn-sm" href="${SLIDES.pdf}" download>PDF · ${mb(SLIDES.pdfSize)}</a></div></div></div>
    <h3>Prompts from the session</h3>` + SLIDES.prompts.map(([t, p], i) => `<div class="prompt"><div class="ptools"><b>${esc(t)}</b><span class="row"><button type="button" class="btn btn-quiet btn-sm" data-slcopy="${i}">Copy prompt</button><a class="btn btn-primary btn-sm" href="${COPILOT_URL}" target="_blank" rel="noopener" data-slcopy="${i}" title="Copies the prompt and opens Copilot in a new tab">Open Copilot ↗</a></span></div><pre>${esc(p)}</pre></div>`).join('');
}

/* ---------- slides viewer ---------- */
const slideSrc = i => SLIDES.dir + 's' + String(i).padStart(2, '0') + '.webp';
let slideAt = 1, slideFrom = null, touchX = null;
function showSlide(i){
  slideAt = Math.min(SLIDES.n, Math.max(1, i));
  const img = $('#vwImg'); img.src = slideSrc(slideAt); img.alt = `Slide ${slideAt} of ${SLIDES.n}`;
  $('#vwNo').textContent = `${slideAt} / ${SLIDES.n}`;
  $('#vwPrev').disabled = slideAt === 1; $('#vwNext').disabled = slideAt === SLIDES.n;
  [slideAt - 1, slideAt + 1].forEach(k => { if (k >= 1 && k <= SLIDES.n) new Image().src = slideSrc(k); });
}
function openSlides(i){
  slideFrom = document.activeElement; $('#vwTitle').textContent = SLIDES.title; $('#vwPdf').href = SLIDES.pdf;
  $('#vwFull').hidden = !document.fullscreenEnabled;
  $('#viewer').hidden = false; document.body.style.overflow = 'hidden'; showSlide(i); $('#vwClose').focus();
}
function closeSlides(){
  if (document.fullscreenElement) document.exitFullscreen();
  $('#viewer').hidden = true; document.body.style.overflow = ''; if (slideFrom) slideFrom.focus();
}
const toggleFull = () => document.fullscreenElement ? document.exitFullscreen() : $('#viewer').requestFullscreen().catch(() => {});
$('#vwPrev').onclick = () => showSlide(slideAt - 1);
$('#vwNext').onclick = () => showSlide(slideAt + 1);
$('#vwClose').onclick = closeSlides;
$('#vwFull').onclick = toggleFull;
$('#vwImg').onclick = e => { const r = e.target.getBoundingClientRect(); showSlide(slideAt + (e.clientX - r.left < r.width / 3 ? -1 : 1)); };
$('#viewer').addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, {passive:true});
$('#viewer').addEventListener('touchend', e => { if (touchX === null) return; const dx = e.changedTouches[0].clientX - touchX; touchX = null; if (Math.abs(dx) > 40) showSlide(slideAt + (dx < 0 ? 1 : -1)); });

function setView(v, back){
  ui.view = v; ui.back = back || null;
  ['agenda','survey','cases','data','results','tools'].forEach(k => { $('#view-' + k).hidden = k !== v; $('#tab-' + k).setAttribute('aria-selected', String(k === v)); });
  if (v === 'results') renderResults(); if (v === 'tools') renderTools(); if (v === 'agenda') renderAgenda(); if (v === 'data') renderData();
  $('#dataBack').innerHTML = v === 'data' ? backHtml() : ''; $('#toolsBack').innerHTML = v === 'tools' ? backHtml() : '';
  window.scrollTo({top:0});
}
// marked target in the data or tools view stays highlighted until the next click
function mark(el){ document.querySelectorAll('.marked').forEach(x => x.classList.remove('marked')); if (el) el.classList.add('marked'); }
function softRender(){
  renderIdent(); renderDisc(); renderPhases(); renderCards();
  if (ui.view === 'results') renderResults();
  if (ui.open && ui.open !== '__new' && !$('#drawer').hidden && !$('#drawer').contains(document.activeElement)) openDrawer(ui.open);
}
function renderAll(){ renderAgenda(); renderIdent(); renderDisc(); renderLens(); renderPhases(); renderIntro(); renderCards(); if (ui.view === 'results') renderResults(); if (ui.view === 'tools') renderTools(); }

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  if (!t.closest('[data-pack]')) mark(null);
  const from = () => { const d = $('#drawer'), id = !d.hidden && ui.open && ui.open !== '__new' ? ui.open : null;
    if (id) { const sc = d.querySelector('.scroll'), g = d.querySelector('details.guide'), bg = d.querySelector('details.bg'); ui.backState = {top:sc ? sc.scrollTop : 0, g:g ? g.open : null, bg:bg ? bg.open : null, gmode:ui.gmode}; }
    if (!d.hidden) closeDrawer(); return id; };
  const pk = t.closest('[data-pack]'); if (pk) { setView('data', from()); const papers = pk.dataset.pack === 'papers', el = papers ? $('#dlPapers') : document.getElementById('pk-' + pk.dataset.pack); if (el) { el.scrollIntoView({block:papers ? 'start' : 'center'}); mark(el); } return; }
  if (t.closest('[data-back]')) { const id = ui.back, bs = ui.backState; setView('cases'); const u = findUc(id); if (u) { ui.phase = PHASES.findIndex(p => p.id === u.phase); renderPhases(); renderIntro(); openDrawer(id);
    if (bs) { ui.gmode = bs.gmode; drawerHtml = ''; openDrawer(id); const d = $('#drawer'), g = d.querySelector('details.guide'), bg = d.querySelector('details.bg'); if (g && bs.g !== null) g.open = bs.g; if (bg && bs.bg !== null) bg.open = bs.bg; const sc = d.querySelector('.scroll'); if (sc) sc.scrollTop = bs.top; } } return; }
  const tab = t.closest('[data-view]'); if (tab) { const id = tab.closest('#drawer') ? from() : (from(), null); setView(tab.dataset.view, id); if (tab.hasAttribute('data-mcpinfo')) { const b = $('#mcpBox'); b.open = true; b.scrollIntoView(); } return; }
  const ln = t.closest('[data-lens]'); if (ln) { const inD = !!ln.closest('#drawer'); ui.lens = +ln.dataset.lens; saveUi(); renderLens(); renderCards();
    if (ui.open && !$('#drawer').hidden) { openDrawer(ui.open); if (inD) { const sc = $('#drawer .scroll'); if (sc) sc.scrollTop = 0; const tb = $('#drawer [data-test]') || $('#drawer h2'); if (tb) tb.focus({preventScroll:true}); } } return; }
  const rdc = t.closest('[data-rdisc]'); if (rdc) { ui.resDisc = rdc.dataset.rdisc; renderResults(); return; }
  if (t.closest('[data-copyrefs]')) { copyText(refList(), 'References', `All ${PACK.papers.length} references copied`); return; }
  const ph = t.closest('[data-phase]'); if (ph) { ui.phase = +ph.dataset.phase; renderPhases(); renderIntro(); renderCards(); return; }
  const op = t.closest('[data-open]'); if (op) { const u = findUc(op.dataset.open); if (u) { ui.phase = PHASES.findIndex(p => p.id === u.phase); if (ui.view !== 'cases') setView('cases'); renderPhases(); renderIntro(); openDrawer(u.id); } return; }
  if (t.closest('[data-add]')) { openDrawer('__new'); return; }
  if (t.closest('[data-close]') || t === $('#scrim')) { closeDrawer(); return; }
  const sc = t.closest('[data-scope]'); if (sc && !sc.disabled) { ui.scope = sc.dataset.scope; renderResults(); return; }
  const gr = t.closest('[data-group]'); if (gr) { ui.scope = 'table'; ui.resTable = gr.dataset.group; renderResults(); window.scrollTo({top:0, behavior:'smooth'}); const sp = $('#scopePick'); if (sp) sp.focus({preventScroll:true}); return; }
  const rp = t.closest('[data-rph]'); if (rp) { ui.resPhase = rp.dataset.rph || null; renderResults(); return; }
  if (t.closest('#pdfBtn')) { if (ui.view !== 'results') setView('results'); document.title = 'Results – AI in the Research Process – ' + new Date().toISOString().slice(0, 10); window.print(); setTimeout(() => { document.title = 'AI in the Research Process'; }, 1000); return; }
  const tp = t.closest('[data-tph]'); if (tp) { ui.toolPhase = tp.dataset.tph || null; if (!ui.toolPhase) ui.toolMcp = false; renderTools(); return; }
  const tm = t.closest('[data-tmcp]'); if (tm) { ui.toolMcp = ui.toolMcp === tm.dataset.tmcp ? false : tm.dataset.tmcp; renderTools(); return; }
  if (t.closest('#signOut')) { signOut(); return; }
  if (t.closest('#signIn')) { showLogin(); return; }
  if (t.closest('#explore')) { ui.explore = true; saveUi(); closeLogin(); renderAll(); return; }
  if (t.closest('#menuBtn')) { openMenu(); return; }
  if (t.closest('[data-mclose]') || t === $('#modal')) { closeMenu(); return; }
  if (t === $('#login')) return;
  if (t.closest('[data-opencopilot]') && ui.open) { copyText(promptOf(ui.open), 'Prompt', 'Prompt copied – paste it into Copilot'); return; }
  const slb = t.closest('[data-slides]'); if (slb) { openSlides(+slb.dataset.slides); return; }
  const slc = t.closest('[data-slcopy]'); if (slc) { const p = SLIDES.prompts[+slc.dataset.slcopy][1]; if (slc.tagName === 'A') copyText(p, 'Prompt', 'Prompt copied – paste it into Copilot'); else { e.preventDefault(); copyText(p, 'Prompt'); } return; }
  if (t.closest('[data-copyprompt]') && ui.open) { copyText(promptOf(ui.open), 'Prompt'); return; }
  const gm = t.closest('[data-gmode]'); if (gm && ui.open) { ui.gmode = gm.dataset.gmode; const gd = gm.closest('details.guide'); if (gd) { const tmp = document.createElement('div'); tmp.innerHTML = guideHtml(findUc(ui.open), true); gd.replaceWith(tmp.firstElementChild); } return; }
  if (t.closest('#repCopy')) { copyText(reportMarkdown(), 'Report'); return; }
  if (t.closest('#repDl')) { download(`${stamp()}_ai-research-process_report.md`, reportMarkdown(), 'text/markdown'); return; }
  if (t.closest('#mCsv')) { download(`${stamp()}_ai-research-process_results.csv`, '﻿' + csv(), 'text/csv'); return; }
  if (t.closest('#mJson')) { download(`${stamp()}_ai-research-process_data.json`, JSON.stringify({version:5, exported:new Date().toISOString(), t:state.t, c:state.c}, null, 2), 'application/json'); return; }
  if (t.closest('#mTsv')) { copyText(tsv(), 'Results'); return; }
  if (t.closest('#mgCopy')) { copyText(JSON.stringify({version:5, t:{[myTable()]:tbl(myTable())}, c:state.c.filter(c => c.by === myTable())}), 'Group data'); return; }
  if (t.closest('#mgGo')) { try { const n = merge(parseBlocks($('#mgText').value)); toast(`Merged ${n} ${n === 1 ? 'group' : 'groups'}${merge.skipped ? ` · ${merge.skipped} unknown ${merge.skipped === 1 ? 'name' : 'names'} skipped` : ''}`); $('#mgText').value = ''; } catch(err) { toast('Could not read the pasted text'); } return; }
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
  else if (tb) { if (!r.tt && myTests().length >= MAXTEST) { toast('Your group already tests three use cases'); return; } r.tt = !r.tt; renderLens(); }
  else if (ob) { r.o = r.o === ob.dataset.out ? '' : ob.dataset.out; }
  else if (t.closest('[data-del]')) { state.c = state.c.filter(x => x.id !== id); Object.values(state.t).forEach(X => delete X.r[id]); pushAddition(u, true); push(); closeDrawer(); renderPhases(); renderLens(); const add = $('[data-add]'); if (add) add.focus(); toast('Use case removed'); return; }
  else return;
  push(); openDrawer(id); renderPhases();
  if (tb && r.tt) { const g = $('#drawer').querySelector('details.guide'); if (g) { g.open = true; g.scrollIntoView({block:'start', behavior:'smooth'}); } }
  const again = $('#drawer').querySelector(rb ? `[data-rate="${rb.dataset.rate}"][data-v="${rb.dataset.v}"]` : gb ? `[data-gain="${gb.dataset.gain}"]` : fb ? `[data-flag="${fb.dataset.flag}"]` : tb ? '[data-test]' : `[data-out="${ob.dataset.out}"]`); if (again) again.focus();
});
document.addEventListener('change', e => {
  if (e.target.id === 'tableSel') { state.off = !!e.target.value; state.a = e.target.value || 'Group 1'; save(); renderAll(); toast(state.off ? 'Rating as ' + state.a : 'Explore mode'); }
  if (e.target.id === 'scopePick') { ui.resTable = e.target.value; renderResults(); }
  if (e.target.id === 'mgFile') { Promise.all([...e.target.files].map(f => f.text().then(JSON.parse))).then(list => { const n = merge(list); toast(`Merged ${n} ${n === 1 ? 'group' : 'groups'}${merge.skipped ? ` · ${merge.skipped} unknown ${merge.skipped === 1 ? 'name' : 'names'} skipped` : ''}`); }).catch(() => toast('Could not read the file')); e.target.value = ''; }
});
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.fd;
  if (e.target.dataset && 'note' in e.target.dataset && ui.open && !readOnly()) { const T = tbl(myTable()); (T.r[ui.open] = T.r[ui.open] || {}).note = e.target.value; push(); }
  if (e.target.id === 'discIn' && canRate()) { tbl(myTable()).disc = e.target.value.slice(0, 60); push(); clearTimeout(renderDisc.t); renderDisc.t = setTimeout(() => { renderIdent(); if (ui.open && !$('#drawer').hidden) openDrawer(ui.open); }, 600); }
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
    try { await signIn(code, true); closeLogin(); renderAll(); toast('Signed in as ' + (session.table || 'viewer')); if (session.role === 'viewer') setView('results'); }
    catch(err) { $('#loginErr').textContent = err.status === 400 || /Unknown code/.test(err.message) ? 'This code is not valid – check the spelling.' : 'Could not connect – check the network and try again.'; }
  }
});
document.addEventListener('keydown', e => {
  if (!$('#viewer').hidden) {
    const k = e.key, go = {ArrowRight:1, ArrowDown:1, PageDown:1, ' ':1, ArrowLeft:-1, ArrowUp:-1, PageUp:-1}[k];
    if (go) { e.preventDefault(); showSlide(slideAt + go); } else if (k === 'Home') showSlide(1); else if (k === 'End') showSlide(SLIDES.n);
    else if (k === 'f' || k === 'F') toggleFull(); else if (k === 'Escape') closeSlides();
    else if (k === 'Tab') { const f = [...$('#viewer').querySelectorAll('a,button:not([disabled]):not([hidden])')], a = f.indexOf(document.activeElement);
      if (e.shiftKey && a <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && a === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    return;
  }
  if (e.key === 'Escape') { if (!$('#login').hidden) { ui.explore = true; saveUi(); closeLogin(); renderAll(); } else if (!$('#modal').hidden) closeMenu(); else if (!$('#drawer').hidden) closeDrawer(); }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('li[data-open], g[data-open]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', {bubbles:true})); }
  // keep Tab inside the dialog on top: login, then menu, then drawer
  if (e.key === 'Tab') {
    const box = ['#login', '#modal', '#drawer'].map(q => $(q)).find(x => !x.hidden);
    if (!box) return;
    const f = [...box.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,summary,[tabindex="0"]')].filter(x => x.offsetParent !== null && !(x.tagName !== 'SUMMARY' && x.closest('details:not([open])')));
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus(); }
  }
});

/* ---------- helpers: export, merge, survey ---------- */
const stamp = () => new Date().toISOString().slice(0, 10);
function download(name, text, type){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type:type + ';charset=utf-8'})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
function copyText(text, what, msg){
  const done = () => toast(msg || what + ' copied');
  const fallback = () => { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch(e) { toast('Copy failed – select and copy manually'); } ta.remove(); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
}
function csv(){
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const head = ['Group','Discipline','Phase','Cluster','Use case','Description','Value (1-5)','Kind of gain','Feasibility (1-5)','Score','Starred','Not an AI task','Check rules first','Tested with Copilot','Copilot result','Test note','Workshop addition'];
  const rows = [];
  Object.entries(state.t).forEach(([tn, T]) => PHASES.forEach(p => ucsOf(p).forEach(u => { const r = T.r[u.id]; if (!r || !(r.n || r.u || (r.b || []).length || chkOf(r) || r.f || r.x || r.tt)) return;
    rows.push([tn, discOf(tn), p.name, CLUSTER_OF[p.id], u.t, u.d, r.n || '', (r.b || []).map(gainLabel).join(', '), r.u || '', (r.n && r.u) ? r.n * r.u : '', r.f ? 'yes' : '', r.x ? 'yes' : '', chkOf(r) ? 'yes' : '', r.tt ? 'yes' : '', r.tt && r.o ? OUTCOME[r.o][0] : '', r.tt ? r.note || '' : '', u.custom ? 'yes' : ''].map(q).join(',')); })));
  Object.entries(state.t).forEach(([tn, T]) => ['f1','f2','f3','q'].forEach(k => { if ((T.fd || {})[k]) rows.push([tn, discOf(tn), '', '', k === 'q' ? 'OPEN QUESTION' : 'FINDING', T.fd[k]].map(q).join(',')); }));
  return [head.map(q).join(','), ...rows].join('\r\n');
}
function tsv(){
  const c = v => String(v ?? '').replace(/[\t\r\n]+/g, ' ');
  const head = ['Use case','Phase','Groups rated','Value (avg)','Feasibility (avg)','Value × feasibility (raw)','Ranking score (weighted by groups)','Stars','Kind of gain','Not an AI task','Check rules first','Copilot tests'];
  const rows = allUcs().map(u => ({u, rm:room(u.id)})).filter(e => e.rm.k || e.rm.x.length || e.rm.chk.length || e.rm.stars || e.rm.tests.length).sort((a, b) => byRoom(a.rm, b.rm))
    .map(({u, rm}) => [u.t, SHORT[u.phase], rm.k, rm.k ? rm.n.toFixed(1) : '', rm.k ? rm.u.toFixed(1) : '', rm.k ? (rm.n*rm.u).toFixed(1) : '', rm.k ? roomScore(rm).toFixed(1) : '', rm.stars, GAINS.filter(([g]) => rm.gain[g]).map(([g, l]) => `${l} ×${rm.gain[g]}`).join(', '), rm.x.map(groupLabel).join(' / '), rm.chk.map(groupLabel).join(' / '), rm.tests.map(x => `${groupLabel(x.table)}: ${x.o ? OUTCOME[x.o][0] : 'selected'}`).join(' / ')].map(c).join('\t'));
  const fds = fdTables().flatMap(k => ['f1','f2','f3','q'].filter(x => state.t[k].fd[x]).map(x => [k, c(discOf(k)), x === 'q' ? 'Open question' : 'Finding', c(state.t[k].fd[x])].join('\t')));
  return [head.join('\t'), ...rows, '', 'Group\tDiscipline\tType\tText', ...fds].join('\n');
}
function parseBlocks(text){
  const out = []; let depth = 0, start = -1, inStr = false, escp = false;
  for (let i = 0; i < text.length; i++) { const ch = text[i];
    if (inStr) { if (escp) escp = false; else if (ch === '\\') escp = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true; else if (ch === '{') { if (!depth) start = i; depth++; } else if (ch === '}') { depth--; if (!depth && start >= 0) { out.push(JSON.parse(text.slice(start, i + 1))); start = -1; } } }
  if (!out.length) throw new Error('empty'); return out;
}
// group names from older exports ("Table 3") are mapped to "Group 3"; unknown names are skipped
const groupName = k => { const m = String(k).match(/^(?:table|group)\s*(\d{1,2})$/i); const g = m ? 'Group ' + +m[1] : String(k); return TABLES.includes(g) ? g : null; };
function merge(list){
  let n = 0, skipped = 0;
  list.forEach(s => { if (!s || !s.t) throw new Error('bad');
    Object.entries(s.t).forEach(([k0, T]) => { const k = groupName(k0); if (!k) { skipped++; return; } if (T && (Object.keys(T.r || {}).length || Object.values(T.fd || {}).some(Boolean))) { state.t[k] = tblFrom(T); n++; } });
    (s.c || []).forEach(c => { const i = state.c.findIndex(x => x.id === c.id); if (i >= 0) state.c[i] = c; else state.c.push(c); }); });
  merge.skipped = skipped;
  save(); renderAll(); return n;
}
// order matters: the first pattern that matches a survey stage wins
const STAGE = [[/\blit(erature)?\b|\breview|\bsearch/i,'literatur'],[/\bidea|ideation|\bgap|question/i,'idee'],[/analy|statist|qualitative|quantitative|coding/i,'analyse'],[/design|method/i,'design'],[/collect|fieldwork|survey|interview/i,'erhebung'],[/writ|publish/i,'publikation'],[/impact|exchange|dissem|transfer|engage/i,'transfer'],[/plan|admin|toolkit|across|general/i,'querschnitt']];
const RISKY = [/[\w.+-]+@[\w-]+\.[\w.]+/, /https?:\/\//i, /(?:\+|\b0)\d[\d\s()-]{8,}\d/, /\b(Dr|Prof|Professor|Mr|Mrs|Ms)\.?\s+[A-Z][a-z]+/];
// one CSV line: commas inside quotes stay, doubled quotes become one
const csvCells = l => { const out = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; } else if (ch === '"') q = true; else if (ch === ',' || ch === ';') { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
function parseSurvey(text){
  const phaseFor = s => { s = String(s || '').trim(); const low = s.toLowerCase(); const p = PHASES.find(p => p.id === s || p.short.toLowerCase() === low || p.name.toLowerCase() === low); if (p) return p.id; const m = STAGE.find(([re]) => re.test(s)); return m ? m[1] : null; };
  // without tabs or quotes a comma may belong to the text: keep everything after the first separator as the use case
  const cells = l => l.includes('\t') ? l.split('\t') : l.includes('"') ? csvCells(l) : (m => m ? [m[1], m[2]] : [l])(l.match(/^([^,;]*)[,;](.*)$/));
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => cells(l).map(x => (x = x.trim(), /^".*"$/.test(x) ? x.slice(1, -1).replace(/""/g, '"') : x)))
    .filter(r => r.length >= 2 && r[1] && !/^(stage|phase|cluster)$/i.test(r[0]) && !/^example\b/i.test(r[0]) && !/^example\b/i.test(r[1]))
    .map(r => { const d = r.length > 3 && !r[2] ? r.slice(1).join(', ') : r[1], words = d.split(/\s+/);
      return {phase:phaseFor(r[0]), d, t:(r[2] || words.slice(0, 7).join(' ') + (words.length > 7 ? ' …' : '')).slice(0, 80), risky:RISKY.some(re => re.test(r.join(' ')))}; });
}
function importSurvey(){
  const seen = new Set(state.c.map(c => c.phase + '|' + (c.d || '').toLowerCase()));
  const rows = parseSurvey($('#svText').value).filter(r => r.phase && !r.risky).filter(r => { const k = r.phase + '|' + r.d.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  if (!rows.length) { toast('No new rows to import – check the column order: stage, use case text'); return; }
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
  if (!ui.explore) showLogin();
})();
