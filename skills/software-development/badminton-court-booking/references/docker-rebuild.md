# Docker Rebuild — Badminton Project

Always use `--no-cache` after editing any file:

```bash
docker-compose -f docker-compose.yml build --no-cache frontend
docker-compose -f docker-compose.yml build --no-cache backend
```

If `.next` polluted (sub-routes 404 on production):
```bash
rm -rf .next
npm run build
npm start
```

Restart container after build:
```bash
docker-compose -f docker-compose.yml up -d --force-recreate --build frontend
```
