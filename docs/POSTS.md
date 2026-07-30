# POSTS — MOON Social

## Modul nima qiladi
Foydalanuvchilar rasm bilan post yaratadi, umumiy lentada ko'radi, layk bosadi va izoh qoldiradi.

## Fayllar
- `src/routes/posts.js` — barcha post/layk/izoh API'lari
- `public/script.js` — frontend: post yaratish, lenta render, layk/izoh interaktivligi

## API'lar
| Yo'l | Metod | Tavsif | Auth kerakmi |
|---|---|---|---|
| /api/posts | GET | Oxirgi 50 postni qaytaradi | Yo'q |
| /api/posts | POST | Yangi post yaratadi (image, caption) | Ha |
| /api/like | POST | Post layk/unlike qiladi (toggle) | Ha |
| /api/comments | GET | Post izohlarini qaytaradi (?postId=) | Yo'q |
| /api/comments | POST | Yangi izoh qo'shadi | Ha |

## Database jadvallari
`posts`, `likes`, `comments` — batafsil DATABASE.md da

## Bog'lanishlar
- `middleware/auth.js` orqali foydalanuvchi aniqlanadi
- Rasm base64 ko'rinishida, to'g'ridan-to'g'ri `posts.image`da saqlanadi (R2 emas)
- Rasm hajmi MAX_IMAGE_SIZE (constants.js) bilan cheklangan

## Kelajakdagi kengaytirish
- Share (ulashish) — post_id asosida havola yaratish
- Save (saqlash) — saved_posts jadvali kerak
- Follow bilan integratsiya — "Following" lentasi uchun postlarni follower'lar bo'yicha filtrlash
- Video postlar — hozircha faqat rasm, video uchun R2 kerak bo'ladi
