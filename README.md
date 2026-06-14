# Kana Quiz - Railway Deployment

## Required environment variables on Railway

| Variable | Where to get it |
|----------|----------------|
| NODE_ENV | Set to: production |
| SESSION_SECRET | Any random string |
| DATABASE_URL | Auto-set by Railway PostgreSQL plugin |

## Deploy steps
1. Push this folder to a GitHub repo
2. New Project on railway.app -> Deploy from GitHub
3. Add PostgreSQL plugin (sets DATABASE_URL automatically)
4. Set NODE_ENV=production and SESSION_SECRET in Variables tab
5. Done - no build step needed

## Admin login
- URL: /admin
- Username: admin
- Password: rlaeoqja20070925
