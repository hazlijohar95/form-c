# formc-api (Workers + D1)

## Provision (needs Cloudflare auth once)

```bash
cd workers/api
npx wrangler login
npx wrangler d1 create formc-engagements
# copy database_id into wrangler.toml
npx wrangler d1 execute formc-engagements --file schema.sql
npx wrangler dev --port 8787        # local API; web proxies /api → :8787
npx wrangler deploy                  # production worker
```

## Pages

```bash
cd apps/web
npm run build                        # dist/
npx wrangler pages deploy dist --project-name formc-studio
```

Web falls back to localStorage when /api is unreachable; the topbar
shows ○ local vs ● server (D1). Use “Push local → D1” after first deploy.
