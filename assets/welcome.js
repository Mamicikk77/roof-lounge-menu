(() => {
  const { esc } = window.RL;
  const $ = s => document.querySelector(s);
  const UI = {
    tr: { kicker: 'Hoş geldiniz', menu: 'Menüyü Görüntüle', map: 'Konum', wifiName: 'Ağ adı', wifiPass: 'Şifre', copy: 'Kopyala', copied: 'Şifre kopyalandı', noWifi: 'Wi-Fi bilgisi için lütfen personelimize danışın.', soon: 'Bu bilgi yakında eklenecek.' },
    en: { kicker: 'Welcome', menu: 'View Menu', map: 'Location', wifiName: 'Network', wifiPass: 'Password', copy: 'Copy', copied: 'Password copied', noWifi: 'Please ask our staff for the Wi-Fi details.', soon: 'Coming soon.' },
    ru: { kicker: 'Добро пожаловать', menu: 'Открыть меню', map: 'На карте', wifiName: 'Сеть', wifiPass: 'Пароль', copy: 'Копировать', copied: 'Пароль скопирован', noWifi: 'Данные Wi-Fi уточните у персонала.', soon: 'Скоро появится.' },
  };
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const detect = () => { const n = (navigator.language || 'tr').slice(0, 2); return ['tr', 'en', 'ru'].includes(n) ? n : (['uk', 'be', 'kk'].includes(n) ? 'ru' : 'en'); };
  const qs = new URLSearchParams(location.search).get('lang');
  let lang = ['tr', 'en', 'ru'].includes(qs) ? qs : (store.get('rl_lang') || detect());
  let S = null;
  const t = k => UI[lang][k];
  const L = o => (o && (o[lang] || o.tr)) || '';

  let toastT;
  const toast = m => { const el = $('#toast'); el.textContent = m; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2200); };

  function links() {
    const wa = (S?.whatsapp || '').replace(/[^\d]/g, '');
    $('#waBtn').href = wa ? `https://wa.me/${wa}` : '#';
    const ig = (S?.instagram || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
    $('#igBtn').href = ig ? `https://instagram.com/${ig}` : '#';
    const map = S?.mapsUrl?.trim() || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${S?.name || 'Roof Lounge Cafe'} ${S?.city || 'Alanya'}`));
    $('#mapBtn').href = map;
  }

  function render() {
    document.documentElement.lang = lang;
    document.querySelectorAll('.langs button').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
    $('#kicker').textContent = t('kicker');
    $('#menuLabel').textContent = t('menu');
    $('#mapLabel').textContent = t('map');
    $('#menuBtn').href = 'menu.html?lang=' + lang;
    if (S) {
      $('#brandName').textContent = S.name.replace(/^Roof\s*/i, '') || S.name;
      $('#brandCity').textContent = S.city || '';
      $('#tagline').textContent = L(S.tagline);
    }
  }

  function openWifi() {
    const name = S?.wifiName, pass = S?.wifiPass;
    $('#wifiBody').innerHTML = name || pass
      ? `${name ? `<div class="wifi-row"><div><span>${t('wifiName')}</span><b>${esc(name)}</b></div></div>` : ''}
         ${pass ? `<div class="wifi-row"><div><span>${t('wifiPass')}</span><b>${esc(pass)}</b></div><button class="copy" id="copyPass">${t('copy')}</button></div>` : ''}`
      : `<p class="note">${t('noWifi')}</p>`;
    $('#wifiSheet').hidden = false;
  }

  document.querySelector('.langs').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    lang = b.dataset.lang; store.set('rl_lang', lang); render();
  });
  $('#wifiBtn').addEventListener('click', openWifi);
  $('#wifiSheet').addEventListener('click', async e => {
    if (e.target.closest('[data-close]')) $('#wifiSheet').hidden = true;
    if (e.target.id === 'copyPass') { try { await navigator.clipboard.writeText(S.wifiPass); toast(t('copied')); } catch {} }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#wifiSheet').hidden = true; });
  ['#waBtn', '#igBtn'].forEach(sel => $(sel).addEventListener('click', e => { if ($(sel).getAttribute('href') === '#') { e.preventDefault(); toast(t('soon')); } }));
  $('#menuBtn').addEventListener('click', () => store.set('rl_lang', lang));

  // Hareket azaltma tercihinde videoyu durdur
  const v = $('#bgVideo');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { v.removeAttribute('autoplay'); v.pause(); }
  else v.play?.().catch(() => {});

  render(); links();
  fetch('data/menu.json?v=' + Date.now()).then(r => r.json()).then(d => { S = d.settings; render(); links(); }).catch(() => {});
})();
