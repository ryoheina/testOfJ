# Kana Quiz - Railway Deployment

## Setup on Railway

1. Create new project -> Deploy from GitHub (or upload this folder)
2. Add PostgreSQL plugin (DATABASE_URL is set automatically)
3. Set environment variables:
   - NODE_ENV=production
   - SESSION_SECRET=any-long-random-string
4. Deploy - no build step needed, everything is pre-compiled

## Admin
- URL: /admin
- Username: admin
- Password: (the one you set)
