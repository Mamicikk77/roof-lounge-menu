// Roof Lounge menü paneli — GitHub Pages üzerinde çalışır.
// Değişiklikler tarayıcıda birikir, "Yayınla" ile data/menu.json GitHub deposuna kaydedilir.
// Fotoğraflar seçildiği anda uploads/ klasörüne yüklenir.
(() => {
  const { allergens: AL, tags: TG, money, esc } = window.RL;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const LANGS = ['tr', 'en', 'ru'];
  const MENU_PATH = 'data/menu.json';
  const ALLERGENS = Object.keys(AL), TAGS = Object.keys(TG);

  const S = { data: null, original: '', sha: null, editing: null, image: '', uploads: new Map(), gh: null };
  const imgSrc = p => !p ? '' : /^(https?:|data:)/.test(p) ? p : '../' + p.replace(/^\//, '');
  const uid = p => p + Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(16).padStart(2, '0')).join('');

  /* ---------- Yardımcılar ---------- */
  let toastT;
  function toast(msg, bad) { const t = $('#toast'); t.textContent = msg; t.className = 'toast' + (bad ? ' bad' : ''); t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3200); }
  const fail = e => toast(e.message, true);
  function confirmBox(text, yes = 'Evet') {
    return new Promise(res => {
      $('#confirmText').textContent = text; $('#confirmYes').textContent = yes; $('#confirmModal').hidden = false;
      const done = v => { $('#confirmModal').hidden = true; $('#confirmYes').onclick = $('#confirmNo').onclick = null; res(v); };
      $('#confirmYes').onclick = () => done(true); $('#confirmNo').onclick = () => done(false);
    });
  }
  const b64encode = str => { const bytes = new TextEncoder().encode(str); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(bin); };
  const b64decode = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0)));

  /* ---------- GitHub API ---------- */
  const store = {
    get() { try { return JSON.parse(localStorage.getItem('rl_gh') || sessionStorage.getItem('rl_gh') || 'null'); } catch { return null; } },
    set(v, remember) { try { (remember ? localStorage : sessionStorage).setItem('rl_gh', JSON.stringify(v)); } catch {} },
    clear() { try { localStorage.removeItem('rl_gh'); sessionStorage.removeItem('rl_gh'); } catch {} },
  };
  async function gh(path, opts = {}) {
    const r = await fetch(`https://api.github.com/repos/${S.gh.repo}${path}`, {
      method: opts.method || 'GET',
      headers: { Authorization: `Bearer ${S.gh.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store',
    });
    let j = null; try { j = await r.json(); } catch {}
    if (!r.ok) {
      const err = new Error(
        r.status === 401 ? 'Erişim anahtarı geçersiz veya süresi dolmuş.' :
        r.status === 403 ? 'Bu anahtarın depoya yazma izni yok (Contents: Read and write gerekli).' :
        r.status === 404 ? 'Depo veya dosya bulunamadı. Depo adını ve anahtarın bu depoya erişimini kontrol edin.' :
        r.status === 409 || r.status === 422 ? 'Menü bu arada başka bir yerden değiştirilmiş.' :
        (j && j.message) || 'GitHub isteği başarısız');
      err.status = r.status; throw err;
    }
    return j;
  }
  const putFile = (path, contentB64, message, sha) => gh(`/contents/${path}`, { method: 'PUT', body: { message, content: contentB64, branch: S.gh.branch, ...(sha ? { sha } : {}) } });
  const deleteFile = (path, sha, message) => gh(`/contents/${path}`, { method: 'DELETE', body: { message, sha, branch: S.gh.branch } });

  async function loadMenu() {
    const meta = await gh(`/contents/${MENU_PATH}?ref=${encodeURIComponent(S.gh.branch)}`);
    let text;
    if (meta.content) text = b64decode(meta.content);
    else { const blob = await gh(`/git/blobs/${meta.sha}`); text = b64decode(blob.content); }
    S.data = JSON.parse(text); S.sha = meta.sha;
    S.data.products.forEach(p => { if (p.image) p.image = p.image.replace(/^\//, ''); });
    S.original = JSON.stringify(S.data);
  }

  /* ---------- Giriş ---------- */
  function guessRepo() {
    const h = location.hostname;
    if (!h.endsWith('.github.io')) return '';
    const owner = h.split('.')[0], first = location.pathname.split('/').filter(Boolean)[0];
    return first && first !== 'admin' ? `${owner}/${first}` : `${owner}/${h}`;
  }
  function showLogin(msg) {
    $('#app').hidden = true; $('#login').hidden = false;
    const f = $('#loginForm'); f.elements.repo.value = f.elements.repo.value || guessRepo();
    $('#loginErr').textContent = msg || '';
  }
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target; $('#loginErr').textContent = '';
    const repo = f.elements.repo.value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '');
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return $('#loginErr').textContent = 'Depo "kullanici/repo" biçiminde olmalı';
    const btn = f.querySelector('button.primary'); btn.disabled = true; btn.textContent = 'Bağlanıyor…';
    try {
      await connect({ token: f.elements.token.value.trim(), repo });
      store.set(S.gh, f.elements.remember.checked);
      f.elements.token.value = '';
    } catch (err) { $('#loginErr').textContent = err.message; }
    finally { btn.disabled = false; btn.textContent = 'Giriş Yap'; }
  });
  $('#logoutBtn').addEventListener('click', async () => {
    if (isDirty() && !await confirmBox('Yayınlanmamış değişiklikler kaybolacak. Çıkış yapılsın mı?', 'Çıkış yap')) return;
    store.clear(); S.data = null; S.original = ''; S.gh = null; showLogin();
  });

  async function connect(cred) {
    S.gh = { ...cred };
    const info = await gh('');
    if (!info.permissions || !info.permissions.push) throw new Error('Bu anahtarın depoya yazma izni yok (Contents: Read and write gerekli).');
    S.gh.branch = info.default_branch || 'main';
    await loadMenu();
    $('#login').hidden = true; $('#app').hidden = false;
    $('#connInfo').innerHTML = `Bağlı depo: <b>${esc(S.gh.repo)}</b> (dal: ${esc(S.gh.branch)})`;
    renderAllViews(); changed();
  }

  async function boot() {
    const saved = store.get();
    if (!saved) return showLogin();
    try { await connect(saved); }
    catch (err) { store.clear(); showLogin(err.message); }
  }

  function renderAllViews() { fillCategorySelects(); renderProducts(); renderCategories(); renderSettings(); renderBulk(); renderQR(); }

  /* ---------- Yayınlama ---------- */
  const isDirty = () => !!S.data && JSON.stringify(S.data) !== S.original;
  function changed() {
    const d = isDirty();
    $('#publishBar').hidden = !d;
    if (d) {
      const o = JSON.parse(S.original), n = S.data;
      const ids = new Set([...o.products.map(p => p.id), ...n.products.map(p => p.id)]);
      let c = 0; ids.forEach(id => { const a = o.products.find(p => p.id === id), b = n.products.find(p => p.id === id); if (JSON.stringify(a) !== JSON.stringify(b)) c++; });
      const other = JSON.stringify({ ...o, products: 0 }) !== JSON.stringify({ ...n, products: 0 });
      $('#dirtyText').textContent = `Yayınlanmamış değişiklik: ${c ? c + ' ürün' : ''}${c && other ? ' + ' : ''}${other ? 'kategori/ayar' : ''}`;
    }
  }
  window.addEventListener('beforeunload', e => { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });

  $('#publishBtn').addEventListener('click', async () => {
    const btn = $('#publishBtn'); btn.disabled = true; btn.textContent = 'Yayınlanıyor…';
    try {
      const before = new Set(JSON.parse(S.original).products.map(p => p.image).filter(Boolean));
      S.data.updatedAt = new Date().toISOString();
      const res = await putFile(MENU_PATH, b64encode(JSON.stringify(S.data, null, 1)), `Menü güncellendi (${new Date().toLocaleString('tr-TR')})`, S.sha);
      S.sha = res.content.sha; S.original = JSON.stringify(S.data);
      // Artık kullanılmayan fotoğrafları depodan kaldır
      const now = new Set(S.data.products.map(p => p.image).filter(Boolean));
      for (const img of before) if (!now.has(img) && img.startsWith('uploads/')) {
        try { const m = await gh(`/contents/${img}?ref=${encodeURIComponent(S.gh.branch)}`); await deleteFile(img, m.sha, 'Kullanılmayan fotoğraf silindi'); } catch {}
      }
      changed();
      toast('Yayınlandı ✓ Site yaklaşık 1 dakika içinde güncellenir.');
    } catch (err) {
      if (err.status === 409 || err.status === 422) toast('Menü başka bir cihazdan değiştirilmiş. Değişikliklerinizi not alıp sayfayı yenileyin.', true);
      else fail(err);
    } finally { btn.disabled = false; btn.textContent = 'Değişiklikleri Yayınla'; }
  });
  $('#discardBtn').addEventListener('click', async () => {
    if (!await confirmBox('Yayınlanmamış tüm değişiklikler geri alınsın mı?', 'Geri al')) return;
    S.data = JSON.parse(S.original); renderAllViews(); changed(); toast('Değişiklikler geri alındı');
  });

  /* ---------- Sekmeler ---------- */
  $('#tabs').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('#tabs button').forEach(x => x.classList.toggle('on', x === b));
    $$('[data-view]').forEach(v => v.hidden = v.dataset.view !== b.dataset.tab);
    window.scrollTo(0, 0);
  });

  const catName = id => S.data.categories.find(c => c.id === id)?.name.tr || '—';
  const sortedCats = () => [...S.data.categories].sort((a, b) => a.order - b.order);
  function fillCategorySelects() {
    const opts = S.data.sections.map(s => `<optgroup label="${esc(s.name.tr)}">${sortedCats().filter(c => c.section === s.id).map(c => `<option value="${c.id}">${esc(c.icon)} ${esc(c.name.tr)}</option>`).join('')}</optgroup>`).join('');
    const cur = $('#pCat').value;
    $('#pCat').innerHTML = `<option value="all">Tüm kategoriler</option>` + opts;
    $('#pCat').value = S.data.categories.some(c => c.id === cur) ? cur : 'all';
    $('#pCategory').innerHTML = opts;
  }

  /* ---------- Ürün listesi ---------- */
  function renderProducts() {
    const q = $('#pSearch').value.trim().toLocaleLowerCase('tr');
    const cat = $('#pCat').value, st = $('#pState').value;
    const P = S.data.products, cur = S.data.settings.currency;
    $('#prodStats').textContent = `${P.length} ürün · ${P.filter(p => p.active).length} yayında · ${P.filter(p => p.image).length} fotoğraflı`;
    const catOrder = Object.fromEntries(sortedCats().map((c, i) => [c.id, i]));
    const list = P.filter(p => {
      if (cat !== 'all' && p.category !== cat) return false;
      if (st === 'active' && !p.active) return false;
      if (st === 'hidden' && p.active) return false;
      if (st === 'sold' && !p.soldOut) return false;
      if (st === 'noimg' && p.image) return false;
      if (st === 'notr' && p.name.en && p.name.ru) return false;
      if (q && ![p.name.tr, p.name.en, p.name.ru].join(' ').toLocaleLowerCase('tr').includes(q)) return false;
      return true;
    }).sort((a, b) => (catOrder[a.category] - catOrder[b.category]) || (a.order - b.order));
    const canReorder = cat !== 'all' && !q && st === 'all';
    $('#reorderHint').hidden = canReorder;
    let html = '', last = null;
    list.forEach((p, i) => {
      if (cat === 'all' && p.category !== last) { html += `<div class="cat-sep">${esc(catName(p.category))}</div>`; last = p.category; }
      const c = S.data.categories.find(x => x.id === p.category);
      const missing = (!p.name.en || !p.name.ru) ? '<span class="pill gray">Çeviri eksik</span>' : '';
      const price = p.variants.length
        ? `<div class="var">${p.variants.map(v => `${esc(v.label.tr)}: <b>${money(v.price, cur)}</b>`).join('<br>')}</div>`
        : `<input type="number" min="0" step="0.01" value="${p.price}" data-price="${p.id}" aria-label="Fiyat"><span>${esc(cur)}</span>`;
      html += `<div class="prow${p.active ? '' : ' off'}">
        <div class="pthumb">${p.image ? `<img src="${esc(imgSrc(p.image))}" alt="" loading="lazy">` : esc(c?.icon || '🍽')}</div>
        <div class="pname"><b>${esc(p.name.tr)}</b><small>${p.kcal != null ? `${p.kcal} kcal` : ''}${p.allergens.length ? ` · ${p.allergens.map(a => AL[a].i).join('')}` : ''} ${!p.active ? '<span class="pill gray">Gizli</span>' : ''}${p.soldOut ? '<span class="pill red">Tükendi</span>' : ''}${missing}</small></div>
        <div class="pprice">${price}</div>
        <div class="pact">
          ${canReorder ? `<button class="ibtn" data-move="${p.id}" data-dir="-1" title="Yukarı" ${i === 0 ? 'disabled' : ''}>↑</button><button class="ibtn" data-move="${p.id}" data-dir="1" title="Aşağı" ${i === list.length - 1 ? 'disabled' : ''}>↓</button>` : ''}
          <button class="ibtn ${p.active ? 'on' : ''}" data-toggle="active" data-id="${p.id}" title="${p.active ? 'Menüden gizle' : 'Menüde göster'}">${p.active ? '👁' : '🚫'}</button>
          <button class="ibtn ${p.soldOut ? 'warn' : ''}" data-toggle="soldOut" data-id="${p.id}" title="${p.soldOut ? 'Tükendi işaretini kaldır' : 'Tükendi olarak işaretle'}">⊘</button>
          <button class="btn sm" data-edit="${p.id}">Düzenle</button>
        </div></div>`;
    });
    $('#plist').innerHTML = html || '<div class="empty">Ürün bulunamadı.</div>';
  }
  ['#pSearch', '#pCat', '#pState'].forEach(s => $(s).addEventListener('input', renderProducts));

  $('#plist').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]'), tg = e.target.closest('[data-toggle]'), mv = e.target.closest('[data-move]');
    if (ed) openProduct(ed.dataset.edit);
    if (tg) {
      const p = S.data.products.find(x => x.id === tg.dataset.id), k = tg.dataset.toggle;
      p[k] = !p[k]; renderProducts(); changed();
    }
    if (mv) {
      const p = S.data.products.find(x => x.id === mv.dataset.move);
      const list = S.data.products.filter(x => x.category === p.category).sort((a, b) => a.order - b.order);
      const i = list.indexOf(p), j = i + Number(mv.dataset.dir);
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
      list.forEach((x, k) => x.order = k + 1);
      renderProducts(); changed();
    }
  });
  $('#plist').addEventListener('change', e => {
    const inp = e.target.closest('[data-price]'); if (!inp) return;
    const p = S.data.products.find(x => x.id === inp.dataset.price);
    const v = Math.round(Number(inp.value) * 100) / 100;
    if (!Number.isFinite(v) || v <= 0) { inp.value = p.price; return toast('Geçerli bir fiyat girin', true); }
    p.price = v; changed();
  });
  $('#plist').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-price]')) e.target.blur(); });

  /* ---------- Ürün düzenleme ---------- */
  $('#pAllergens').innerHTML = Object.entries(AL).map(([k, v]) => `<label class="check"><input type="checkbox" name="al" value="${k}">${v.i} ${esc(v.tr)}</label>`).join('');
  $('#pTags').innerHTML = Object.entries(TG).map(([k, v]) => `<label class="check"><input type="checkbox" name="tag" value="${k}">${v.i} ${esc(v.tr)}</label>`).join('');

  function setLangTab(l) {
    $$('#pLangTabs button').forEach(b => b.classList.toggle('on', b.dataset.l === l));
    $$('.lang-panes [data-pane]').forEach(p => p.hidden = p.dataset.pane !== l);
  }
  function markMissing() {
    const f = $('#pForm');
    $$('#pLangTabs button').forEach(b => { const l = b.dataset.l; b.classList.toggle('missing', l !== 'tr' && !f.elements['name.' + l].value.trim()); });
  }
  $('#pLangTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setLangTab(b.dataset.l); });
  $('#pForm').addEventListener('input', e => { if (e.target.name?.startsWith('name.')) markMissing(); });

  function setPhoto(path) {
    S.image = path || '';
    $('#photoImg').hidden = !S.image; $('#photoEmpty').hidden = !!S.image;
    if (S.image) $('#photoImg').src = S.uploads.get(S.image)?.preview || imgSrc(S.image);
    $('#photoRemove').hidden = !S.image;
    $('#photoChange').textContent = S.image ? 'Fotoğrafı değiştir' : 'Fotoğraf seç';
  }

  function variantRow(v = { label: { tr: '', en: '', ru: '' }, price: '' }) {
    const d = document.createElement('div'); d.className = 'vrow';
    d.innerHTML = `<label>Seçenek (TR)<input data-v="tr" value="${esc(v.label.tr)}" placeholder="Örn. Duble"></label>
      <label>Option (EN)<input data-v="en" value="${esc(v.label.en)}" placeholder="Double"></label>
      <label>Вариант (RU)<input data-v="ru" value="${esc(v.label.ru)}" placeholder="Двойной"></label>
      <label>Fiyat<input data-v="price" type="number" min="0" step="0.01" value="${v.price}"></label>
      <button type="button" class="ibtn warn" data-vdel title="Seçeneği sil">✕</button>`;
    return d;
  }
  function setVariants(list) {
    const on = list.length > 0;
    $('#hasVariants').checked = on;
    $('#variantList').innerHTML = ''; list.forEach(v => $('#variantList').append(variantRow(v)));
    $('#variantList').hidden = $('#addVariant').hidden = !on;
    $('#pForm').elements.price.disabled = on;
    $('#pForm').elements.price.placeholder = on ? 'Seçeneklerde belirlenir' : '';
  }
  $('#hasVariants').addEventListener('change', e => {
    const f = $('#pForm');
    if (e.target.checked) setVariants([{ label: { tr: 'Tek', en: 'Single', ru: 'Одинарный' }, price: f.elements.price.value || '' }, { label: { tr: 'Duble', en: 'Double', ru: 'Двойной' }, price: '' }]);
    else { const first = $('#variantList [data-v=price]'); setVariants([]); if (first) f.elements.price.value = first.value; }
  });
  $('#addVariant').addEventListener('click', () => $('#variantList').append(variantRow()));
  $('#variantList').addEventListener('click', e => { if (e.target.closest('[data-vdel]')) { e.target.closest('.vrow').remove(); if (!$('#variantList').children.length) setVariants([]); } });

  function openProduct(id) {
    const p = id ? S.data.products.find(x => x.id === id) : null;
    S.editing = p;
    const f = $('#pForm'); f.reset(); $('#pErr').textContent = '';
    $('#pModalTitle').textContent = p ? 'Ürünü Düzenle' : 'Yeni Ürün';
    $('#pDelete').hidden = !p;
    LANGS.forEach(l => { f.elements['name.' + l].value = p?.name[l] || ''; f.elements['desc.' + l].value = p?.desc[l] || ''; });
    const curCat = $('#pCat').value;
    f.elements.category.value = p?.category || (curCat !== 'all' ? curCat : sortedCats()[0].id);
    f.elements.price.value = p ? p.price : '';
    f.elements.kcal.value = p?.kcal ?? '';
    f.elements.portion.value = p?.portion || '';
    f.elements.active.checked = p ? p.active : true;
    f.elements.soldOut.checked = !!p?.soldOut;
    $$('#pAllergens input').forEach(i => i.checked = !!p?.allergens.includes(i.value));
    $$('#pTags input').forEach(i => i.checked = !!p?.tags.includes(i.value));
    setVariants(p?.variants || []);
    setPhoto(p?.image);
    setLangTab('tr'); markMissing();
    $('#pModal').hidden = false;
    setTimeout(() => f.elements['name.tr'].focus(), 50);
  }
  function cleanupUploads() {
    // Yüklenip hiçbir üründe kullanılmayan (henüz yayınlanmamış) fotoğrafları depodan sil
    const used = new Set([...S.data.products.map(p => p.image), ...JSON.parse(S.original).products.map(p => p.image)]);
    for (const [path, info] of S.uploads) if (!used.has(path)) { S.uploads.delete(path); deleteFile(path, info.sha, 'Kullanılmayan fotoğraf silindi').catch(() => {}); }
  }
  function closeProduct() { $('#pModal').hidden = true; cleanupUploads(); }
  $('#pModal').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeProduct(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#pModal').hidden && $('#confirmModal').hidden) closeProduct(); });
  $('#newProductBtn').addEventListener('click', () => openProduct(null));

  $('#pForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target; $('#pErr').textContent = '';
    const num = v => Math.max(0, Math.round(Number(v || 0) * 100) / 100);
    const variants = $('#hasVariants').checked ? $$('#variantList .vrow').map(r => ({ label: { tr: r.querySelector('[data-v=tr]').value.trim(), en: r.querySelector('[data-v=en]').value.trim(), ru: r.querySelector('[data-v=ru]').value.trim() }, price: num(r.querySelector('[data-v=price]').value) })).filter(v => v.label.tr) : [];
    const body = {
      name: Object.fromEntries(LANGS.map(l => [l, f.elements['name.' + l].value.trim()])),
      desc: Object.fromEntries(LANGS.map(l => [l, f.elements['desc.' + l].value.trim()])),
      category: f.elements.category.value,
      price: variants.length ? variants[0].price : num(f.elements.price.value),
      variants,
      kcal: f.elements.kcal.value === '' ? null : Math.round(num(f.elements.kcal.value)),
      portion: f.elements.portion.value.trim(),
      allergens: $$('#pAllergens input:checked').map(i => i.value).filter(a => ALLERGENS.includes(a)),
      tags: $$('#pTags input:checked').map(i => i.value).filter(t => TAGS.includes(t)),
      image: S.image,
      active: f.elements.active.checked,
      soldOut: f.elements.soldOut.checked,
    };
    if (!body.name.tr) { setLangTab('tr'); return $('#pErr').textContent = 'Türkçe ürün adı zorunludur'; }
    if ($('#hasVariants').checked && !variants.length) return $('#pErr').textContent = 'En az bir seçenek girin veya seçenekleri kapatın';
    if (!(body.price > 0)) return $('#pErr').textContent = 'Fiyat girin';
    const nextOrder = cat => Math.max(0, ...S.data.products.filter(x => x.category === cat).map(x => x.order)) + 1;
    if (S.editing) {
      if (S.editing.category !== body.category) body.order = nextOrder(body.category);
      Object.assign(S.editing, body);
    } else {
      S.data.products.push({ id: uid('p'), ...body, order: nextOrder(body.category) });
    }
    closeProduct(); renderProducts(); renderCategories(); changed();
    toast('Kaydedildi — siteye göndermek için "Değişiklikleri Yayınla"ya basın');
  });

  $('#pDelete').addEventListener('click', async () => {
    const p = S.editing; if (!p) return;
    if (!await confirmBox(`"${p.name.tr}" ürünü silinsin mi?`, 'Sil')) return;
    S.data.products = S.data.products.filter(x => x !== p); S.editing = null;
    closeProduct(); renderProducts(); renderCategories(); changed();
    toast('Ürün silindi — yayınlayınca menüden kalkar');
  });

  /* ---------- Fotoğraf ---------- */
  function resizeImage(file, max = 1200) {
    return new Promise((res, rej) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        let d = c.toDataURL('image/webp', 0.82), ext = 'webp';
        if (!d.startsWith('data:image/webp')) { d = c.toDataURL('image/jpeg', 0.85); ext = 'jpg'; }
        res({ dataUrl: d, ext });
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Görsel okunamadı. JPG, PNG veya WEBP deneyin.')); };
      img.src = url;
    });
  }
  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return toast('Lütfen bir görsel dosyası seçin', true);
    $('#photoBusy').hidden = false;
    try {
      const { dataUrl, ext } = await resizeImage(file);
      const path = `uploads/${uid('img-')}.${ext}`;
      const r = await putFile(path, dataUrl.split(',')[1], 'Fotoğraf yüklendi');
      S.uploads.set(path, { sha: r.content.sha, preview: dataUrl });
      setPhoto(path);
    } catch (err) { fail(err); }
    finally { $('#photoBusy').hidden = true; $('#photoInput').value = ''; }
  }
  $('#photoBox').addEventListener('click', () => $('#photoInput').click());
  $('#photoChange').addEventListener('click', () => $('#photoInput').click());
  $('#photoInput').addEventListener('change', e => handleFile(e.target.files[0]));
  $('#photoRemove').addEventListener('click', () => setPhoto(''));
  const pb = $('#photoBox');
  ['dragenter', 'dragover'].forEach(ev => pb.addEventListener(ev, e => { e.preventDefault(); pb.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(ev => pb.addEventListener(ev, e => { e.preventDefault(); pb.classList.remove('drag'); }));
  pb.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));

  /* ---------- Kategoriler ---------- */
  function renderCategories() {
    const secOpts = id => S.data.sections.map(s => `<option value="${s.id}" ${s.id === id ? 'selected' : ''}>${esc(s.name.tr)}</option>`).join('');
    const cats = sortedCats();
    $('#clist').innerHTML = S.data.sections.map(s => {
      const list = cats.filter(c => c.section === s.id);
      return `<div class="sec-title">${esc(s.name.tr)}</div>` + list.map((c, i) => {
        const n = S.data.products.filter(p => p.category === c.id).length;
        return `<div class="crow${c.active ? '' : ' off'}" data-cid="${c.id}">
          <label>İkon<input data-f="icon" value="${esc(c.icon)}" maxlength="8"></label>
          <label>Türkçe<input data-f="tr" value="${esc(c.name.tr)}"></label>
          <label>English<input data-f="en" value="${esc(c.name.en)}"></label>
          <label>Русский<input data-f="ru" value="${esc(c.name.ru)}"></label>
          <label>Bölüm<select data-f="section">${secOpts(c.section)}</select></label>
          <div class="pact"><span class="cnt">${n} ürün</span>
            <button class="ibtn" data-cmove="-1" ${i === 0 ? 'disabled' : ''} title="Yukarı">↑</button>
            <button class="ibtn" data-cmove="1" ${i === list.length - 1 ? 'disabled' : ''} title="Aşağı">↓</button>
            <button class="ibtn ${c.active ? 'on' : ''}" data-cact title="${c.active ? 'Gizle' : 'Göster'}">${c.active ? '👁' : '🚫'}</button>
            <button class="ibtn warn" data-cdel title="Sil">🗑</button>
          </div></div>`;
      }).join('');
    }).join('');
  }
  $('#clist').addEventListener('change', e => {
    const row = e.target.closest('[data-cid]'); if (!row) return;
    const c = S.data.categories.find(x => x.id === row.dataset.cid);
    const val = k => row.querySelector(`[data-f=${k}]`).value.trim();
    if (!val('tr')) { toast('Türkçe ad boş olamaz', true); return renderCategories(); }
    c.icon = val('icon'); c.section = val('section'); c.name = { tr: val('tr'), en: val('en'), ru: val('ru') };
    fillCategorySelects(); renderBulk(); if (e.target.dataset.f === 'section') renderCategories(); changed();
  });
  $('#clist').addEventListener('click', async e => {
    const row = e.target.closest('[data-cid]'); if (!row) return;
    const c = S.data.categories.find(x => x.id === row.dataset.cid);
    if (e.target.closest('[data-cact]')) { c.active = !c.active; renderCategories(); changed(); }
    if (e.target.closest('[data-cdel]')) {
      const n = S.data.products.filter(p => p.category === c.id).length;
      if (n) return toast(`Bu kategoride ${n} ürün var. Önce ürünleri silin veya başka kategoriye taşıyın.`, true);
      if (!await confirmBox(`"${c.name.tr}" kategorisi silinsin mi?`, 'Sil')) return;
      S.data.categories = S.data.categories.filter(x => x !== c); renderCategories(); fillCategorySelects(); renderBulk(); changed();
    }
    const mv = e.target.closest('[data-cmove]');
    if (mv) {
      const cats = sortedCats(), same = cats.filter(x => x.section === c.section);
      const i = same.indexOf(c), j = i + Number(mv.dataset.cmove); if (j < 0 || j >= same.length) return;
      const a = cats.indexOf(same[i]), b = cats.indexOf(same[j]); [cats[a], cats[b]] = [cats[b], cats[a]];
      cats.forEach((x, k) => x.order = k + 1);
      renderCategories(); fillCategorySelects(); renderProducts(); changed();
    }
  });
  $('#newCatBtn').addEventListener('click', () => {
    const tr = (prompt('Yeni kategorinin Türkçe adı:') || '').trim(); if (!tr) return;
    let id = tr.toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'kategori';
    while (S.data.categories.some(c => c.id === id)) id += '-2';
    S.data.categories.push({ id, section: 'food', icon: '🍽', name: { tr, en: '', ru: '' }, active: true, order: Math.max(0, ...S.data.categories.map(c => c.order)) + 1 });
    renderCategories(); fillCategorySelects(); renderBulk(); changed();
    toast('Kategori eklendi — İngilizce ve Rusça adlarını girmeyi unutmayın');
  });

  /* ---------- Toplu fiyat ---------- */
  function renderBulk() {
    $('#bulkScope').innerHTML = `<option value="all">Tüm menü</option>` +
      S.data.sections.map(s => `<option value="s:${s.id}">Bölüm: ${esc(s.name.tr)}</option>`).join('') +
      sortedCats().map(c => `<option value="c:${c.id}">Kategori: ${esc(c.name.tr)}</option>`).join('');
  }
  const roundTo = (v, pct, step) => v > 0 ? Math.max(step, Math.round(v * (1 + pct / 100) / step) * step) : v;
  $('#bulkForm').addEventListener('input', () => {
    const f = $('#bulkForm'), pct = Number(f.elements.percent.value), step = Number(f.elements.round.value);
    const p = S.data.products.find(x => x.price > 0);
    $('#bulkPreview').textContent = pct && p ? `Örnek: ${p.name.tr} ${money(p.price)} → ${money(roundTo(p.price, pct, step))}` : '';
  });
  $('#bulkForm').addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target; const scope = f.elements.scope.value;
    const pct = Number(f.elements.percent.value), step = Number(f.elements.round.value);
    if (!Number.isFinite(pct) || pct === 0 || pct < -90 || pct > 300) return toast('Geçerli bir yüzde girin (-90 ile 300 arası)', true);
    const label = f.elements.scope.selectedOptions[0].textContent;
    if (!await confirmBox(`${label} için fiyatlar %${Math.abs(pct)} ${pct > 0 ? 'artırılacak' : 'azaltılacak'}. Emin misiniz?`)) return;
    let n = 0;
    S.data.products.forEach(p => {
      if (scope.startsWith('c:') && p.category !== scope.slice(2)) return;
      if (scope.startsWith('s:') && S.data.categories.find(c => c.id === p.category)?.section !== scope.slice(2)) return;
      p.variants.forEach(v => v.price = roundTo(v.price, pct, step));
      p.price = p.variants.length ? p.variants[0].price : roundTo(p.price, pct, step); n++;
    });
    renderProducts(); changed(); f.reset(); $('#bulkPreview').textContent = '';
    toast(`${n} ürünün fiyatı güncellendi — yayınlamayı unutmayın`);
  });

  /* ---------- QR ---------- */
  function renderQR() { if (!$('#qrUrl').value) $('#qrUrl').value = new URL('../', location.href).href; drawQR(); }
  function qrTarget() { const u = $('#qrUrl').value.trim() || new URL('../', location.href).href; const l = $('#qrLang').value; return l ? u + (u.includes('?') ? '&' : '?') + 'lang=' + l : u; }
  function drawQR() {
    if (!window.QRCode) { $('#qrBox').textContent = 'QR kütüphanesi yüklenemedi (internet bağlantısını kontrol edin).'; return; }
    $('#qrBox').innerHTML = '';
    new QRCode($('#qrBox'), { text: qrTarget(), width: Number($('#qrSize').value), height: Number($('#qrSize').value), colorDark: '#1f1b16', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
  }
  ['#qrUrl', '#qrLang', '#qrSize'].forEach(s => $(s).addEventListener('change', drawQR));
  $('#qrDownload').addEventListener('click', () => {
    const c = $('#qrBox canvas'); if (!c) return;
    const pad = Math.round(c.width * .08), cap = Math.round(c.width * .09);
    const out = document.createElement('canvas'); out.width = c.width + pad * 2; out.height = c.height + pad * 2 + cap;
    const g = out.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, out.width, out.height);
    g.drawImage(c, pad, pad);
    g.fillStyle = '#1f1b16'; g.font = `700 ${Math.round(cap * .45)}px Manrope, sans-serif`; g.textAlign = 'center';
    g.fillText(`${S.data.settings.name.toUpperCase()} · MENU`, out.width / 2, c.height + pad + cap * .6);
    const a = document.createElement('a'); a.download = 'roof-lounge-qr-menu.png'; a.href = out.toDataURL('image/png'); a.click();
  });

  /* ---------- Ayarlar ---------- */
  const SETTING_KEYS = ['name', 'city', 'whatsapp', 'phone', 'instagram', 'wifiName', 'wifiPass', 'hours', 'address', 'mapsUrl', 'currency'];
  function renderSettings() {
    const s = S.data.settings, f = $('#settingsForm');
    SETTING_KEYS.forEach(k => f.elements[k].value = s[k] || '');
    $$('#settingsForm [data-ml]').forEach(box => {
      const k = box.dataset.ml, ta = box.hasAttribute('data-textarea');
      box.innerHTML = LANGS.map(l => `<label>${{ tr: 'Türkçe', en: 'English', ru: 'Русский' }[l]}${ta ? `<textarea name="${k}.${l}" rows="3">${esc(s[k]?.[l])}</textarea>` : `<input name="${k}.${l}" value="${esc(s[k]?.[l])}">`}</label>`).join('');
    });
    $('#sectionNames').innerHTML = S.data.sections.map(sec => `<div class="ml">${LANGS.map(l => `<label>${esc(sec.name.tr)} (${l.toUpperCase()})<input data-sec="${sec.id}" data-l="${l}" value="${esc(sec.name[l])}"></label>`).join('')}</div>`).join('');
  }
  $('#settingsForm').addEventListener('submit', e => {
    e.preventDefault(); const f = e.target, s = S.data.settings;
    SETTING_KEYS.forEach(k => s[k] = f.elements[k].value.trim());
    if (s.whatsapp) s.whatsapp = s.whatsapp.replace(/[^\d]/g, '');
    ['tagline', 'notice'].forEach(k => s[k] = Object.fromEntries(LANGS.map(l => [l, f.elements[`${k}.${l}`].value.trim()])));
    S.data.sections.forEach(sec => LANGS.forEach(l => { const v = $(`[data-sec="${sec.id}"][data-l="${l}"]`).value.trim(); if (v || l !== 'tr') sec.name[l] = v || sec.name.tr; }));
    renderSettings(); fillCategorySelects(); renderCategories(); renderBulk(); changed();
    toast('Ayarlar uygulandı — siteye göndermek için "Değişiklikleri Yayınla"ya basın');
  });
  $('#backupBtn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S.data, null, 1)], { type: 'application/json' }));
    a.download = `roof-menu-yedek-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  boot();
})();
