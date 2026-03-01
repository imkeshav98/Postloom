# Postloom — TODO (Do Later)

## Analytics & Monitoring
- [ ] Add `ga4PropertyId` (numeric), `searchConsoleSiteUrl`, and `googleServiceAccountKey` (JSON) fields to `SiteConfig` schema for backend API access
- [ ] Implement step 11 (performance monitoring) to actually call Google Search Console & GA4 Data APIs
- [ ] Set up cron/scheduled trigger for daily MONITOR pipeline runs
- [ ] Add Google Analytics script injection to blog frontend using `googleAnalyticsId` from SiteConfig

## Admin App
- [ ] Create manual content plan form (New Plan button + page)
- [ ] Add blog creation wizard (niche → auto-run SETUP pipeline)
- [ ] Settings page: manage admin users (invite, deactivate)
- [ ] Bulk actions on posts (publish, archive, delete multiple)
- [ ] Post edit page: live markdown preview improvements

## Blog Frontend
- [ ] Add `generateStaticParams` for static generation of post/category/tag pages
- [ ] HTML sanitization for AI-generated markdown content
- [ ] Cache `getTag()` data fetching (currently uncached)
- [ ] Add sitemap.xml generation
- [ ] Add RSS feed

## Infrastructure
- [ ] Rename Docker container from `autoblog-db-1` to `postloom-db-1`
- [ ] Set up production deployment (Vercel for blog/admin, Railway/Fly for worker + Postgres)
- [ ] Add rate limiting to admin API routes
- [ ] Add proper error logging (Sentry or similar)

## SEO & Content
- [ ] AdSense slot configuration UI (beyond just the ID field)
- [ ] Auto-submit new URLs to Google Indexing API after publishing
- [ ] Canonical URL management for cross-posted content
