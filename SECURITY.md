# Security Policy - Sadat MLS Cloud

## الأمان المُنجز (Implemented Security)

### Security Headers
تم تنفيذ جميع الـ headers الأمنية في `middleware.ts`:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: nonce-based scripts
```

### CSRF Protection
- نمط double-submit cookie
- توليد الـ token باستخدام `crypto.randomUUID()`
- مقارنة ذات زمن ثابت (XOR-based)
- الـ cookie غير HttpOnly (مطلوب للـ double-submit)
- secure: true في الإنتاج، sameSite: lax
- مدة الصلاحية: 24 ساعة

### Rate Limiting
- **API endpoints**: 20 طلب في الدقيقة لكل IP
- **Auth endpoints**: 5 طلبات في 15 دقيقة لكل IP
- **Contact form**: 3 طلبات في الساعة لكل متصفح
- تنفيذ: في الذاكرة + قاعدة البيانات كـ fallback
- Response: 429 مع header `Retry-After`

### Input Sanitization
- XSS prevention مع `sanitizeHtml()` multi-pass regex
- `sanitizeJsonLd` للـ structured data
- Zod validation schemas لجميع النماذج
- Phone validation: تنسيق مصري `^0[0-9]{9,10}$`
- Email validation regex

### Authentication & Authorization
- JWT-based authentication عبر Supabase
- Role-Based Access Control (RBAC):
  - `super_admin` - وصول كامل للنظام
  - `office_admin` - إدارة المكاتب + العقارات + الوكلاء
  - `office_agent` - إدارة العقارات فقط
- Server-side auth checks في جميع صفحات Dashboard
- CSRF protection على جميع طلبات API الحذفية

### Database Security
- Row Level Security (RLS) مفعل على جميع الجداول
- Super admin override على جميع البيانات
- Office-based isolation (كل مكتب يرى بياناته فقط)
- Storage policies للصور (upload/delete مقيد للمكتب)

## تواصل الأمان (Reporting Security Issues)

للمشاكل الأمنية الحرجة، يرجى التواصل مع: security@sadatmls.com

---

*تم تنفيذ جميع التدقيقات الأمنية وفقاً للمعايير المتقدمة.*