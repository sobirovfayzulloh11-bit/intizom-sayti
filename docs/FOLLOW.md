# FOLLOW — MOON Social

## Modul nima qiladi
Foydalanuvchilar bir-birini kuzatishi (follow/unfollow) va faqat kuzatilganlar postlarini ko'rsatuvchi "Following" lentasi.

## Fayllar
- `src/routes/follow.js` — follow/unfollow, status, following-feed API'lari
- `public/script.js` — Discover/Following tab, Follow tugmasi mantiqi

## API'lar
| Yo'l | Metod | Tavsif | Auth kerakmi |
|---|---|---|---|
| /api/follow | POST | Kuzatish/bekor qilish (toggle), body: {username} | Ha |
| /api/follow/status | GET | Follower/following soni va holatni qaytaradi (?username=) | Yo'q (lekin isFollowing faqat kirgan bo'lsa) |
| /api/feed/following | GET | Faqat kuzatilgan foydalanuvchilar postlari | Ha |

## Database jadvallari
`follows` (follower_id, following_id, UNIQUE juftlik) — DATABASE.md da batafsil

## Bog'lanishlar
- `profile.js` bilan bog'liq — profil sahifasida Follow tugmasi ko'rsatiladi
- `posts.js` bilan bog'liq — following-feed postlarni oladi

## Kelajakdagi kengaytirish
- Notifications: kimdir kuzatganda bildirishnoma
- "Tavsiya etilgan foydalanuvchilar" — follow grafigi asosida taklif
- Follower/Following ro'yxatini ko'rish sahifasi (hozircha faqat son ko'rsatiladi)
