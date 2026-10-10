# Roof Lounge Cafe Alanya — QR Menü

Müşteriler için 3 dilli (Türkçe / English / Русский) dijital menü ve işletme için menü yönetim paneli.

- **Menü:** `/` — fiyatlar, ortalama kaloriler, porsiyon, 14 AB alerjeni, vejetaryen/vegan/acı/alkollü etiketleri, arama ve alerjen filtresi
- **Panel:** `/admin/` — ürün ekleme/silme, fotoğraf yükleme/kaldırma, fiyat, açıklama, alerjen, kalori, çeviri, kategori yönetimi, toplu zam, QR kod, kullanıcılar

Harici paket gerektirmez; sadece **Node.js 18+** yeterli.

## Çalıştırma

```bash
node server.js
```

- Menü: http://localhost:3000
- Panel: http://localhost:3000/admin/

İlk çalıştırmada bir yönetici hesabı oluşturulur ve giriş bilgileri **`data/ilk-giris.txt`** dosyasına yazılır. Giriş yaptıktan sonra **Ayarlar → Hesabım** bölümünden şifreyi değiştirin ve bu dosyayı silin.

Farklı port için: `PORT=8080 node server.js`

## Panel özellikleri

| Bölüm | Neler yapılır |
|---|---|
| Ürünler | Yeni ürün, düzenleme, silme; fotoğraf yükleme (otomatik küçültülür), listeden hızlı fiyat değiştirme, gizle/göster, “Tükendi” işareti, sıralama |
| Ürün formu | TR/EN/RU ad ve açıklama, kategori, fiyat, kalori, porsiyon, alerjenler, etiketler, birden fazla seçenek (Tek/Duble, 35–70–100 cl, Normal/Ekstra Kafa) |
| Kategoriler | 3 dilde ad, ikon, bölüm (Yiyecek/İçecek/Bar/Nargile), sıralama, gizleme |
| Toplu Fiyat | Tüm menüye, bir bölüme ya da kategoriye % zam/indirim (5 ₺'ye yuvarlama) |
| QR Kod | Menü adresinin QR kodunu baskı kalitesinde PNG olarak indirme |
| Ayarlar | İşletme bilgileri, Wi-Fi, telefon, adres, slogan/alt not (3 dil), şifre, kullanıcılar, yedek indirme |

**Yetkiler:** *İşletme sahibi* her şeyi yapabilir. *Personel* ürün ve kategori düzenleyebilir; ayarlar, kullanıcılar ve toplu fiyat değişikliğine erişemez.

## Veriler nerede?

- `data/menu.json` — tüm menü (ürünler, fiyatlar, çeviriler, ayarlar)
- `data/users.json` — panel kullanıcıları (şifreler şifrelenmiş saklanır)
- `public/uploads/` — ürün fotoğrafları

Yedek almak için bu üç yeri kopyalamanız yeterli (panelden **Ayarlar → Yedeği İndir** de kullanılabilir).

## Yayına alma

QR'ın her yerden açılması için sunucunun internette olması gerekir. Önemli: panelden yapılan değişiklikler `data/` ve `public/uploads/` klasörlerine yazıldığı için **kalıcı diski olan** bir sunucu seçin.

- **VPS (önerilen; ör. DigitalOcean, Hetzner, Turhost VPS):** projeyi kopyalayın, `node server.js`'i `pm2` ile sürekli çalıştırın, önüne Nginx + ücretsiz SSL (Let's Encrypt) koyun.
- **Render / Railway:** “persistent disk / volume” ekleyip `data` ve `public/uploads` klasörlerini o diske bağlayın.

HTTPS arkasında çalışırken (Nginx vb.) `X-Forwarded-Proto` başlığı iletilirse oturum çerezi otomatik olarak `Secure` işaretlenir.

Alan adı belli olunca panelde **QR Kod** sekmesine alan adını yazıp QR'ı indirin. Menü içeriği değişse de QR adresi aynı kaldığı için basılı QR'lar geçerli kalır.

## Eski menüden aktarım

Ürünler, fiyatlar ve fotoğraflar eski adisyonix QR menüsünden alındı (`tools/fetch.js` → `tools/raw.json`) ve doğru kategorilere ayrıldı. Eski sistemde grup adları ürünlerle karışıktı (ör. “PİZZALAR” grubunda Türk kahveleri vardı); yeni menüde hepsi doğru kategoride.

Aynı ürünün şeker tercihine göre ayrı kayıtları (sade/orta/şekerli) tek üründe birleştirildi; şişe boyları ve tek/duble seçenekleri tek ürün altında listeleniyor. Stok kalemleri (hammadde) ve “Personel Yemeği” gibi iç kalemler menüye alınmadı.

`tools/build-seed.js` menüyü sıfırdan üretir — **dikkat:** çalıştırırsanız panelde yapılan tüm değişikliklerin üzerine yazar.

> Kalori değerleri ortalama tahminlerdir. Alerjenler tipik tariflere göre girilmiştir; mutfağınızın gerçek tarif ve tedarikçi bilgilerine göre panelden kontrol edip güncellemeniz önerilir.
