# DATABASE — MOON Social

## Umumiy ko'rinish
D1 (SQLite) bazasi: `moon-users`
Database ID: (wrangler.toml ichida saqlanadi)

## Jadvallar

### users
Foydalanuvchi hisoblari.
| Ustun | Tur | Izoh |
|---|---|---|
| id | INTEGER PK | |
| username | TEXT UNIQUE | |
| email | TEXT UNIQUE | |
| password_hash | TEXT | format: `salt:hash` (PBKDF2) |
| created_at | TEXT | |

### sessions
Kirgan foydalanuvchi tokenlari (cookie orqali).
| Ustun | Tur | Izoh |
|---|---|---|
| token | TEXT PK | tasodifiy 48-belgili hex |
| user_id | INTEGER | users.id ga bog'liq |
| created_at | TEXT | |

### profiles
Foydalanuvchi profili (1:1 users bilan).
| Ustun | Tur | Izoh |
|---|---|---|
| user_id | INTEGER PK | |
| avatar | TEXT | base64 rasm |
| cover | TEXT | base64 rasm |
| bio | TEXT | |

### posts
| Ustun | Tur | Izoh |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER | |
| image | TEXT | base64 rasm |
| caption | TEXT | |
| created_at | TEXT | |

### likes
| Ustun | Tur | Izoh |
|---|---|---|
| id | INTEGER PK | |
| post_id | INTEGER | |
| user_id | INTEGER | |
| created_at | TEXT | UNIQUE(post_id, user_id) |

### comments
| Ustun | Tur | Izoh |
|---|---|---|
| id | INTEGER PK | |
| post_id | INTEGER | |
| user_id | INTEGER | |
| text | TEXT | |
| created_at | TEXT | |

### user_data
Habit-tracker (Intizom) shaxsiy ma'lumotlari — JSON ko'rinishida.
| Ustun | Tur | Izoh |
|---|---|---|
| user_id | INTEGER PK | |
| data | TEXT | JSON: schedules, log, best streak |
| updated_at | TEXT | |

## Rejalashtirilgan (hali yo'q)
- `follows` (follower_id, following_id) — Follow moduli uchun
- `stories` — Story moduli uchun
- `notifications` — Notifications moduli uchun
- `saved_posts` — Save moduli uchun
- `shares` — Share moduli uchun (yoki shunchaki `posts.share_count`)
