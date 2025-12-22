# 🚗 نظام تقييم المركبات المستردة - Firebase Edition
# Repossessed Vehicle Evaluation System - Firebase Edition

![Version](https://img.shields.io/badge/Version-4.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-Enabled-orange)
![License](https://img.shields.io/badge/License-Open%20Source-green)
![Status](https://img.shields.io/badge/Status-Enhanced%20%26%20Working-success)

---

## 📋 وصف المشروع / Project Description

نظام متكامل لتقييم وإدارة المركبات المستردة مع دعم Firebase للتخزين السحابي والمزامنة الفورية بين جميع الأجهزة.

A comprehensive system for evaluating and managing repossessed vehicles with Firebase support for cloud storage and real-time synchronization across all devices.

---

## ✨ الميزات الجديدة (v4.0) / New Features

### 🌙 1. الوضع الليلي (Dark Mode)
- ✅ تبديل سريع بزر عائم
- ✅ حفظ التفضيل في localStorage
- ✅ دعم تفضيلات النظام التلقائية
- ✅ انتقال سلس بين الأوضاع
- ✅ تطبيق على جميع الصفحات

### 🔔 2. نظام الإشعارات المحسّن
- ✅ إشعارات Toast جميلة ومتحركة
- ✅ 4 أنواع: success, error, warning, info
- ✅ شريط تقدم للإغلاق التلقائي
- ✅ إمكانية الإغلاق اليدوي
- ✅ تكديس ذكي للإشعارات

### ✅ 3. التحقق المتقدم (Advanced Validation)
- ✅ تحقق فوري أثناء الكتابة
- ✅ علامة (*) للحقول المطلوبة
- ✅ رسائل خطأ واضحة بالعربية
- ✅ تمييز بصري للحقول (صحيح/خطأ)
- ✅ Scroll تلقائي لأول خطأ

### 🔍 4. البحث والفلترة المتقدم
- ✅ بحث نصي شامل (الاسم، الصانع، الموديل، VIN)
- ✅ فلاتر متعددة (الصانع، الموديل، السنة، التقييم)
- ✅ ترتيب حسب (الأحدث، القيمة، الموديل)
- ✅ عداد النتائج الفوري
- ✅ حفظ الفلاتر في URL
- ✅ شارات الفلاتر النشطة

### 📊 5. لوحة إحصائيات محسّنة
- ✅ بطاقات إحصائيات متحركة
- ✅ إجمالي المركبات والقيمة
- ✅ متوسط التقييم مع أشرطة التوزيع
- ✅ مقارنة شهرية (هذا الشهر vs الماضي)
- ✅ أعلى 5 مركبات قيمة
- ✅ مؤشرات الاتجاه (صعود/هبوط)

---

## 🌟 الميزات الرئيسية / Main Features

### 🔐 نظام الحسابات (Authentication)
- ✅ تسجيل حساب جديد بالبريد الإلكتروني
- ✅ تسجيل الدخول بـ Google
- ✅ تسجيل الدخول بـ Microsoft
- ✅ استعادة كلمة المرور
- ✅ تسجيل الخروج الآمن

### ☁️ التخزين السحابي (Cloud Storage)
- ✅ حفظ تلقائي في Firestore
- ✅ مزامنة فورية بين الأجهزة
- ✅ تصدير واستيراد JSON

### 🎨 واجهة المستخدم (User Interface)
- ✅ تصميم عصري واحترافي
- ✅ دعم اللغة العربية (RTL)
- ✅ تصميم متجاوب لجميع الشاشات
- ✅ رسوم متحركة سلسة
- ✅ الوضع الليلي/النهاري

### 📤 التصدير (Export)
- ✅ تصدير Excel
- ✅ تصدير PDF
- ✅ تصدير JSON

---

## 📁 هيكل الملفات / File Structure

```
/
├── index.html                    # صفحة تسجيل الدخول
├── dashboard.html                # لوحة التحكم الرئيسية
├── auth.html                     # قالب صفحة تسجيل دخول بديل
├── main.js                       # JavaScript الرئيسي للنموذج
├── style.css                     # أنماط CSS الرئيسية
├── firebase-config.js            # ملف إعدادات Firebase
│
├── 📁 css/new-features/          # أنماط الميزات الجديدة
│   ├── dark-mode.css             # 🌙 الوضع الليلي
│   ├── notifications.css         # 🔔 الإشعارات
│   ├── validation.css            # ✅ التحقق
│   ├── filters.css               # 🔍 الفلاتر
│   └── enhanced-stats.css        # 📊 الإحصائيات
│
├── 📁 js/new-features/           # JavaScript الميزات الجديدة
│   ├── dark-mode-toggle.js       # 🌙 تبديل الوضع الليلي
│   ├── enhanced-notifications.js # 🔔 نظام الإشعارات
│   ├── form-validator.js         # ✅ التحقق من الحقول
│   ├── advanced-filters.js       # 🔍 البحث والفلترة
│   └── dashboard-stats.js        # 📊 إحصائيات محسنة
│
├── README.md                     # هذا الملف
├── SETUP_GUIDE.md               # دليل الإعداد
└── FIREBASE_SETUP_GUIDE.md      # دليل Firebase
```

---

## 🚀 البدء السريع / Quick Start

### المتطلبات الأساسية:
1. حساب Google
2. مشروع Firebase (مجاني)
3. متصفح حديث

### خطوات الإعداد:

#### 1️⃣ إنشاء مشروع Firebase
```
اذهب إلى: https://console.firebase.google.com/
أنشئ مشروع جديد
```

#### 2️⃣ تفعيل Authentication
```
Build > Authentication > Get Started
فعّل: Email/Password + Google
```

#### 3️⃣ إنشاء Firestore Database
```
Build > Firestore Database > Create Database
```

#### 4️⃣ تحديث إعدادات Firebase
```javascript
// في index.html و dashboard.html
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    ...
};
```

---

## 📱 الصفحات / Pages

| المسار | الوصف | الميزات الجديدة |
|--------|-------|-----------------|
| `/index.html` | صفحة تسجيل الدخول | Dark Mode, Enhanced Notifications, Validation |
| `/dashboard.html` | لوحة التحكم | Dark Mode, Filters, Enhanced Stats, Notifications |

---

## 🔧 استخدام الميزات الجديدة / Using New Features

### 🌙 Dark Mode
```javascript
// تبديل الوضع
NFDarkMode.toggle();

// التحقق من الحالة
if (NFDarkMode.isDarkMode()) {
    console.log('الوضع الليلي مفعل');
}
```

### 🔔 الإشعارات
```javascript
// إشعارات بسيطة
NFNotify.success('تم الحفظ بنجاح!');
NFNotify.error('حدث خطأ!');
NFNotify.warning('تحذير!');
NFNotify.info('معلومة جديدة');

// إشعار متقدم
NFNotify.show({
    message: 'رسالة مخصصة',
    title: 'عنوان مخصص',
    type: 'success',
    duration: 5000
});
```

### ✅ التحقق من النماذج
```javascript
// إنشاء validator للنموذج
const validator = new NFValidator.FormValidator('#myForm', {
    realTime: true,
    scrollToError: true,
    showSuccessState: true
});

// التحقق يدوياً
if (validator.validateAll()) {
    // النموذج صالح
}
```

### 🔍 البحث والفلترة
```javascript
// إنشاء واجهة الفلاتر
NFFilters.createFiltersUI('container-id', {
    onFilter: function(filteredData) {
        // عرض البيانات المفلترة
    }
});

// تعيين فلتر
NFFilters.instance.setFilter('make', 'Toyota');

// البحث
NFFilters.instance.setSearch('كامري');

// إعادة تعيين الكل
NFFilters.instance.reset();
```

### 📊 الإحصائيات
```javascript
// تحديث الإحصائيات
NFStats.update('container-id', vehiclesArray);

// حساب الإحصائيات
const stats = NFStats.calculateStats(vehiclesArray);
console.log(stats.total, stats.totalValue);
```

---

## 📦 المكتبات المستخدمة / Libraries

| المكتبة | الإصدار | الغرض |
|---------|---------|-------|
| Firebase SDK | 10.7.1 | المصادقة وقاعدة البيانات |
| Google Fonts (Cairo) | - | الخط العربي |
| Font Awesome | 6.4.0 | الأيقونات |
| SheetJS (xlsx) | 0.18.5 | تصدير Excel |
| jsPDF | 2.5.1 | تصدير PDF |

---

## 🔒 قواعد الأمان / Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /vehicles/{vehicleId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 🐛 استكشاف الأخطاء / Troubleshooting

| الخطأ | الحل |
|-------|------|
| `auth/configuration-not-found` | تحقق من firebaseConfig |
| `auth/unauthorized-domain` | أضف النطاق في Firebase Console |
| `permission-denied` | تحقق من Firestore Rules |
| Dark Mode لا يعمل | تأكد من تحميل dark-mode.css و dark-mode-toggle.js |
| الفلاتر لا تظهر | تأكد من وجود `#nf-filters-container` في HTML |

---

## 📈 التحديثات القادمة / Future Updates

- [ ] تصدير PDF محسّن مع صور
- [ ] تصدير Excel متقدم
- [ ] رفع الصور إلى Firebase Storage
- [ ] إشعارات Push
- [ ] تطبيق PWA

---

## 🙏 خطة التراجع / Rollback Plan

إذا حدثت مشكلة مع الميزات الجديدة:

1. **حذف الملفات الجديدة:**
   - `css/new-features/` (المجلد بالكامل)
   - `js/new-features/` (المجلد بالكامل)

2. **إزالة الروابط من HTML:**
   - احذف `<link href="css/new-features/...">` من `<head>`
   - احذف `<script src="js/new-features/...">` من قبل `</body>`

3. **النظام الأصلي سيعمل كما كان 100%!**

---

## 📄 الترخيص / License

هذا المشروع مفتوح المصدر للاستخدام الشخصي والتجاري.

---

**الإصدار 4.0** - Enhanced Firebase Edition | آخر تحديث: ديسمبر 2024
