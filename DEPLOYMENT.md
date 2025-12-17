# Deployment Guide

This guide covers how to deploy the Rate My Neighborhood application.

## Prerequisites

- Docker and Docker Compose installed
- Domain name (optional, for production)
- OAuth credentials from Google, Facebook, and Twitter
- Mapbox API token
- Google Analytics measurement ID

## Environment Setup

1. **Copy the environment template:**

```bash
cp .env.example .env
```

2. **Configure environment variables:**

Edit `.env` and fill in all required values:

### Database
- `DATABASE_URL`: PostgreSQL connection string (use `postgres:5432` for Docker)

### NextAuth
- `NEXTAUTH_URL`: Your application URL (e.g., `https://yourdomain.com`)
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

### OAuth Providers
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
- `FACEBOOK_CLIENT_ID` & `FACEBOOK_CLIENT_SECRET`: From Facebook Developers
- `TWITTER_CLIENT_ID` & `TWITTER_CLIENT_SECRET`: From Twitter Developer Portal

### Mapbox
- `NEXT_PUBLIC_MAPBOX_TOKEN`: From Mapbox account

### Analytics
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: From Google Analytics

## Local Development

1. **Start PostgreSQL:**

```bash
docker compose up postgres -d
```

2. **Install dependencies:**

```bash
npm install
```

3. **Run database migrations:**

```bash
npm run prisma:migrate
npm run prisma:seed
```

4. **Start development server:**

```bash
npm run dev
```

Visit `http://localhost:3000`

## Production Deployment with Docker

### Option 1: Docker Compose (Recommended)

1. **Build and start all services:**

```bash
docker compose up --build -d
```

2. **Run database migrations:**

```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run prisma:seed
```

3. **View logs:**

```bash
docker compose logs -f app
```

4. **Stop services:**

```bash
docker compose down
```

### Option 2: Separate Database

If you're using a hosted database (e.g., AWS RDS, Neon, Supabase):

1. **Update DATABASE_URL** in `.env` to point to your hosted database

2. **Run migrations from your local machine:**

```bash
npm run prisma:migrate
npm run prisma:seed
```

3. **Build and run only the app:**

```bash
docker build -t neighborhood-rater .
docker run -p 3000:3000 --env-file .env neighborhood-rater
```

## Production Checklist

- [ ] Set `NODE_ENV=production` in environment
- [ ] Configure OAuth redirect URIs for production domain
- [ ] Enable database backups
- [ ] Set up SSL/TLS (use nginx or Caddy as reverse proxy)
- [ ] Configure CORS if needed
- [ ] Set up monitoring/alerting
- [ ] Enable Docker health checks
- [ ] Configure log rotation
- [ ] Set resource limits in docker-compose.yml
- [ ] Test OAuth flows with production URLs
- [ ] Verify Google Analytics is tracking

## Database Backups

### Manual Backup

```bash
docker compose exec postgres pg_dump -U postgres neighborhood_rater > backup.sql
```

### Restore from Backup

```bash
cat backup.sql | docker compose exec -T postgres psql -U postgres neighborhood_rater
```

### Automated Backups

Add a cron job to run daily backups:

```bash
0 2 * * * cd /path/to/app && docker compose exec postgres pg_dump -U postgres neighborhood_rater > backups/backup-$(date +\%Y\%m\%d).sql
```

## Monitoring

### Health Check

The app includes a health check endpoint:

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### Docker Health Checks

Both services include health checks:

- **App**: HTTP check on `/api/health` every 30s
- **PostgreSQL**: `pg_isready` check every 10s

View health status:

```bash
docker compose ps
```

### Logs

View application logs:

```bash
docker compose logs -f app
```

View database logs:

```bash
docker compose logs -f postgres
```

### Google Analytics

Monitor usage in Google Analytics dashboard:
- User sessions and page views
- Rating and comment submissions
- Map interactions
- Sign-in events

## Scaling Considerations

### Horizontal Scaling

To run multiple app instances:

1. Use an external PostgreSQL database
2. Run multiple app containers behind a load balancer
3. Ensure NextAuth sessions use JWT (already configured)

### Database Optimization

For high traffic:

- Add database indexes (already included in schema)
- Enable connection pooling (PgBouncer)
- Consider read replicas for queries
- Cache neighborhood data with Redis

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check database logs
docker compose logs postgres

# Test connection manually
docker compose exec postgres psql -U postgres -d neighborhood_rater -c "SELECT 1"
```

### OAuth Issues

- Verify redirect URIs match exactly (including http/https)
- Check OAuth credentials are correct
- Ensure `NEXTAUTH_URL` matches your domain
- Test each provider individually

### Prisma Issues

```bash
# Regenerate Prisma Client
docker compose exec app npx prisma generate

# Check migration status
docker compose exec app npx prisma migrate status

# Reset database (DANGER: deletes all data)
docker compose exec app npx prisma migrate reset
```

## Security Best Practices

1. **Never commit `.env` file to git**
2. **Use strong NEXTAUTH_SECRET** (32+ characters)
3. **Enable HTTPS in production** (use reverse proxy)
4. **Regularly update dependencies** (`npm audit`)
5. **Limit database user permissions**
6. **Set up firewall rules** (only expose ports 80/443)
7. **Enable rate limiting** (use nginx or Cloudflare)
8. **Regular security audits**

## Performance Optimization

1. **Enable Next.js caching** (already configured)
2. **Use CDN for static assets** (Cloudflare, CloudFront)
3. **Optimize images** (Next.js Image component)
4. **Database query optimization** (add indexes as needed)
5. **Enable gzip compression** (nginx)

## Updates and Maintenance

### Updating the Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up --build -d

# Run any new migrations
docker compose exec app npx prisma migrate deploy
```

### Database Maintenance

```bash
# Vacuum database (reclaim space)
docker compose exec postgres psql -U postgres -d neighborhood_rater -c "VACUUM ANALYZE"

# Check database size
docker compose exec postgres psql -U postgres -d neighborhood_rater -c "SELECT pg_size_pretty(pg_database_size('neighborhood_rater'))"
```

## Support

For issues or questions:
1. Check application logs
2. Verify environment configuration
3. Test database connectivity
4. Review OAuth setup
5. Check GitHub issues

## Next Steps

After deployment:
1. Test all features (ratings, comments, tags)
2. Verify Google Analytics is tracking
3. Set up monitoring alerts
4. Configure backup schedule
5. Document any custom changes
6. Set up CI/CD pipeline (optional)
