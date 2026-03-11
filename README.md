# Translate Game

**KAPO GAMES** tarafından geliştirilen, Türkçe kelimelerin İngilizce fonetik yazımını tahmin etmeye dayanan 1v1 rekabetçi web oyunu.

---

## İçindekiler

- [Ürün Özeti](#ürün-özeti)
- [Ekran Akışı](#ekran-akışı)
- [Proje Yapısı](#proje-yapısı)
- [Sistem Mimarisi](#sistem-mimarisi)
- [Fonetik Skorlama Motoru](#fonetik-skorlama-motoru)
- [TTS (Text-to-Speech) Sistemi](#tts-text-to-speech-sistemi)
- [Kurulum ve Çalıştırma](#kurulum-ve-çalıştırma)
- [Railway Deploy](#railway-deploy)
- [Oynanış Mantığı](#oynanış-mantığı)
- [Geliştirici Notları](#geliştirici-notları)

---

## Ürün Özeti

Oyuncu bir Türkçe kelime görür, TTS butonuna basarak kelimenin Türkçe telaffuzunu dinler ve 60 saniye içinde bu sesi en iyi temsil eden İngilizce harf dizisini yazar. Sistem oyuncunun yazdığı metnin gerçek ses benzerliğini ölçer — yazım benzerliğini değil.

**Örnek:**
```
Kelime   : bahçe
TTS      : [Türkçe ses: "bahçe"]
Oyuncu   : "bacheh"
Beklenen : "bahche"
Skor     : 93 / 100  ← fonetik karşılaştırma
```

---

## Ekran Akışı

```
[Home] ──► [Matchmaking] ──► [Game] ──► [Result]
  │                              │
  └── kullanıcı adı giriş        └── 60s timer + TTS + input
```

| Ekran | Dosya | Görev |
|---|---|---|
| Home | `js/screens/home.js` | Kullanıcı adı girişi ve doğrulama |
| Matchmaking | `js/screens/matchmaking.js` | Eşleşme bekleme ekranı |
| Game | `js/screens/game.js` | Kelime, TTS, input, timer |
| Result | `js/screens/result.js` | Skor animasyonu, "Hear my answer" butonu |

---

## Proje Yapısı

```
translate-game/
├── index.html                  # Tüm ekranlar tek HTML, router ile yönetilir
├── package.json                # serve bağımlılığı (Railway için)
├── railway.json                # Railway build/deploy config
│
├── css/
│   ├── tokens.css              # Design token'ları (renkler, spacing, fontlar)
│   ├── base.css                # Reset ve global stiller
│   ├── components/             # Buton, kart, input, geçiş animasyonları
│   └── screens/                # Her ekrana özel stil dosyaları
│
└── js/
    ├── main.js                 # Uygulama giriş noktası, init
    ├── router.js               # Ekran geçişlerini yöneten SPA router
    ├── state.js                # Global uygulama durumu (username, currentWord…)
    ├── scoring.js              # Fonetik skorlama motoru (saf JS, DOM yok)
    ├── tts.js                  # Browser Web Speech API soyutlaması
    ├── timer.js                # 60 saniyelik countdown timer
    ├── screens/
    │   ├── home.js
    │   ├── matchmaking.js
    │   ├── game.js             # Oyun mantığı, submit, TTS trigger
    │   └── result.js           # Sonuç gösterimi, "Hear answer" TTS
    └── ui/
        ├── background.js       # Arkaplan animasyonları
        ├── onlineCounter.js    # Çevrimiçi oyuncu sayacı
        └── scoreAnimation.js   # Skor count-up animasyonu
```

---

## Sistem Mimarisi

Bu MVP tamamen **istemci taraflıdır**. Backend veya WebSocket bağlantısı henüz entegre edilmemiştir; rakip davranışı simüle edilmektedir.

```
┌─────────────────────────────────────────────────┐
│                  BROWSER (Client)               │
│                                                 │
│  index.html                                     │
│    └── router.js  ──►  screens/                 │
│         │                ├── home.js            │
│         │                ├── matchmaking.js     │
│         │                ├── game.js            │
│         │                │     ├── scoring.js   │
│         │                │     └── tts.js       │
│         │                └── result.js          │
│         │                      └── tts.js       │
│         └── state.js  (paylaşılan durum)        │
└─────────────────────────────────────────────────┘
```

**Veri akışı:**
1. `state.js` → `currentWord`, `username`, `opponentName` merkezi depoda tutulur
2. `game.js` → kelimeyi seçer, `setState()` ile kaydeder
3. Submit anında `scoring.js` → skor hesaplar
4. `showResult()` çağrılır, `result.js` ekranı doldurur

---

## Fonetik Skorlama Motoru

`js/scoring.js` — DOM bağımlılığı yoktur, Node.js üzerinde de çalışır.

### Pipeline

```
Turkish word             Player input
    │                        │
    ▼                        ▼
trToPhonemes()          enToPhonemes()
    │                        │
    ▼                        ▼
[b, a, h, tS, e]    [b, a, h, dZ, e, h]
         │                   │
         └───── phoneticDistance() ─────┘
                      │
                      ▼
              Weighted Levenshtein
                      │
                      ▼
                  0 – 100 skor
```

### Yazım Benzerliği vs Fonetik Benzerlik

| Yöntem | `bahche` | `bahjeh` | `sheker` |
|---|---|---|---|
| Eski (Levenshtein) | 100 | 57 ❌ | - |
| Yeni (fonetik) | 100 | **87** ✅ | ✅ |

`bahjeh` yazan oyuncu `dʒ` sesi üretiyor, `ç` ise `tʃ`. Bu iki ses aynı noktada üretilir, sadece tonlama farkı var. Maliyet **0.25** (tam ceza değil).

### Phoneme Sembolleri

| Sembol | IPA | Türkçe harf | İngilizce eşdeğer |
|---|---|---|---|
| `tS` | /tʃ/ | ç | `ch`, `tch` |
| `dZ` | /dʒ/ | c | `j`, `dj` |
| `S` | /ʃ/ | ş | `sh`, `sch` |
| `Z` | /ʒ/ | j | `zh` |
| `W` | /ɯ/ | ı | `i` (yaklaşık) |
| `O2` | /ø/ | ö | `o`, `oe` |
| `U2` | /y/ | ü | `u`, `ue` |
| `J` | /j/ | y | `y` |

### Ağırlıklı Levenshtein Maliyetleri

| İşlem | Maliyet |
|---|---|
| Aynı ses | 0.00 |
| Tonlama çifti (b/p, d/t, tS/dZ) | 0.25 |
| Aynı yer, farklı tür (tS/S) | 0.40 |
| Komşu ünlüler (i/e, u/o) | 0.30 |
| Eksik veya fazla ses | 0.75 |
| Tamamen farklı sesler | 1.00 |

### Maksimum Skor Normalizasyonu

```
maxDist = targetPhonemes.length × 0.75
score   = max(0, round((1 - dist / maxDist) × 100))
```

---

## TTS (Text-to-Speech) Sistemi

`js/tts.js` — Browser Web Speech API soyutlaması.

### Neden özel bir soyutlama?

Browser'lar sesleri asenkron yükler. `getVoices()` ilk çağrıda boş array döndürebilir (özellikle Firefox/Safari). Sesler hazır olmadan `SpeechSynthesisUtterance` oluşturulursa yanlış ses seçilir.

### Çözüm: `_loadVoices()`

```
İlk speak() çağrısı
       │
       ▼
_cachedVoices dolu mu? ──► Evet ──► Hemen kullan
       │
      Hayır
       │
       ▼
onvoiceschanged event bekle  (Firefox/Safari için)
       +
getVoices() hemen dene       (Chrome için)
       │
       ▼
Önbelleğe al, utterance oluştur
```

### API

| Fonksiyon | Dil | Rate | Kullanım |
|---|---|---|---|
| `speak(text)` | `tr-TR` | 0.78 | Oyun içi Türkçe kelime |
| `speakEnglish(text)` | `en-US` | 0.85 | Result ekranı — oyuncunun cevabını İngilizce seslet |
| `isSupported()` | — | — | TTS desteği kontrolü |

---

## Kurulum ve Çalıştırma

### Gereksinimler

- Node.js ≥ 18
- Modern browser (Chrome veya Edge önerilir — en iyi Türkçe TTS desteği için)

### Lokal Geliştirme

```bash
# Repoyu klonla
git clone https://github.com/cyber-emreclskn/fonetx.git
cd fonetx

# Bağımlılıkları yükle
npm install

# Sunucuyu başlat
npm start
```

Tarayıcıda `http://localhost:3000` adresini aç.

> `serve` paketi herhangi bir port'ta çalışabilir.  
> Port değiştirmek için: `npx serve . -l 5000`

### ES Modules

Proje `type="module"` script kullanır. `index.html`'yi doğrudan dosya sistemi üzerinden (`file://`) açmak CORS sorununa yol açar. Mutlaka bir HTTP sunucusu üzerinden çalıştır.

---

## Railway Deploy

Proje Railway için hazır yapılandırılmıştır.

### İlk deploy

1. [railway.app](https://railway.app) adresine GitHub hesabınla giriş yap
2. **New Project** → **Deploy from GitHub repo** seç
3. `fonetx` reposunu seç
4. Railway `package.json` ve `railway.json`'ı otomatik okur — ekstra ayar gerekmez
5. Deploy tamamlandıktan sonra **Settings → Domains → Generate Domain** ile ücretsiz URL al

### Nasıl çalışır?

```
Railway build  →  npm install
Railway start  →  serve . --listen $PORT
               ↑
               $PORT Railway tarafından otomatik atanır
```

### Konfigurasyon dosyaları

**`package.json`**
```json
{
  "scripts": {
    "start": "serve . --listen $PORT"
  },
  "dependencies": {
    "serve": "^14.2.4"
  }
}
```

**`railway.json`**
```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "serve . --listen $PORT",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## Oynanış Mantığı

```
1. Kullanıcı adı gir (3–20 karakter, harf/rakam/alt çizgi)
       │
       ▼
2. Matchmaking — eşleşme bekleniyor
       │
       ▼
3. Türkçe kelime ekranda belirir
       │
       ├── [LISTEN] butonuna bas → Türkçe TTS çalar (tekrar basılabilir)
       │
       ├── 60 saniye geri sayım başlar
       │
       └── İngilizce fonetik yazımını yaz → [SUBMIT] veya Enter
                 │                            veya süre dolunca otomatik
                 ▼
4. Sistem skorlar:
       oyuncunun cevabı → EN phoneme array
       Türkçe kelime    → TR phoneme array
       Ağırlıklı Levenshtein → 0–100 skor
                 │
                 ▼
5. Result ekranı:
       - WIN / LOSE / DRAW
       - Her iki oyuncunun skoru (count-up animasyonu)
       - [HEAR MY ANSWER] → yazdığın metni İngilizce TTS ile seslet
```

---

## Geliştirici Notları

### State yönetimi

`js/state.js` basit bir JavaScript objesi — framework yok. Tüm ekranlar `getState()` / `setState()` üzerinden paylaşır.

### Router

`js/router.js` — `navigateTo('screen-game')` çağrısı ilgili `.screen` elementini gösterip diğerlerini gizler. Sayfa yenilenmez.

### Simüle rakip

Gerçek WebSocket altyapısı kurulmadan önce rakip davranışı `game.js` içinde simüle edilir:
- Rastgele submit zamanı: 20–50 saniye arası
- Rastgele skor: `transliterate(word)` üzerinden hafif modifiye edilmiş cevap

### Sonraki adımlar

- [ ] WebSocket / Socket.IO backend entegrasyonu
- [ ] Gerçek matchmaking kuyruğu
- [ ] Sunucu taraflı skorlama (scoring.js Node.js'de değişmeden çalışır)
- [ ] Kelime bankası ve zorluk seviyeleri
- [ ] Skor tablosu

---

## Lisans

KAPO GAMES — Tüm hakları saklıdır.
