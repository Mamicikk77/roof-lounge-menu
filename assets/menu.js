(() => {
  const { allergens: AL, tags: TG, money, esc } = window.RL;
  const $ = s => document.querySelector(s);

  const UI = {
    tr: { search: 'Ürün ara…', cancel: 'Vazgeç', filters: 'Filtreler', diet: 'Beslenme', allergenEx: 'Şunları içermesin', allergenHint: 'Seçtiğiniz alerjenleri içeren ürünler gizlenir.', clear: 'Temizle', apply: 'Uygula', kcal: 'Kalori', portion: 'Porsiyon', allergens: 'Alerjenler', noAllergen: 'Bilinen alerjen içermez', noResult: 'Sonuç bulunamadı', noResultHint: 'Aramanızı veya filtreleri değiştirmeyi deneyin.', items: 'ürün', soldOut: 'Tükendi', from: '', age: 'Alkollü içecekler ve nargile 18 yaş altına satılmaz.', disclaimer: 'Kalori değerleri ortalama tahmini değerlerdir. Alerjen bilgileri tedarikçi bilgilerine dayanır; çapraz bulaşma riski için lütfen personelimize danışın.', info: 'İşletme Bilgileri', phone: 'Telefon', address: 'Adres', hours: 'Çalışma Saatleri', wifi: 'Wi-Fi', password: 'Şifre', copy: 'Kopyala', copied: 'Kopyalandı', updated: 'Son güncelleme', results: 'Arama sonuçları' },
    en: { search: 'Search the menu…', cancel: 'Cancel', filters: 'Filters', diet: 'Diet', allergenEx: 'Exclude allergens', allergenHint: 'Items containing the selected allergens will be hidden.', clear: 'Clear', apply: 'Apply', kcal: 'Calories', portion: 'Portion', allergens: 'Allergens', noAllergen: 'No known allergens', noResult: 'No results', noResultHint: 'Try a different search or adjust filters.', items: 'items', soldOut: 'Sold out', from: '', age: 'Alcohol and hookah are not served to under-18s.', disclaimer: 'Calorie values are average estimates. Allergen information is based on supplier data; please ask our staff about cross-contamination.', info: 'Information', phone: 'Phone', address: 'Address', hours: 'Opening Hours', wifi: 'Wi-Fi', password: 'Password', copy: 'Copy', copied: 'Copied', updated: 'Last updated', results: 'Search results' },
    ru: { search: 'Поиск по меню…', cancel: 'Отмена', filters: 'Фильтры', diet: 'Питание', allergenEx: 'Исключить аллергены', allergenHint: 'Блюда с выбранными аллергенами будут скрыты.', clear: 'Сбросить', apply: 'Применить', kcal: 'Калории', portion: 'Порция', allergens: 'Аллергены', noAllergen: 'Без известных аллергенов', noResult: 'Ничего не найдено', noResultHint: 'Измените запрос или фильтры.', items: 'поз.', soldOut: 'Нет в наличии', from: '', age: 'Алкоголь и кальян не продаются лицам младше 18 лет.', disclaimer: 'Калорийность указана приблизительно. Информация об аллергенах основана на данных поставщиков; о перекрёстном контакте уточняйте у персонала.', info: 'Информация', phone: 'Телефон', address: 'Адрес', hours: 'Часы работы', wifi: 'Wi-Fi', password: 'Пароль', copy: 'Копировать', copied: 'Скопировано', updated: 'Обновлено', results: 'Результаты поиска' },
  };

  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const detectLang = () => { const n = (navigator.language || 'tr').slice(0, 2); return ['tr', 'en', 'ru'].includes(n) ? n : (n === 'uk' || n === 'be' || n === 'kk' ? 'ru' : 'en'); };
  const qsLang = new URLSearchParams(location.search).get('lang');

  const S = {
    data: null,
    lang: ['tr', 'en', 'ru'].includes(qsLang) ? qsLang : (store.get('rl_lang') || detectLang()),
    section: null,
    q: '',
    exclude: new Set(),
    diet: new Set(),
  };
  const t = k => UI[S.lang][k];
  const L = o => (o && (o[S.lang] || o.tr)) || '';

  /* ---------- Yükleme ---------- */
  async function load() {
    try {
      const r = await fetch('data/menu.json?v=' + Date.now());
      S.data = await r.json();
      S.section = S.data.sections.find(s => S.data.categories.some(c => c.section === s.id))?.id;
      renderAll();
    } catch {
      $('#list').innerHTML = '<div class="empty"><b>:(</b>Menü yüklenemedi / Menu could not be loaded</div>';
    }
  }

  /* ---------- Filtreler ---------- */
  const passes = p => {
    if (S.diet.has('vegan') && !p.tags.includes('vegan')) return false;
    if (S.diet.has('veg') && !(p.tags.includes('veg') || p.tags.includes('vegan'))) return false;
    if (S.diet.has('noalc') && p.tags.includes('alc')) return false;
    for (const a of S.exclude) if (p.allergens.includes(a)) return false;
    if (S.q) {
      const hay = [p.name.tr, p.name.en, p.name.ru, p.desc.tr, p.desc.en, p.desc.ru].join(' ').toLocaleLowerCase('tr');
      if (!S.q.split(/\s+/).every(w => hay.includes(w))) return false;
    }
    return true;
  };

  /* ---------- Render ---------- */
  function renderAll() {
    document.documentElement.lang = S.lang;
    document.querySelectorAll('.langs button').forEach(b => b.classList.toggle('on', b.dataset.lang === S.lang));
    const st = S.data.settings;
    $('#brandName').textContent = st.name.replace(/^Roof\s*/i, '') || st.name;
    $('#brandCity').textContent = st.city || '';
    $('#tagline').textContent = L(st.tagline);
    $('#notice').textContent = L(st.notice);
    $('#footMeta').textContent = S.data.updatedAt ? `${t('updated')}: ${new Date(S.data.updatedAt).toLocaleDateString(S.lang === 'en' ? 'en-GB' : S.lang)}` : '';
    $('#searchInput').placeholder = t('search');
    $('#searchClose').textContent = t('cancel');
    $('#filterDot').hidden = !(S.exclude.size || S.diet.size);
    renderSections();
    renderList();
  }

  function renderSections() {
    const secs = S.data.sections.filter(s => S.data.categories.some(c => c.section === s.id));
    $('#sections').innerHTML = secs.map(s => `<button role="tab" data-sec="${s.id}" class="${s.id === S.section && !S.q ? 'on' : ''}">${esc(L(s.name))}</button>`).join('');
  }

  function itemHTML(p, cat) {
    const cur = S.data.settings.currency;
    const img = p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" decoding="async">` : `<div class="ph">${esc(cat?.icon || '🍽')}</div>`;
    const priceTxt = p.variants.length > 1 ? `<small>${esc(L(p.variants[0].label))}</small>${money(p.variants[0].price, cur)}` : money(p.price, cur);
    const badges = [
      p.soldOut ? `<span class="badge sold">${t('soldOut')}</span>` : '',
      ...p.tags.filter(x => x !== 'alc').slice(0, 2).map(x => `<span class="badge ${x}">${TG[x].i} ${esc(TG[x][S.lang])}</span>`),
    ].join('');
    const kcal = p.kcal != null && p.kcal !== '' ? `<span class="kcal">🔥 ${p.kcal} kcal</span>` : '';
    const al = p.allergens.slice(0, 5).map(a => `<span class="al-ico" title="${esc(AL[a][S.lang])}">${AL[a].i}</span>`).join('');
    return `<button class="item${p.soldOut ? ' sold' : ''}" data-id="${p.id}">
      <div class="thumb">${img}</div>
      <div class="item-main">
        <div class="item-top"><h3>${esc(L(p.name))}</h3><span class="price">${priceTxt}</span></div>
        ${L(p.desc) ? `<p>${esc(L(p.desc))}</p>` : ''}
        <div class="meta">${badges}${kcal}${al}</div>
      </div></button>`;
  }

  function renderList() {
    const { categories, products } = S.data;
    const cats = S.q ? categories : categories.filter(c => c.section === S.section);
    let html = '', chips = '';
    for (const c of cats) {
      const items = products.filter(p => p.category === c.id && passes(p));
      if (!items.length) continue;
      chips += `<button class="chip" data-cat="${c.id}">${esc(c.icon || '')} ${esc(L(c.name))}</button>`;
      const ageNote = !S.q && (c.section === 'bar' || c.section === 'hookah') && c === cats.find(x => x.section === c.section) ? `<div class="age-note"><b>18+</b>${t('age')}</div>` : '';
      html += `<section class="cat" id="c-${c.id}" data-cat="${c.id}">
        <div class="cat-head"><h2>${esc(L(c.name))}</h2><span class="count">${items.length} ${t('items')}</span></div>${ageNote}
        ${items.map(p => itemHTML(p, c)).join('')}</section>`;
    }
    $('#list').innerHTML = html || `<div class="empty"><b>${t('noResult')}</b>${t('noResultHint')}</div>`;
    $('#chips').innerHTML = chips;
    observe();
  }

  /* ---------- Kategori takibi (scrollspy) ---------- */
  let io;
  function observe() {
    io && io.disconnect();
    io = new IntersectionObserver(entries => {
      const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!vis) return;
      const id = vis.target.dataset.cat;
      document.querySelectorAll('.chip').forEach(ch => {
        const on = ch.dataset.cat === id; ch.classList.toggle('on', on);
        if (on) { const box = $('#chips'); box.scrollTo({ left: ch.offsetLeft - box.clientWidth / 2 + ch.clientWidth / 2 }); }
      });
    }, { rootMargin: '-140px 0px -60% 0px' });
    document.querySelectorAll('.cat').forEach(s => io.observe(s));
  }

  /* ---------- Sheets ---------- */
  function openSheet(id) { $(id).hidden = false; document.body.classList.add('lock'); }
  function closeSheets() { document.querySelectorAll('.sheet').forEach(s => s.hidden = true); document.body.classList.remove('lock'); }
  document.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheets(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheets(); });

  function openProduct(id) {
    const p = S.data.products.find(x => x.id === id); if (!p) return;
    const cat = S.data.categories.find(c => c.id === p.category);
    const cur = S.data.settings.currency;
    const media = $('#pdMedia');
    media.classList.toggle('no-img', !p.image);
    media.innerHTML = p.image ? `<img src="${esc(p.image)}" alt="${esc(L(p.name))}">` : `<div class="ph">${esc(cat?.icon || '🍽')}</div>`;
    $('#pdTags').innerHTML = [p.soldOut ? `<span class="badge sold">${t('soldOut')}</span>` : '', ...p.tags.map(x => `<span class="badge ${x}">${TG[x].i} ${esc(TG[x][S.lang])}</span>`)].join('');
    $('#pdName').textContent = L(p.name);
    $('#pdDesc').textContent = L(p.desc);
    $('#pdDesc').hidden = !L(p.desc);
    $('#pdPrices').innerHTML = (p.variants.length ? p.variants : [{ label: null, price: p.price }])
      .map(v => `<div class="row"><span>${v.label ? esc(L(v.label)) : esc(L(p.name))}</span><b>${money(v.price, cur)}</b></div>`).join('');
    const facts = [];
    if (p.kcal != null && p.kcal !== '') facts.push(`<div class="fact"><span>${t('kcal')}</span><b>~${p.kcal} kcal</b></div>`);
    if (p.portion) facts.push(`<div class="fact"><span>${t('portion')}</span><b>${esc(p.portion)}</b></div>`);
    $('#pdFacts').innerHTML = facts.join('');
    const showAl = cat?.section !== 'hookah';
    $('#pdAllergens').innerHTML = showAl ? `<h3>${t('allergens')}</h3>` + (p.allergens.length
      ? `<ul>${p.allergens.map(a => `<li><span>${AL[a].i}</span>${esc(AL[a][S.lang])}</li>`).join('')}</ul>`
      : `<div class="none">✓ ${t('noAllergen')}</div>`) + `<p class="disclaimer">${t('disclaimer')}</p>` : '';
    openSheet('#productSheet');
    $('#productSheet .sheet-panel').scrollTop = 0;
  }

  function renderFilter() {
    $('#fTitle').textContent = t('filters');
    $('#fDietTitle').textContent = t('diet');
    $('#fAllergenTitle').textContent = t('allergenEx');
    $('#fAllergenHint').textContent = t('allergenHint');
    $('#fClear').textContent = t('clear');
    $('#fApply').textContent = t('apply');
    const noalc = { i: '🚫', tr: 'Alkolsüz', en: 'Alcohol-free', ru: 'Без алкоголя' };
    $('#fDiet').innerHTML = [['veg', TG.veg], ['vegan', TG.vegan], ['noalc', noalc]].map(([k, v]) =>
      `<button class="tgl${S.diet.has(k) ? ' on' : ''}" data-diet="${k}"><span>${v.i}</span>${esc(v[S.lang])}</button>`).join('');
    $('#fAllergens').innerHTML = Object.entries(AL).map(([k, v]) =>
      `<button class="tgl ex${S.exclude.has(k) ? ' on' : ''}" data-al="${k}"><span>${v.i}</span>${esc(v[S.lang])}</button>`).join('');
  }

  function renderInfo() {
    const s = S.data.settings;
    const rows = [];
    if (s.phone) rows.push(`<div class="info-row"><div class="ico">📞</div><div><span>${t('phone')}</span><a href="tel:${esc(s.phone.replace(/\s/g, ''))}">${esc(s.phone)}</a></div></div>`);
    const wa = (s.whatsapp || '').replace(/[^\d]/g, '');
    if (wa) rows.push(`<div class="info-row"><div class="ico">💬</div><div><span>WhatsApp</span><a href="https://wa.me/${wa}" target="_blank" rel="noopener">+${esc(wa)}</a></div></div>`);
    if (s.address) rows.push(`<div class="info-row"><div class="ico">📍</div><div><span>${t('address')}</span><a href="${esc(s.mapsUrl || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.name + ' ' + s.address))}" target="_blank" rel="noopener">${esc(s.address)}</a></div></div>`);
    if (s.hours) rows.push(`<div class="info-row"><div class="ico">🕒</div><div><span>${t('hours')}</span>${esc(s.hours)}</div></div>`);
    if (s.wifiName) rows.push(`<div class="info-row"><div class="ico">📶</div><div><span>${t('wifi')}</span>${esc(s.wifiName)}${s.wifiPass ? `<br><span>${t('password')}</span>${esc(s.wifiPass)}` : ''}</div>${s.wifiPass ? `<button class="copy" data-copy="${esc(s.wifiPass)}">${t('copy')}</button>` : ''}</div>`);
    if (s.instagram) rows.push(`<div class="info-row"><div class="ico">📷</div><div><span>Instagram</span><a href="https://instagram.com/${esc(s.instagram.replace(/^@/, ''))}" target="_blank" rel="noopener">@${esc(s.instagram.replace(/^@/, ''))}</a></div></div>`);
    $('#infoBody').innerHTML = `<h2>${esc(s.name)}</h2><p class="muted">${esc(L(s.tagline))}</p>${rows.join('')}`;
  }

  /* ---------- Olaylar ---------- */
  document.querySelector('.langs').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    S.lang = b.dataset.lang; store.set('rl_lang', S.lang); renderAll();
  });
  $('#sections').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    S.section = b.dataset.sec;
    if (S.q) { S.q = ''; $('#searchInput').value = ''; $('#searchbar').hidden = true; }
    renderSections(); renderList();
    window.scrollTo({ top: $('#sticky').offsetTop, behavior: 'smooth' });
  });
  $('#chips').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    const el = document.getElementById('c-' + b.dataset.cat);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - $('#sticky').offsetHeight + 4, behavior: 'smooth' });
  });
  $('#list').addEventListener('click', e => { const b = e.target.closest('.item'); if (b) openProduct(b.dataset.id); });
  $('#searchBtn').addEventListener('click', () => { $('#searchbar').hidden = false; $('#searchInput').focus(); });
  $('#searchClose').addEventListener('click', () => { S.q = ''; $('#searchInput').value = ''; $('#searchbar').hidden = true; renderSections(); renderList(); });
  let tmr;
  $('#searchInput').addEventListener('input', e => {
    clearTimeout(tmr);
    tmr = setTimeout(() => { S.q = e.target.value.trim().toLocaleLowerCase('tr'); renderSections(); renderList(); }, 150);
  });
  $('#filterBtn').addEventListener('click', () => { renderFilter(); openSheet('#filterSheet'); });
  $('#filterSheet').addEventListener('click', e => {
    const d = e.target.closest('[data-diet]'), a = e.target.closest('[data-al]');
    if (d) { const k = d.dataset.diet; S.diet.has(k) ? S.diet.delete(k) : S.diet.add(k); }
    if (a) { const k = a.dataset.al; S.exclude.has(k) ? S.exclude.delete(k) : S.exclude.add(k); }
    if (e.target.id === 'fClear') { S.diet.clear(); S.exclude.clear(); }
    if (d || a || e.target.id === 'fClear') { renderFilter(); renderList(); $('#filterDot').hidden = !(S.exclude.size || S.diet.size); }
  });
  $('#infoBtn').addEventListener('click', () => { renderInfo(); openSheet('#infoSheet'); });
  $('#infoSheet').addEventListener('click', async e => {
    const b = e.target.closest('[data-copy]'); if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = t('copied'); } catch {}
  });

  load();
})();
