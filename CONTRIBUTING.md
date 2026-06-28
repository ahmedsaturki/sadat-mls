# دليل المساهمة - Sadat MLS Cloud

شكراً لاهتمامك بالمساهمة في مشروعنا! إليك دليل خطوات المساهمة.

## جدول المحتويات

- [البدء](#البدء)
- [قواعد الكتابة](#قواعد-الكتابة)
- [اختبار الكود](#اختبار-الكود)
- [هيكل المشروع](#هيكل-المشروع)
- [أسلوب الكود](#اسلوب-الكود)

## البدء

1. Fork المشروع
2. أنشئ فرع ميزة جديد (`git checkout -b feature/amazing-feature`)
3. قم بتعديل الكود
4. ارفع التغييرات (`git push origin feature/amazing-feature`)
5. افتح Pull Request

## قواعد الكتابة

- يجب أن تمر جميع الاختبارات: `npm run test:run`
- يجب أن ينجح ESLint: `npm run lint`
- يجب أن ينجح TypeScript: `npx tsc --noEmit`
- E2E tests يجب أن تمر: `npm run test:e2e`

## اختبار الكود

### تشغيل الاختبارات

```bash
# اختبارات الوحدة
npm run test:run

# اختبارات الوحدة مع التغطية
npm run test:coverage

# اختبارات E2E
npm run test:e2e
```

### كتابة الاختبارات

- استخدم Vitest + @testing-library/react للاختبارات
- ضع ملفات الاختبار في `src/__tests__/`
- اسم ملف الاختبار: `*.test.ts` أو `*.test.tsx`

## هيكل المشروع

```
src/
├── app/                    # Next.js App Router
├── components/             # مكونات React
├── hooks/                  # React Hooks مخصصة
├── i18n/                   # التوطين (العربية والإنجليزية)
├── lib/                    # أدوات وخدمات
└── __tests__/              # اختبارات الوحدة
```

## اسلوب الكود

- TypeScript Strict Mode
- Tailwind CSS للـ styling
- i18n: استخدم `dict.*` keys، لا تكتب نصوص عربية/إنجليزية مباشرة
- "use client" في جميع الصفحات
- Auth checks في middleware للمسارات المحمية
- Logger بدلاً من console.error
- CSRF headers على جميع طلبات API الحذفية

---

شكراً لمساهمتك! 🎉