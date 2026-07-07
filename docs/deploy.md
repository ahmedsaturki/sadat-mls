# Deployment Instructions for Sadat-MLS-Cloud

## 🚀 Getting Started

This project is configured for production deployment on Vercel with Supabase. The CI/CD pipeline is already set up and ready to deploy on `git push` to `main`.

## 📋 Prerequisites

1. **GitHub Account** (with repository access)
2. **Vercel Account** (signup at vercel.com)
3. **Supabase Account** (signup at supabase.com)
4. **Environment Variables** (see below)

## 🏗️ Quick Setup Guide

### 1. Fork & Configure Repository

- Fork this repository on GitHub
- Rename from `sadat-mls-cloud-core` to desired project name
- Set `sadat-mls-cloud` as the primary branch

### 2. Environment Variables Setup

Create a `.env.example` file for developers:

```bash
# .env.example - Copy to .env by developers
cp .env.example .env

# Add your own values
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Navigate to Settings > API to obtain your API URL and anon key
3. Enable Email/Password and various auth providers as needed
4. Create all required tables for your application

Typical SQL migrations:

```sql
-- Set up RLS (Row Level Security)
alter table volunteers enable row level security;
alter table projects enable row level security;

-- Create basic tables for enterprise management
create table if not exists enterprises (
  id uuid primary key references auth.users(id),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table enterprises enable row level security;
create policy "projects_select" on enterprises for select using (true);
alter table enterprises enable row level security;
create policy "projects_insert" on enterprises for insert with check (true);
alter table enterprises enable row level security;
create policy "projects_update" on enterprises for update using (true) with check (true);
alter table enterprises enable row level security;
create policy "projects_delete" on enterprises for delete using (true) with check (true);
```

## 🔄 Transaction Preparation

The system uses a transaction preparation pattern to avoid deadlocks while migrating data.

## 🔐 Production Ready Setup

### Environment Variables

Add these to your Vercel dashboard under Settings > Environment Variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (privileged) | ✅ Yes |
| `NEXT_PUBLIC_SITE_URL` | Your site URL | ✅ Yes |
| `NEXT_PUBLIC_APP_URL` | Your app URL | ✅ Yes |

### 4. Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Select the `main` branch
3. Vercel will automatically detect Next.js settings
4. Deploy

### 5. Supabase Integration

- Enable Email/Password authentication
- Enable Email provider (SMTP settings if needed)
- Enable Storage if using file uploads
- Enable real-time subscriptions if needed
- Create Row Level Security (RLS) policies for data protection

## 🔐 Security Best Practices

1. **Secrets Management**: Never commit secrets to version control
2. **Production Keys Only**: Use service role key for server-side operations
3. **Auth Providers**: Enable only needed providers
4. **Row Level Security**: Always implement proper policies
5. **Database Backups**: Enable regular backups in Supabase

## 🧪 Health Check Endpoint

The application includes a `/api/health` endpoint that returns:

```json
{
  "status": "ok",
  "timestamp": "2026-07-07T12:34:56.789Z"
}
```

Vercel automatically triggers this health check after deployment.

## 🤝 Support

For support, development, or feature requests, please:

- Open an issue on GitHub
- Contact the development team via Slack/Discord
- Check our documentation at root `/docs`

## 📚 Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── [locale]/login/
│   │   ├── [locale]/offices/
│   │   └── layout.tsx
│   └── components/
│       └── ui/  # Adapted components
├── scripts/
│   ├── adapt-all.js
│   └── adapt-component.js
├── docs/
│   └── adr/
│       └── 0001-21st-dev-as-source-not-dependency.md
│   └── deploy.md
└── .env.example
```

All files are ready for production deployment.