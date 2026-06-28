# Sadat MLS Cloud - API Documentation

## Authentication

All API routes (except public routes) require authentication via Supabase JWT token in the `Authorization: Bearer <token>` header.

## Rate Limiting

- **API endpoints**: 20 requests per minute per IP
- **Auth endpoints**: 5 requests per 15 minutes per IP
- **Contact form**: 3 requests per hour per browser (client-side)

## Endpoints

### Health Check

```
GET /api/health
```

Returns the application health status including database connectivity.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "checks": {
    "supabase": {
      "status": "ok"
    }
  }
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "checks": {
    "supabase": {
      "status": "error",
      "message": "Connection timeout"
    }
  }
}
```

---

### Agents

#### Create Agent

```
POST /api/agents
```

Creates a new office agent user. Requires `office_admin` or `super_admin` role.

**Headers:**
- `Authorization: Bearer <jwt_token>`
- `X-CSRF-Token: <csrf_token>` (from cookie)

**Request Body:**
```json
{
  "email": "agent@office.com",
  "password": "securePassword123",
  "full_name": "Agent Name",
  "office_id": "uuid-of-office",
  "role": "office_agent" // optional: "office_agent" (default) or "office_admin" (super_admin only)
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "userId": "uuid-of-new-user"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Missing required fields"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (429 Too Many Requests):**
```json
{
  "error": "Too many requests"
}
```

#### Delete Agent

```
DELETE /api/agents?id=<user_id>
```

Deletes an agent user. Requires `office_admin` or `super_admin` role.

**Permissions:**
- `super_admin`: Can delete any user
- `office_admin`: Can only delete `office_agent` users from their own office

**Headers:**
- `Authorization: Bearer <jwt_token>`
- `X-CSRF-Token: <csrf_token>`

**Response (200 OK):**
```json
{
  "success": true
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid user ID format"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Cannot delete this user"
}
```

---

### OG Image

```
GET /og-image?title=<title>&description=<description>&locale=<ar|en>
```

Generates a dynamic Open Graph image (1200x630) for social sharing.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `title` | string | No | "Sadat MLS Cloud" | Image title |
| `description` | string | No | "منصة إدارة العقارات..." | Image description |
| `locale` | string | No | "ar" | Language direction (ar/en) |

**Response:** PNG image (1200x630)

---

### Sitemap

```
GET /sitemap.xml
```

Returns an XML sitemap with all static and dynamic pages.

**Response:** XML sitemap with up to 1000 property listings.

---

### Robots

```
GET /robots.txt
```

Returns robots.txt with crawl rules.

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Missing or invalid auth |
| `403` | Forbidden - Invalid CSRF token or permission denied |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error |
| `503` | Service Unavailable - Health check failed |

## CSRF Token

All mutating API requests (POST, PUT, DELETE, PATCH) require a CSRF token:

1. The CSRF token is stored in a non-HttpOnly cookie named `csrf_token`
2. The client must read this cookie and send it in the `X-CSRF-Token` header
3. The server validates that the header matches the cookie (double-submit pattern)

## Authentication Flow

### OAuth / Magic Link

1. User clicks "Login" or "Forgot Password"
2. Supabase sends magic link or OAuth redirect
3. User clicks the link → redirects to `/[locale]/auth/callback`
4. Callback exchanges code for session
5. User is redirected to dashboard based on role

### Role-Based Redirects

- `super_admin` → `/[locale]/admin`
- `office_admin` / `office_agent` → `/[locale]/dashboard`
- No role → `/[locale]/explore`

---

## Admin Endpoints

### Contact Requests

```
GET /[locale]/admin/contact-requests
```

Returns all contact requests with filtering options.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `contact_type` | string | Filter by contact type (whatsapp, phone, email) |

---

### Analytics

```
GET /[locale]/admin/analytics
```

Returns analytics dashboard data including:
- Total properties count
- Properties by status (available, reserved, sold, rented, pending_review)
- Total offices count
- Total users count
- Total zones count
- Total property types count

---

## Dashboard Endpoints

### Favorites

```
GET /[locale]/dashboard/favorites
```

Returns user's favorited properties.

**Note:** The `property_favorites` table must exist in the database for this endpoint to work.
Run migration `supabase/migrations/007_property_favorites.sql` first.

**Features:**
- Only active properties can be favorited (enforced by DB trigger)
- Users can view/add/delete their own favorites only
- Foreign key cascade on user/property delete

---

## Database Migrations

### Order of Application

| # | Migration | Description |
|---|-----------|-------------|
| 1 | `001_initial_schema.sql` | Core tables (offices, users, zones, properties) |
| 2 | `002_rls_policies.sql` | Row Level Security policies |
| 3 | `003_office_logos_bucket.sql` | Storage bucket for office logos |
| 4 | `004_rate_limit_log.sql` | Rate limiting audit table |
| 5 | `005_performance_indexes.sql` | Database indexes for performance |
| 6 | `006_contact_request_fix.sql` | Makes `property_id` nullable for general inquiries + UPDATE policy |
| 7 | `007_property_favorites.sql` | Favorites table with RLS + active property check trigger |

### Migration 006 - Contact Request Fixes

- Makes `property_id` nullable (landing page inquiries without property)
- Adds `updated_at` column for status changes
- Creates trigger for auto-updating timestamp
- Adds `idx_contact_requests_null_property` index for general inquiries

### Migration 007 - Property Favorites

- Creates `property_favorites` table with composite primary key
- RLS policies: `users_view_own_favorites`, `users_insert_favorites`, `users_delete_own_favorites`
- Trigger `check_property_active()` prevents favoriting inactive properties
- Indexes on `user_id` and `property_id`