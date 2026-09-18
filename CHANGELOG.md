# تغييرات Sadat MLS Cloud

## [2026-09-18] Production reconciliation and hardening

### تم إنجازه

- ✅ نقل public property reads إلى عقد Aqarat OS الفعلي.
- ✅ تفعيل RLS وcolumn-level grants للعقارات النشطة فقط.
- ✅ منع الوصول العام إلى الحقول الداخلية `confidence`, `parcel_number`, `installments_clear`, `canonical_key`.
- ✅ إزالة مسار SECURITY DEFINER المؤقت للقراءة العامة.
- ✅ تسجيل public-property migration داخل Supabase migration history ومزامنة اسم الملف مع الإصدار المطبق.
- ✅ تثبيت إعداد Supabase العام الموحد للمتصفح وServer Auth.
- ✅ إصلاح lifecycle الخاص بـ Supabase Auth listener.
- ✅ إصلاح عداد العقارات المعروض في الصفحة الرئيسية.
- ✅ توحيد canonical/Open Graph URL مع رابط الإنتاج الموثق.
- ✅ ضبط login rate limit إلى 5 محاولات / 15 دقيقة.
- ✅ ضبط forgot-password إلى 3 طلبات / ساعة.
- ✅ ضبط resend-verification إلى 5 طلبات / ساعة.
- ✅ منع استهلاك محاولتين من login rate-limit حول نفس تسجيل الدخول الفاشل.
- ✅ جعل CI يستخدم Supabase CLI المثبت داخل المشروع بدل global install غير مثبت الإصدار.
- ✅ جعل production health check يعيد المحاولة بدل الاعتماد على تأخير ثابت.
- ✅ توسيع contract checker ليغطي كل application source تحت `src`.
- ✅ توثيق حدود المنتج الفعلية بدل الإبقاء على وثائق schema قديمة ومضللة.

### Verified production baseline

- ✅ `/api/health` → 200.
- ✅ `/api/properties` → 200.
- ✅ Explore AR/EN → 200.
- ✅ Active property detail → 200.
- ✅ Login route → 200.
- ✅ Latest production runtime error sweep → clean.
- ✅ Latest Vercel production deployment → READY.

## [0.1.0] - 2025-06-26

### تم الإصلاح
- ✅ Next.js 14 compatibility - تم ترقية Next.js من `^9.3.3` إلى `^14.2.35`
- ✅ Build clean - تم إصلاح جميع prerender errors
- ✅ تم ترقية React إلى `^18.3.1`
- ✅ تم ترقية @sentry/nextjs إلى `^8.0.0`
- ✅ تم تحديث `usePageLocale` hook لاستخدام `useParams()`
- ✅ تم إصلاح جميع صفحات server components لاستخدام `await Promise.resolve(params)` مع fallback
- ✅ تم إصلاح `not-found.tsx` لاستخدام `@/i18n/getMessages`
- ✅ تم إصلاح middleware.ts cookie iteration
- ✅ تم إزالة isomorphic-dompurify
- ✅ النشر على Vercel ناجح
