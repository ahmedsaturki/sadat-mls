# تغييرات Sadat MLS Cloud

## [0.1.0] - 2025-06-26

### تم الإصلاح
- ✅ Next.js 14 compatibility - تم ترقية Next.js من `^9.3.3` إلى `^14.2.35`
- ✅ Build clean - تم إصلاح جميع prerender errors
- ✅ تم ترقية React إلى `^18.3.1`
- ✅ تم ترقية @sentry/nextjs إلى `^8.0.0`
- ✅ تم تحديث `usePageLocale` hook لاستخدام `useParams()`
- ✅ تم إصلاح جميع صفحات server components لاستخدام `await Promise.resolve(params)` مع fallback
- ✅ تم إصلاح `not-found.tsx` لاستخدام `@/i18n/getMessages`
- ✅ تم إصلاح `/api/agents` POST - SUPER_ADMIN يمكنه إنشاء OFFICE_ADMIN
- ✅ تم إصلاح `/api/agents` DELETE - OFFICE_ADMIN يمكنه حذف OFFICE_AGENT فقط
- ✅ تم إصلاح PropertyStatus type لتشمل `pending_review`
- ✅ تم إضافة CSRF headers في admin/offices page
- ✅ تم إصلاح middleware.ts cookie iteration
- ✅ تم تحويل next.config.ts إلى next.config.js
- ✅ تم إزالة isomorphic-dompurify (كان يسبب أخطاء jsdom)
- ✅ جميع الاختبارات تمر (70 tests)
- ✅ النشر على Vercel ناجح

### مضاف
- ✅ Health check endpoint `/api/health` 
- ✅ 30+ routes مُنجزة بنجاح
- ✅ OG Image generator endpoint

### مرفع من
- `next`: `^9.3.3` → `^14.2.35`
- `react`: 19 → `^18.3.1`
- `@sentry/nextjs`: `^10.61.0` → `^8.0.0`
- `next.config.ts` → `next.config.js`

### مُحذف
- `isomorphic-dompurify` - كان يسبب أخطاء jsdom في البناء
- `metadataBase` module-level exports - غير متوافق مع Next.js 14