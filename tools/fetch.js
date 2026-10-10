// Eski adisyonix menüsünden ürünleri ve fotoğrafları çeker (tek seferlik)
const fs = require('fs'), path = require('path');
const out = path.join(__dirname, 'raw.json');
const up = path.join(__dirname, '..', 'public', 'uploads');
const Q = 'qr_id=wPRg4Ou16d&dil_id=0', B = 'https://menu.adisyonix.com/api/';
const H = { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' };
(async () => {
  const all = [];
  for (const k of [3, 6, 9]) {
    const g = await (await fetch(`${B}groups?kategori_id=${k}&${Q}`, { headers: H })).json();
    for (const gr of g.data) {
      const p = await (await fetch(`${B}products?grup_id=${gr.id}&${Q}`, { headers: H })).json();
      for (const x of p.data || []) {
        let img = null;
        if (x.resim_url) {
          const r = await fetch(x.resim_url);
          if (r.ok) { img = `old-${x.stok_id}.webp`; fs.writeFileSync(path.join(up, img), Buffer.from(await r.arrayBuffer())); }
        }
        all.push({ id: x.stok_id, oldGroup: gr.grup_adi, name: x.stok_adi, price: x.fiyat, img });
      }
    }
  }
  fs.writeFileSync(out, JSON.stringify(all, null, 1));
  console.log(all.length, 'ürün,', all.filter(a => a.img).length, 'fotoğraf');
})();
