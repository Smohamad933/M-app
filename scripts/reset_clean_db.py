import json
import os

clean_db = {
  "users": [
    {
      "id": "usr_admin_mohusyn",
      "username": "Mohusyn",
      "password": "Smosh1387",
      "name": "سید محمدحسین شیخ الاسلامی (Mohusyn)",
      "role": "admin",
      "status": "active",
      "isVerified": True,
      "phone": "09120000000",
      "email": "mohusyn@gmail.com",
      "jobTitle": "مدیر ارشد و توسعه‌دهنده نرم‌افزار",
      "city": "تهران",
      "province": "تهران",
      "createdAt": "2026-09-19T17:29:02.500Z",
      "numericId": 1000,
      "subscription": {
        "plan": "pro"
      },
      "isProfileCompleted": True
    }
  ],
  "tasks": [],
  "categories": [
    {"id": "cat_work", "name": "کار و پروژه‌ها", "color": "#4f46e5", "icon": "briefcase"},
    {"id": "cat_study", "name": "مطالعه و یادگیری", "color": "#059669", "icon": "book"},
    {"id": "cat_personal", "name": "شخصی و سلامت", "color": "#d97706", "icon": "user"}
  ],
  "focus_rooms": [],
  "focusRooms": [],
  "projects": [],
  "goals": [],
  "dailyNotes": [],
  "personalityResults": [],
  "globalSettings": {
    "appName": "بگ تایم",
    "jobCategories": [
      "برنامه‌نویسی و مهندسی نرم‌افزار",
      "طراحی رابط و تجربه کاربری (UI/UX)",
      "مدیریت پروژه و اسکرام‌مستر",
      "دیجیتال مارکتینگ و سئو",
      "تولید محتوا و رسانه‌های دیجیتال",
      "مهندس هوش مصنوعی و یادگیری عمیق",
      "مشاور حقوقی و مالکیت فکری",
      "متخصص DevOps و کلود",
      "حسابداری و امور مالی",
      "پزشکی، سلامت و روانشناسی",
      "آموزش، تدریس و پژوهش دانشگاهی",
      "معماری و مهندسی عمران",
      "وکالت و امور حقوقی",
      "سایر / فریلنسر آزاد"
    ],
    "updatedAt": "2026-09-24T20:00:00.000Z",
    "baleBot": {
      "enabled": True,
      "token": "1002345678:ABCdefGHIjklMNOpqrSTUvwxYZ_12345678",
      "botUsername": "BagTime_Bot",
      "verifyOnRegister": True,
      "sendNotifications": True,
      "allowTaskCreation": True
    },
    "broadcastNotice": {
      "enabled": False,
      "title": "",
      "message": "",
      "type": "info"
    },
    "enforcedFont": "cairo",
    "defaultDailyFocusMinutes": 120,
    "workHoursPolicy": {
      "start": "08:00",
      "end": "16:30"
    },
    "roomPolicy": {
      "allowUserRoomCreation": True,
      "allowPublicChat": True
    },
    "dailyMantra": "تمرکز پیوسته بر کارهای مهم، رمز موفقیت و آرامش ذهن است.",
    "texts": {
      "appName": "بگ تایم"
    }
  },
  "custom_fonts": [],
  "friendships": [],
  "friend_requests": [],
  "messages": [],
  "project_messages": [],
  "notifications": [],
  "payments": [],
  "sessions": [],
  "revoked_tokens": []
}

with open('data/db.json', 'w', encoding='utf-8') as f:
    json.dump(clean_db, f, ensure_ascii=False, indent=2)

print("data/db.json has been reset to a pristine clean production state.")
