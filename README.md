# 🚗 نظام تقييم المركبات المستردة - الإصدار 6.0 Supabase
# Repossessed Vehicle Evaluation System - v6.0 Supabase

![Version](https://img.shields.io/badge/Version-6.0%20Supabase-blue)
![Supabase](https://img.shields.io/badge/Supabase-Enabled-green)
![GPS](https://img.shields.io/badge/GPS-Location%20Tracking-green)
![Chart.js](https://img.shields.io/badge/Chart.js-Enabled-green)
![License](https://img.shields.io/badge/License-Open%20Source-green)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

---

## 📋 وصف المشروع / Project Description

نظام متكامل ومحسّن لتقييم وإدارة المركبات المستردة مع دعم Supabase للتخزين السحابي والمزامنة الفورية. يتضمن هذا الإصدار جميع الميزات المحسّنة مع نظام GPS لتتبع الموقع الجغرافي وألبوم صور متقدم.

A comprehensive and enhanced system for evaluating and managing repossessed vehicles with Supabase support for cloud storage and real-time synchronization.

---

## ✨ الميزات الرئيسية / Main Features

### 🆕 ميزات الإصدار 6.0 Supabase

| الميزة | الوصف |
|--------|--------|
| 🔷 **Supabase Backend** | استبدال كامل لـ Firebase بـ Supabase |
| 🔐 **Supabase Auth** | نظام مصادقة متكامل مع Google/Microsoft |
| 💾 **Supabase Database** | PostgreSQL مع Row Level Security |
| 📷 **Supabase Storage** | تخزين سحابي للصور |
| 🔄 **Real-time Sync** | مزامنة فورية مع PostgreSQL Changes |
| 📍 **GPS Location** | التقاط وعرض الموقع الجغرافي |

### الميزات الأساسية

- ✅ إضافة وتعديل وحذف المركبات
- ✅ رفع وعرض صور المركبات (حتى 3 صور)
- ✅ تصدير البيانات إلى Excel مع روابط GPS والصور
- ✅ استيراد وتصدير JSON للنسخ الاحتياطي
- ✅ البحث والفلترة المتقدمة
- ✅ إحصائيات ورسوم بيانية
- ✅ الوضع الليلي (Dark Mode)
- ✅ إشعارات محسنة
- ✅ إدارة المستودعات
- ✅ سجل النشاطات
- ✅ إدارة القائمين بالتقييم

---

## 🗂️ هيكل الملفات / File Structure

```
vehicle-evaluation-system/
├── index.html                    # صفحة تسجيل الدخول
├── dashboard.html               # لوحة التحكم الرئيسية
├── album.html                   # ألبوم صور المركبات
├── README.md                    # هذا الملف
│
├── js/
│   ├── supabase-config.js       # إعدادات Supabase
│   ├── main.js                  # JavaScript الرئيسي
│   └── new-features/            # ملفات الميزات الجديدة
│       ├── dark-mode-toggle.js
│       ├── enhanced-notifications.js
│       ├── form-validator.js
│       ├── advanced-filters.js
│       ├── dashboard-stats.js
│       ├── activity-warehouse.js
│       └── enhanced-features.js
│
├── css/
│   ├── style.css               # الأنماط الرئيسية
│   └── new-features/           # أنماط الميزات الجديدة
│       ├── dark-mode.css
│       ├── notifications.css
│       ├── validation.css
│       ├── filters.css
│       ├── enhanced-stats.css
│       └── activity-warehouse.css
│
└── docs/
    ├── README.md               # الوثائق
    ├── SETUP_GUIDE.md         # دليل الإعداد العام
    └── SUPABASE_SETUP_GUIDE.md # دليل إعداد Supabase
```

---

## 🚀 روابط الصفحات / Page URLs

| الصفحة | الرابط | الوصف |
|--------|--------|--------|
| تسجيل الدخول | `/index.html` | صفحة المصادقة |
| لوحة التحكم | `/dashboard.html` | الصفحة الرئيسية |
| ألبوم الصور | `/album.html?id={vehicleId}` | عرض صور المركبة |

---

## ⚙️ إعداد Supabase / Supabase Setup

### المتطلبات
- حساب Supabase (مجاني)
- مشروع Supabase جديد

### الخطوات السريعة

1. **إنشاء مشروع Supabase**
   - اذهب إلى [supabase.com](https://supabase.com)
   - أنشئ مشروع جديد

2. **إعداد قاعدة البيانات**
   - اتبع التعليمات في `docs/SUPABASE_SETUP_GUIDE.md`
   - قم بتشغيل أوامر SQL لإنشاء الجداول

3. **تحديث ملف التكوين**
   ```javascript
   // js/supabase-config.js
   const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
   ```

4. **تفعيل Authentication**
   - فعّل Email authentication
   - (اختياري) فعّل Google/Microsoft OAuth

5. **إعداد Storage**
   - أنشئ bucket باسم `vehicle-images`
   - طبّق سياسات الأمان

---

## 📊 نموذج البيانات / Data Model

### جدول المركبات (vehicles)

| الحقل | النوع | الوصف |
|-------|-------|-------|
| id | UUID | المعرف الفريد |
| user_id | UUID | معرف المستخدم |
| contractNo | TEXT | رقم العقد |
| customerName | TEXT | اسم العميل |
| make | TEXT | الصانع |
| model | TEXT | الموديل |
| year | INTEGER | السنة |
| vin | TEXT | رقم الشاصي |
| plateNo | TEXT | رقم اللوحة |
| odometer | INTEGER | عداد المسافات |
| color | TEXT | اللون |
| fuelType | TEXT | نوع الوقود |
| marketValue | DECIMAL | القيمة السوقية |
| overallRating | TEXT | التقييم العام |
| recommendation | TEXT | التوصية |
| operationStatus | TEXT | حالة التشغيل |
| gpsLatitude | TEXT | خط العرض |
| gpsLongitude | TEXT | خط الطول |
| evaluatorName | TEXT | اسم المقيّم |
| notes | TEXT | ملاحظات |
| images | JSONB | مصفوفة روابط الصور |
| deleted | BOOLEAN | محذوف (soft delete) |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ التحديث |

---

## 🔒 الأمان / Security

- ✅ Row Level Security (RLS) مفعّل
- ✅ كل مستخدم يرى بياناته فقط
- ✅ JWT tokens للمصادقة
- ✅ HTTPS مطلوب

---

## 📱 التوافق / Compatibility

- ✅ Chrome (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Edge (Latest)
- ✅ iOS Safari
- ✅ Android Chrome

---

## 🛠️ التقنيات المستخدمة / Technologies

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Charts**: Chart.js
- **Excel**: SheetJS (xlsx)
- **Icons**: Font Awesome 6
- **Font**: Cairo (Google Fonts)

---

## 📝 سجل التغييرات / Changelog

### v6.0 Supabase (2024)
- 🔄 استبدال Firebase بـ Supabase بالكامل
- 🔐 نظام مصادقة Supabase Auth
- 💾 قاعدة بيانات PostgreSQL
- 📷 تخزين الصور في Supabase Storage
- 🔄 مزامنة فورية مع Realtime
- 🛡️ Row Level Security للأمان

### v5.0 (سابق - Firebase)
- نظام GPS لتتبع الموقع
- ألبوم صور محسّن
- إدارة المستودعات
- سجل النشاطات

---

## 📞 الدعم / Support

للأسئلة والدعم:
- 📖 [Supabase Documentation](https://supabase.com/docs)
- 💬 [Supabase Discord](https://discord.supabase.com)

---

## 📄 الترخيص / License

هذا المشروع مفتوح المصدر ومتاح للاستخدام والتعديل.

---

**تم التطوير بـ ❤️ باستخدام Supabase**
