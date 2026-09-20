# تغييرات Sadat MLS Cloud

## [2026-09-20] Production runtime recovery and authoritative lineage completion

### تم إنجازه

- ✅ دمج PR #41 عند `1bc3a3de977917d6a973c4f05f7d9930e1a9e726`.
- ✅ نشر production deployment `dpl_9op1XKW8jKRXZnqJNGAs9esSWbm6` → READY.
- ✅ استعادة الـ6 migrations الإنتاجية التي كانت مفقودة من المستودع، ثم إضافة 4 migrations تشغيلية مرتبطة بالـpublic runtime، منها hardening نهائي لـSECURITY DEFINER search_path؛ أصبح lineage **52/52** حتى `20260920201858`.
- ✅ نقل public auth/CSRF/CSP/contact rate limiting بعيدًا عن الاعتماد على privileged Supabase key.
- ✅ إضافة constrained public contact RPC مع fail-closed behavior.
- ✅ تحديث generated Supabase types وإضافة regression/E2E coverage.
- ✅ Self-hosted Verification #101 → SUCCESS.
- ✅ Hosted CI/CD #820 → SUCCESS مع E2E وproduction health-check.
- ✅ Production smoke → `/api/health`, `/api/properties`, `/en/explore` = HTTP 200.

## [2026-09-20] Authoritative Aqarat lineage release

### تم إنجازه

- ✅ دمج PR #33 واستعادة أول lineage موثق للـAqarat OS قبل استكمال revisions الإنتاجية اللاحقة.
- ✅ استعادة ومزامنة **41/41** migration إنتاجية حتى `20260918171827` كمرحلة سابقة من lineage.
- ✅ إغلاق Issue #30 بعد استكمال استعادة lineage الرسمي.
- ✅ اجتياز Self-hosted Verification run #70 بالكامل: migration verifier، lint، adapter smoke، typecheck، schema contract، **42 files / 677 tests**، build، diff check.
- ✅ نشر production على Vercel: `dpl_DXEib3c7bWprTE12u7LutH1Ka7q5` → READY.
- ✅ التحقق من `/api/health` و`/api/properties` وExplore وProperty Detail بعد الدمج، وكلها HTTP 200.
- ✅ تحديث وثائق README وPlatform Reconciliation لتعكس الحالة الفعلية بدل baseline قديم.
- ✅ إبقاء قواعد CI مستقلة وعدم تخفيف أي gate؛ تم إغلاق Issue #25 بعد عودة hosted CI للعمل.

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
