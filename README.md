# Video Hızlandırıcı — Chrome Eklentisi

Hız kontrolü olmayan sitelerdeki videoları hızlandır veya yavaşlat. `<video>` kullanan tüm sitelerde, Shadow DOM ve iframe içindeki videolarda çalışır.

## Kurulum

1. `chrome://extensions/` adresine git
2. Sağ üstten **Geliştirici modu**nu aç
3. **Paketlenmemiş öğe yükle** butonuna tıkla
4. Bu klasörü seç

## Kullanım

### Klavye Kısayolları

| Tuş | İşlev |
|-----|-------|
| `D` | Hızı 0.25x artır |
| `S` | Hızı 0.25x azalt |
| `R` | Hızı sıfırla (1.00x) |

> Kısayollar `Ctrl`, `Alt` veya `Meta` ile birlikte basıldığında çalışmaz — tarayıcı kısayolları korunur.

### Popup Arayüzü

Eklenti ikonuna tıklayarak:
- Slider ile hassas hız ayarı
- Hazır preset butonları: 0.5x → 16x
- − 0.25 / + 0.25 adım butonları

### Ekran Overlay'i

Hız değiştiğinde sağ üst köşede yarı saydam bir gösterge çıkar ve 1.5 saniye sonra kaybolur.

### Hız Hafızası

Her site için hız ayrı ayrı kaydedilir. Aynı siteye tekrar girdiğinde son kullandığın hız otomatik uygulanır.

## Teknik Detaylar

- Shadow DOM içindeki videolar desteklenir
- `all_frames: true` ile iframe içindeki videolar da yakalanır
- Cross-origin iframe'ler tarayıcı güvenlik politikası gereği desteklenemez
- Sayfaya sonradan eklenen videolar MutationObserver ile otomatik yakalanır

## Dosya Yapısı

```
video hızlandırıcı/
├── manifest.json
├── content.js
├── popup.html
├── popup.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```
