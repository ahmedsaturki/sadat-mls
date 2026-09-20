# تغييرات Sadat MLS Cloud

## [2026-09-20] PR #38 runtime hardening and release verification

### تم إنجازه

- ✅ دمج PR #38 إلى `main` عند `8fae65aca77751b45ffef7141d7d55cc7c87e8db`.
- ✅ نشر Vercel production لنفس الإصدار: `dpl_7rPQVen2sF1qCiwcgCiHJdKvzppq` → READY.
- ✅ اجتياز Self-hosted Verification #90 بالكامل.
- ✅ إضافة hardening لحفظ locale الصريح في protected redirects.
- ✅ تحسين structured rate-limit error reporting وtrusted client-IP precedence.
- ✅ إضافة production auth rate-limit readiness gate إلى CI.
- ✅ تحديث توثيق release baseline والحالة التشغيلية بعد الدمج.

## [2026-09-20] Authoritative Aqarat lineage release

### تم إنجازه

- ✅ دمج PR #33 واستقرار `main` على `8a1207260cc1bd8345cedfb623d2fe8c3b22e39d`.
- ✅ استعادة ومزامنة **41/41** migration إنتاجية حتى `20260918171827`.
- ✅ إغلاق Issue #30 بعد اكتمال استعادة lineage الرسمي.
- ✅ اجتياز Self-hosted Verification run #70 بالكامل: migration verifier، lint، adapter smoke، typecheck، schema contract، **42 files / 677 tests**، build، diff check.
- ✅ نشر production على Vercel: `dpl_DXEib3c7bWprTE12u7LutH1Ka7q5` → READY.
- ✅ التحقق من `/api/health` و`/api/properties` وExplore وProperty Detail بعد الدمج، وكلها HTTP 200.
- ✅ تحديث وثائق README وPlatform Reconciliation لتعكس الحالة الفعلية بدل baseline قديم.
- ✅ إبقاء GitHub-hosted CI admission failure منفصلًا وتتبعه في Issue #25 دون إضعاف أي gate.

## [2026-09-19] Post-merge production verification and repository hygiene

### تم إنجازه

- ✅ تثبيت الحالة النهائية الموثقة على `main` عند `664fc39b1743059d84d72b86d921c8085d06e84e`.
- ✅ التحقق من نشر Vercel الإنتاجي لنفس الـcommit: `dpl_GF6csFucVqiSbLWDhBoo9y3gwgJP` بحالة READY.
- ✅ اجتياز Self-hosted Verification run #5 بالكامل: install، lint، adapter smoke، typecheck، schema contract، tests، build، diff check.
- ✅ التحقق من health/property runtime في الإنتاج وعدم وجود runtime errors في نافذة المراقبة المحددة.
- ✅ توثيق أن hosted CI `lint` فشل قبل بدء أي step وحتى بعد rerun، بدون job logs متاحة؛ دون إضعاف متطلبات CI لإخفاء الحالة.
- ✅ تنظيف ملف debug محلي متتبع `dev-output.log` ومنع عودته إلى المستودع.

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
