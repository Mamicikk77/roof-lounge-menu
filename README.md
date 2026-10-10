# Roof Lounge Cafe Alanya — QR Menü

**Canlı site:** https://mamicikk77.github.io/roof-lounge-menu/

- `index.html` — karşılama ekranı: arka planda video, **Menüyü Görüntüle**, WhatsApp / Wi-Fi / Instagram / Konum butonları
- `menu.html` — 3 dilli menü (TR / EN / RU): fiyat, ortalama kalori, porsiyon, 14 AB alerjeni, etiketler, arama ve alerjen filtresi
- `admin/` — menü yönetim paneli

Site tamamen statiktir ve GitHub Pages üzerinde ücretsiz çalışır.

## Panel nasıl çalışır?

Panel (`/admin/`) bir GitHub **erişim anahtarı (token)** ile açılır. Yaptığınız değişiklikler önce panelde birikir; **Değişiklikleri Yayınla** butonuna basınca `data/menu.json` bu depoya kaydedilir ve site yaklaşık 1 dakika içinde güncellenir. Fotoğraflar seçildiği anda `uploads/` klasörüne yüklenir.

### Erişim anahtarı oluşturma
1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. **Repository access:** *Only select repositories* → `roof-lounge-menu`
3. **Permissions → Repository permissions → Contents:** *Read and write*
4. Oluşturun ve panel giriş ekranına yapıştırın.

Personel için ayrı anahtar oluşturabilir, personel ayrıldığında GitHub'dan iptal edebilirsiniz.

### Panelde yapılabilenler
| Bölüm | Neler yapılır |
|---|---|
| Ürünler | Yeni ürün, düzenleme, silme; fotoğraf yükleme/kaldırma, listeden hızlı fiyat değiştirme, gizle/göster, “Tükendi”, sıralama |
| Ürün formu | TR/EN/RU ad ve açıklama, kategori, fiyat, kalori, porsiyon, alerjenler, etiketler, seçenekler (Tek/Duble, 35–70–100 cl, Normal/Ekstra Kafa) |
| Kategoriler | 3 dilde ad, ikon, bölüm, sıralama, gizleme |
| Toplu Fiyat | Tüm menüye / bölüme / kategoriye % zam veya indirim |
| QR Kod | Baskı kalitesinde QR PNG indirme |
| Ayarlar | WhatsApp, Wi-Fi, Instagram, Google Maps, telefon, adres, saatler, slogan ve notlar (3 dil), yedek indirme |

## Bilgisayarda önizleme

```bash
node dev-server.js
```
→ http://localhost:8080

## Dosyalar

- `data/menu.json` — tüm menü verisi
- `uploads/` — ürün fotoğrafları
- `assets/roof-lounge.mp4` — karşılama videosu
- `tools/` — eski adisyonix menüsünden aktarım betikleri (`build-seed.js` çalıştırılırsa menüyü sıfırdan üretir ve paneldeki değişikliklerin üzerine yazar)

> Kalori değerleri ortalama tahminlerdir. Alerjenler tipik tariflere göre girilmiştir; mutfağın gerçek tarif ve tedarikçi bilgilerine göre panelden kontrol edilmesi önerilir.
