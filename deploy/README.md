# Deploy (Phase 1) — K2Labs

This document describes how to build and run the K2Labs site container locally on the server and how to reverse-proxy it from your external Nginx.

Prerequisites
- Docker installed on the server
- (Optional) docker-compose if you use `docker-compose.yml`
- Your external reverse proxy (Nginx) will forward traffic to this server's port `3000`

Build the image
```bash
# from repo root (where Dockerfile is located, now in deploy/)
cd deploy
docker build -t k2labs:latest .

# run container, map host port 3000 -> container 3000
docker run -d --name k2labs -p 3000:3000 --restart unless-stopped k2labs:latest

#Check status & logs

docker ps --filter name=k2labs
docker logs -f k2labs
# quick health check
curl -I http://localhost:3000/

# rebuild image and redeploy container
cd deploy
docker build -t k2labs:latest .
docker stop k2labs || true
docker rm k2labs || true
docker run -d --name k2labs -p 3000:3000 --restart unless-stopped k2labs:latest

# from repo root (deploy/docker-compose.yml)
cd deploy
docker-compose up -d --build
docker-compose logs -f
docker-compose down