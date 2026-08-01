# MOON Design System

## Falsafa
Apple minimalizmi + Instagram soddaligi + Telegram tezligi + Notion tartibliligi.
Kontent hech qachon fon bilan raqobat qilmaydi.

## Fayl
`public/design-tokens.css` — barcha loyihada ulanadigan yagona manba.
Har bir yangi sahifa/komponent shu fayldagi klass va o'zgaruvchilardan foydalanishi SHART.

## Ranglar (CSS o'zgaruvchilar)
| Token | Qiymat | Vazifa |
|---|---|---|
| --md-bg | #FFFFFF | Fon |
| --md-primary | #6C5CE7 | Asosiy tugmalar, aksent |
| --md-secondary | #A855F7 | Ikkinchi darajali aksent |
| --md-accent | #FF6EC7 | Maxsus urg'u |
| --md-text-primary | #111111 | Asosiy matn |
| --md-text-secondary | #666666 | Ikkinchi darajali matn |
| --md-border | #ECECEC | Chegara chiziqlari |
| --md-success/warning/danger | yashil/sariq/qizil | Holat xabarlari |

## Radius
sm=12px, md=18px, lg=24px — `--md-radius-sm/md/lg`

## Spacing (8px tizimi)
8, 16, 24, 32, 48, 64 — `--md-sp-1` dan `--md-sp-8` gacha

## Komponentlar
- `.md-card` — oq karta, yumshoq soya, katta radius
- `.md-btn` + `.md-btn-primary` / `.md-btn-secondary` — 52px balandlik, gradientsiz
- `.md-input` — 52px balandlik, standart border
- `.md-h1`, `.md-h2`, `.md-text-secondary` — tipografiya
- `.md-icon` — SVG ikonkalar uchun umumiy o'lcham (22x22)

## Qoidalar
1. Emoji ishlatilmaydi — faqat SVG ikonka
2. Gradient tugmalarda ishlatilmaydi (faqat fon dekorida ruxsat)
3. Qattiq (hard) shadow yo'q — faqat `--md-shadow`
4. Animatsiya 200-300ms, `--md-ease` bilan
5. Eski komponentlar "bo'yalmaydi" — kerak bo'lsa qayta yoziladi

## Holat
Home sahifasi hali eski uslubda (`style.css`). Keyingi bosqichda shu tizim asosida qayta quriladi.
