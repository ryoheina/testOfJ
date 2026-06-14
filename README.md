# Kana Quiz — Railway Deployment

## Required Steps on Railway

1. Push this folder to a GitHub repo
2. railway.app -> New Project -> Deploy from GitHub
3. Click + New -> Database -> Add PostgreSQL  <-- REQUIRED
4. In Variables tab add:
   NODE_ENV=production
   SESSION_SECRET=any-random-string
5. Deploy

The server auto-creates the database table on first start.

Admin: /admin  |  user: admin  |  pass: rlaeoqja20070925
