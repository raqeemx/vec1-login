# 🔷 دليل إعداد Supabase خطوة بخطوة
# Supabase Setup Guide - Step by Step

---

## 📋 المحتويات / Contents

1. [إنشاء مشروع Supabase](#1-إنشاء-مشروع-supabase)
2. [إعداد قاعدة البيانات](#2-إعداد-قاعدة-البيانات)
3. [تفعيل Authentication](#3-تفعيل-authentication)
4. [إعداد Storage](#4-إعداد-storage)
5. [تحديث ملفات المشروع](#5-تحديث-ملفات-المشروع)
6. [نشر المشروع](#6-نشر-المشروع)

---

## 1. إنشاء مشروع Supabase

### الخطوة 1.1: الذهاب إلى Supabase Dashboard
1. افتح المتصفح واذهب إلى: **https://supabase.com/**
2. سجل الدخول بحسابك (GitHub أو Google)

### الخطوة 1.2: إنشاء مشروع جديد
1. انقر على **"New Project"**
2. اختر المنظمة (Organization)
3. أدخل اسم المشروع (مثال: `vehicle-evaluation-system`)
4. أنشئ كلمة مرور قوية لقاعدة البيانات
5. اختر المنطقة الأقرب لك
6. انقر **"Create new project"** وانتظر 2-3 دقائق

### الخطوة 1.3: الحصول على مفاتيح API
1. اذهب إلى **Settings** > **API**
2. انسخ:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: المفتاح العام

---

## 2. إعداد قاعدة البيانات

### الخطوة 2.1: إنشاء جدول المستخدمين
اذهب إلى **SQL Editor** وقم بتشغيل:

```sql
-- جدول المستخدمين (profiles)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT UNIQUE,
    photo_url TEXT,
    provider TEXT DEFAULT 'email',
    settings JSONB DEFAULT '{"darkMode": false, "language": "ar", "notifications": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمستخدمين
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);
```

### الخطوة 2.2: إنشاء جدول المركبات
```sql
-- جدول المركبات
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- معلومات أساسية
    contractNo TEXT,
    customerName TEXT,
    make TEXT,
    model TEXT,
    year INTEGER,
    vin TEXT,
    plateNo TEXT,
    odometer INTEGER,
    color TEXT,
    fuelType TEXT,
    
    -- التقييم
    marketValue DECIMAL(12,2),
    overallRating TEXT DEFAULT 'good',
    recommendation TEXT,
    operationStatus TEXT,
    
    -- الموقع
    recoveryDate DATE,
    recoveryLocation TEXT,
    warehouse TEXT,
    warehouseName TEXT,
    
    -- GPS
    gpsLatitude TEXT,
    gpsLongitude TEXT,
    gpsMapUrl TEXT,
    
    -- المقيّم
    evaluatorId TEXT,
    evaluatorName TEXT,
    evaluatorEmployeeId TEXT,
    
    -- أخرى
    notes TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    deleted BOOLEAN DEFAULT FALSE,
    
    -- التواريخ
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهرس للبحث السريع
CREATE INDEX idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX idx_vehicles_deleted ON public.vehicles(deleted);
CREATE INDEX idx_vehicles_created_at ON public.vehicles(created_at DESC);

-- تفعيل RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمركبات
CREATE POLICY "Users can view own vehicles" ON public.vehicles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles" ON public.vehicles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles" ON public.vehicles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles" ON public.vehicles
    FOR DELETE USING (auth.uid() = user_id);
```

### الخطوة 2.3: إنشاء جدول سجل النشاطات (اختياري)
```sql
-- جدول سجل النشاطات
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهرس للبحث
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- تفعيل RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can view own activity logs" ON public.activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 3. تفعيل Authentication

### الخطوة 3.1: إعدادات المصادقة
1. اذهب إلى **Authentication** > **Providers**
2. تأكد من تفعيل **Email**

### الخطوة 3.2: تفعيل تسجيل الدخول بـ Google (اختياري)
1. في **Providers**، فعّل **Google**
2. أدخل **Client ID** و **Client Secret** من Google Cloud Console
3. أضف **Redirect URL** المعطى إلى Google Console

### الخطوة 3.3: إعدادات عامة
1. اذهب إلى **Authentication** > **Settings**
2. في **Site URL**: أدخل رابط موقعك
3. في **Redirect URLs**: أضف:
   - `https://your-domain.com/dashboard.html`
   - `https://your-domain.com/index.html`

---

## 4. إعداد Storage (للصور)

### الخطوة 4.1: إنشاء Bucket
1. اذهب إلى **Storage**
2. انقر **"Create a new bucket"**
3. اسم الـ Bucket: `vehicle-images`
4. اختر **Public bucket** إذا أردت الصور عامة

### الخطوة 4.2: سياسات Storage
```sql
-- سياسة رفع الصور
CREATE POLICY "Users can upload vehicle images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'vehicle-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- سياسة عرض الصور
CREATE POLICY "Users can view vehicle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

-- سياسة حذف الصور
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'vehicle-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 5. تحديث ملفات المشروع

### الخطوة 5.1: تحديث إعدادات Supabase
افتح ملف `js/supabase-config.js` وحدّث:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

---

## 6. نشر المشروع

### الخيار 1: GitHub Pages
1. ارفع المشروع إلى GitHub
2. اذهب إلى **Settings** > **Pages**
3. اختر **Branch: main** و **/ (root)**
4. انتظر النشر

### الخيار 2: Netlify
1. اذهب إلى netlify.com
2. اسحب مجلد المشروع
3. انتظر النشر

### الخيار 3: Vercel
1. اذهب إلى vercel.com
2. اربط مستودع GitHub
3. انشر

---

## 🔧 استكشاف الأخطاء

### خطأ في تسجيل الدخول
- تأكد من صحة مفاتيح API
- تأكد من تفعيل المصادقة

### خطأ في قاعدة البيانات
- تأكد من تشغيل جميع أوامر SQL
- تأكد من تفعيل RLS policies

### خطأ في رفع الصور
- تأكد من إنشاء bucket `vehicle-images`
- تأكد من إعداد سياسات Storage

---

## 📞 الدعم

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
