#!/bin/bash
# EC2 user-data bootstrap for TalentAI (Amazon Linux 2023, t3.small).
# Paste this into the "User data" box when launching the instance. It installs
# Java 17 + Nginx, adds swap, and sets up the systemd service + Nginx site.
# You then upload the JAR, the React build, and the secrets file (see README.md),
# and start the service. Runs once, as root, on first boot.
set -euxo pipefail

# --- 2 GB swap so the JVM + build headroom don't OOM on a 2 GB box ---
if [ ! -f /swapfile ]; then
  dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile; mkswap /swapfile; swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# --- Packages ---
dnf update -y
dnf install -y java-17-amazon-corretto-headless nginx

# --- Directories ---
mkdir -p /opt/talentai /var/www/talentai /etc/talentai /var/talentai/uploads/resumes
useradd --system --no-create-home --shell /sbin/nologin talentai || true
chown -R talentai:talentai /opt/talentai /var/talentai

# --- Secrets/config file (you fill this in after boot; NOT in git) ---
if [ ! -f /etc/talentai/talentai.env ]; then
  cat > /etc/talentai/talentai.env <<'ENVEOF'
# Fill these in (chmod 600). systemd loads them into the app's environment.
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080
DB_HOST=REPLACE_WITH_RDS_ENDPOINT
DB_PORT=3306
DB_NAME=talentai
DB_USERNAME=admin
DB_PASSWORD=REPLACE_WITH_RDS_PASSWORD
DB_USE_SSL=true
JWT_SECRET=REPLACE_WITH_FRESH_48_CHAR_SECRET
FILE_UPLOAD_PATH=/var/talentai/uploads/resumes
CORS_ALLOWED_ORIGINS=http://REPLACE_WITH_PUBLIC_HOST
SWAGGER_UI_ENABLED=false
ACTUATOR_HEALTH_DETAILS=never
# --- AI (Amazon Bedrock). Off by default; the app runs fully on the
# deterministic heuristic. Flip to true only AFTER (1) granting the EC2 instance
# role bedrock:InvokeModel and (2) enabling Claude model access in this region.
# See deploy/aws/bedrock/README.md. No AWS keys here — creds come from the role.
BEDROCK_ENABLED=false
BEDROCK_REGION=ap-south-1
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
ENVEOF
  chmod 600 /etc/talentai/talentai.env
fi

# --- systemd service for the Spring Boot JAR ---
cat > /etc/systemd/system/talentai.service <<'SVCEOF'
[Unit]
Description=TalentAI backend
After=network.target

[Service]
User=talentai
EnvironmentFile=/etc/talentai/talentai.env
WorkingDirectory=/opt/talentai
ExecStart=/usr/bin/java -jar /opt/talentai/app.jar
SuccessExitStatus=143
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

# --- Nginx: serve the React build, proxy /api to the JAR (same origin) ---
cat > /etc/nginx/conf.d/talentai.conf <<'NGXEOF'
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 20m;           # allow resume uploads

    root /var/www/talentai;
    index index.html;

    # SPA routing — unknown paths fall back to index.html
    location / {
        try_files $uri /index.html;
    }

    # Backend (app context-path is /api, so keep the /api prefix)
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
NGXEOF

# Replace the stock nginx.conf with a clean one that has NO server block of its own
# (our conf.d/talentai.conf is the only server). Editing the shipped file with sed is
# fragile — it left an orphaned "location" directive — so we overwrite it wholesale.
cat > /etc/nginx/nginx.conf <<'NGXMAINEOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /run/nginx.pid;
include /usr/share/nginx/modules/*.conf;
events { worker_connections 1024; }
http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;
    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    types_hash_max_size 4096;
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    include /etc/nginx/conf.d/*.conf;
}
NGXMAINEOF

systemctl daemon-reload
systemctl enable nginx
systemctl restart nginx
systemctl enable talentai   # will start once /opt/talentai/app.jar exists
echo "Bootstrap complete. Upload app.jar + web build + fill /etc/talentai/talentai.env, then: systemctl start talentai"
