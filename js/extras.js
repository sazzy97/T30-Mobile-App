/* T30 extras: bookmarks, write declaration, prayer list, notes, edit profile, More sheet */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ICO = n => `<svg class="ico sm"><use href="#i-${n}"/></svg>`;
  let tt;
  function toast(m) {
    $('#toast-text').textContent = m; const el = $('#toast'); el.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2000);
  }
  function nav(id) { const b = document.createElement('button'); b.dataset.go = id; document.body.appendChild(b); b.click(); b.remove(); }
  function back() { const b = document.createElement('button'); b.dataset.back = ''; document.body.appendChild(b); b.click(); b.remove(); }
  const today = 'Today';

  /* ---------- Bookmarks ---------- */
  const todayVerse = { q: 'Be strong and courageous. Do not be afraid; for the Lord your God will be with you wherever you go.', ref: 'Joshua 1:9', d: 'Oct 14' };
  const bms = [
    { q: 'Be still, and know that I am God.', ref: 'Psalm 46:10', d: 'Oct 9' },
    { q: 'So do not fear, for I am with you.', ref: 'Isaiah 41:10', d: 'Oct 2' },
    { q: 'I can do all this through him who gives me strength.', ref: 'Philippians 4:13', d: 'Sep 21' },
    { q: 'His mercies are new every morning.', ref: 'Lamentations 3:23', d: 'Sep 12' }
  ];
  const isSaved = () => bms.some(b => b.ref === todayVerse.ref);
  function syncBm() {
    $('#btn-save-wotd').classList.toggle('saved', isSaved());
    $('#more-bm-t').textContent = isSaved() ? 'Remove from bookmarks' : 'Save to bookmarks';
  }
  function renderBm() {
    $('#bm-count').textContent = `${bms.length} saved verse${bms.length === 1 ? '' : 's'}`;
    $('#bm-empty').hidden = bms.length > 0;
    $('#bm-list').innerHTML = bms.map((b, i) => `<div class="ex-item" data-i="${i}"><div><p class="ex-q">“${esc(b.q)}”</p><span class="ex-ref">${esc(b.ref)} · NIV</span><small>Saved ${esc(b.d)}</small></div><div class="ex-btns"><button data-share="${i}" aria-label="Share">${ICO('share')}</button><button class="on" data-rm="${i}" aria-label="Remove bookmark">${ICO('bookmark')}</button></div></div>`).join('');
    syncBm();
  }
  function toggleBm() {
    if (isSaved()) { bms.splice(bms.findIndex(b => b.ref === todayVerse.ref), 1); toast('Removed from bookmarks'); }
    else { bms.unshift({ ...todayVerse, d: today }); toast('Saved to bookmarks'); }
    renderBm();
  }
  $('#bm-list').addEventListener('click', e => {
    const rm = e.target.closest('[data-rm]'), sh = e.target.closest('[data-share]');
    if (rm) { bms.splice(+rm.dataset.rm, 1); renderBm(); toast('Removed from bookmarks'); return; }
    if (sh) { toast('Opening share sheet…'); return; }
    if (e.target.closest('.ex-item')) nav('wotd');
  });
  // Replace the old placeholder save handler (clone removes app.js listener)
  const sv = $('#btn-save-wotd'), sv2 = sv.cloneNode(true); sv.replaceWith(sv2);
  sv2.addEventListener('click', toggleBm);

  /* ---------- More sheet ---------- */
  const closeMore = () => { $('#more-sheet').classList.remove('open'); $('#more-bg').classList.remove('open'); };
  const openMore = () => { syncBm(); $('#more-sheet').classList.add('open'); $('#more-bg').classList.add('open'); };
  $$('[data-screen="wotd"] .share-targets .st').forEach(b => { if (/More/.test(b.textContent)) { b.removeAttribute('data-toast'); b.addEventListener('click', openMore); } });
  $('#more-bg').addEventListener('click', closeMore);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMore(); });
  $('#more-sheet').addEventListener('click', e => {
    const app = e.target.closest('.ex-apps button'); if (app) { closeMore(); return; }
    const m = e.target.closest('[data-m]'); if (!m) return;
    const k = m.dataset.m;
    if (k === 'bookmark') { closeMore(); toggleBm(); return; }
    closeMore();
    if (k === 'copy') toast('Verse copied');
    if (k === 'link') toast('Link copied');
    if (k === 'chapter') setTimeout(() => nav('bible'), 200);
    if (k === 'note') setTimeout(() => openNote(null, { title: 'Joshua 1:9', ref: 'Joshua 1:9' }), 200);
  });

  /* ---------- Write declaration ---------- */
  const dwText = $('#dw-text');
  function dwValid() { const ok = dwText.value.trim().length > 3; $('#dw-save').disabled = !ok; $('#dw-save-go').disabled = !ok; $('#dw-n').textContent = dwText.value.length; }
  dwText.addEventListener('input', dwValid);
  function saveDecl() {
    const t = dwText.value.trim(), r = $('#dw-ref').value.trim();
    const list = $('#decl-saved');
    list.insertAdjacentHTML('afterbegin', `<div class="card sf-quote-row red" data-go="decl-session"><p>“${esc(t)}”</p><span>${esc(r || 'My own words')} · Declared 0×</span></div>`);
    dwText.value = ''; $('#dw-ref').value = ''; dwValid();
    toast('Declaration saved');
  }
  $('#dw-save').addEventListener('click', () => { saveDecl(); back(); });
  $('#dw-save-go').addEventListener('click', () => { saveDecl(); nav('decl-session'); });
  const openW = $('#decl-write-btn'); if (openW) openW.addEventListener('click', () => nav('decl-write'));

  /* ---------- Prayer list ---------- */
  const prs = [
    { t: 'Healing for Mum’s recovery', c: 'Healing', n: 12, done: false },
    { t: 'Wisdom for my job decision', c: 'Guidance', n: 7, done: false },
    { t: 'Peace for my brother’s family', c: 'Family', n: 5, done: false },
    { t: 'Provision for school fees', c: 'Thanks', n: 21, done: true }
  ];
  let prTab = 'praying', prCat = 'Family';
  function renderPr() {
    const pr = prs.filter(p => !p.done), an = prs.filter(p => p.done);
    $('#pr-n1').textContent = pr.length; $('#pr-n2').textContent = an.length;
    const show = prTab === 'praying' ? pr : an;
    $('#pr-list').innerHTML = prs.map((p, i) => [p, i]).filter(([p]) => (p.done) === (prTab === 'answered')).map(([p, i]) =>
      `<div class="ex-item${p.done ? ' done' : ''}"><button class="ex-chk" data-ck="${i}" aria-label="Toggle answered">${p.done ? ICO('check') : ''}</button><div><b class="ex-t">${esc(p.t)}</b><p><span class="ex-tag">${esc(p.c)}</span><span class="ex-pray-n">Prayed ${p.n}×</span></p></div><div class="ex-btns">${p.done ? '' : `<button data-pray="${i}" aria-label="I prayed">${ICO('pray')}</button>`}<button data-rm="${i}" aria-label="Delete">${ICO('x')}</button></div></div>`).join('');
    $('#pr-empty').hidden = show.length > 0;
    $('#pr-empty-t').textContent = prTab === 'praying' ? 'No requests yet' : 'No answered prayers yet';
    $('#pr-empty-p').textContent = prTab === 'praying' ? 'Write what’s on your heart and come back to pray over it.' : 'Mark a request as answered and celebrate what God has done.';
  }
  $('#pr-list').addEventListener('click', e => {
    const ck = e.target.closest('[data-ck]'), pr = e.target.closest('[data-pray]'), rm = e.target.closest('[data-rm]');
    if (ck) { const p = prs[+ck.dataset.ck]; p.done = !p.done; toast(p.done ? 'Answered prayer 🙌 Praise God!' : 'Moved back to praying'); }
    else if (pr) { prs[+pr.dataset.pray].n++; toast('Prayed 🙏'); }
    else if (rm) { prs.splice(+rm.dataset.rm, 1); toast('Removed'); }
    else return;
    renderPr();
  });
  $('#pr-tabs').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    prTab = b.dataset.t; $$('#pr-tabs button').forEach(x => x.classList.toggle('on', x === b)); renderPr();
  });
  $('#pr-cat').addEventListener('click', e => { const b = e.target.closest('.pill'); if (b) prCat = b.textContent; });
  function addPr() {
    const v = $('#pr-input').value.trim(); if (!v) { toast('Write a request first'); return; }
    prs.unshift({ t: v, c: prCat, n: 0, done: false }); $('#pr-input').value = '';
    prTab = 'praying'; $$('#pr-tabs button').forEach(x => x.classList.toggle('on', x.dataset.t === 'praying'));
    renderPr(); toast('Added to your prayer list');
  }
  $('#pr-add').addEventListener('click', addPr);
  $('#pr-input').addEventListener('keydown', e => { if (e.key === 'Enter') addPr(); });

  /* ---------- Notes ---------- */
  const notes = [
    { title: 'God’s love is a gift', ref: 'John 3:16', text: 'God’s love isn’t earned, it’s given. Remember this when I feel unworthy.', d: 'Oct 14', vis: 0 },
    { title: 'Stillness is trust', ref: 'Psalm 46:10', text: 'Stillness is an act of trust.', d: 'Oct 9', vis: 0 },
    { title: 'The whisper', ref: '1 Kings 19:12', text: 'God was in the whisper, not the fire.', d: 'Oct 3', vis: 1 }
  ];
  let editing = null, vis = 0;
  function renderNotes() {
    const q = $('#nt-search').value.trim().toLowerCase();
    const rows = notes.map((n, i) => [n, i]).filter(([n]) => !q || (n.title + n.ref + n.text).toLowerCase().includes(q));
    $('#nt-count').textContent = `${rows.length} note${rows.length === 1 ? '' : 's'}`;
    $('#nt-empty').hidden = rows.length > 0;
    $('#nt-list').innerHTML = rows.map(([n, i]) => `<div class="ex-item" data-i="${i}"><div><b>${esc(n.title || 'Untitled')}</b>${n.ref ? `<span class="ex-ref" style="margin-top:2px">${esc(n.ref)}</span>` : ''}<p>${esc(n.text)}</p><small>${esc(n.d)} · ${n.vis ? 'Friends' : 'Private'}</small></div></div>`).join('');
  }
  function setVis(v) { vis = v; $$('#ne-vis button').forEach((b, i) => b.classList.toggle('on', i === v)); }
  function openNote(i, pre) {
    editing = i; const n = i === null ? (pre || { title: '', ref: '', text: '', vis: 0 }) : notes[i];
    $('#ne-head').textContent = i === null ? 'New Note' : 'Edit Note';
    $('#ne-title').value = n.title || ''; $('#ne-ref').value = n.ref || ''; $('#ne-text').value = n.text || '';
    $('#ne-del').style.visibility = i === null ? 'hidden' : 'visible';
    setVis(n.vis || 0); nav('note-edit');
  }
  $('#nt-list').addEventListener('click', e => { const it = e.target.closest('.ex-item'); if (it) openNote(+it.dataset.i); });
  $('#nt-search').addEventListener('input', renderNotes);
  $('#nt-new').addEventListener('click', () => openNote(null));
  $('#nt-new2').addEventListener('click', () => openNote(null));
  $('#ne-vis').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setVis($$('#ne-vis button').indexOf(b)); });
  $('#ne-save').addEventListener('click', () => {
    const o = { title: $('#ne-title').value.trim(), ref: $('#ne-ref').value.trim(), text: $('#ne-text').value.trim(), vis };
    if (!o.title && !o.text) { toast('Write something first'); return; }
    if (editing === null) notes.unshift({ ...o, d: today }); else notes[editing] = { ...notes[editing], ...o };
    $('#nt-search').value = ''; renderNotes(); toast('Note saved'); back();
  });
  $('#ne-del').addEventListener('click', () => { if (editing !== null) notes.splice(editing, 1); renderNotes(); toast('Note deleted'); back(); });

  /* ---------- Edit profile ---------- */
  $('#ep-goals').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) c.classList.toggle('selected'); });
  $('#ep-save').addEventListener('click', () => {
    const name = $('#ep-name').value.trim() || 'Grace Adeyemi';
    $$('.prof-head h2').forEach(h => h.textContent = name);
    $$('.sf-acct b').forEach(b => b.textContent = name);
    $$('.sf-acct div span').forEach(s => s.textContent = $('#ep-mail').value.trim());
    toast('Profile updated'); back();
  });

  renderBm(); renderPr(); renderNotes();
})();
