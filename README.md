# Kana Quiz — Railway Deployment

## Required Steps on Railway

1. Push this folder to a GitHub repo
2. railway.app -> New Project -> Deploy from GitHub
3. Click + New -> Database -> Add PostgreSQL  <-- REQUIRED
4. In your service Variables tab, add:
   NODE_ENV=production
   SESSION_SECRET=any-random-string
5. Redeploy

The server auto-creates the database table on first start.

## Admin login
- URL: /admin  
- Username: admin
- Password: rlaeoqja20070925
