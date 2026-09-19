# TalentAI on AWS — single-EC2 deploy runbook (Mumbai / ap-south-1)

Deploys the whole app on **one EC2 `t3.small`** (Spring Boot JAR + Nginx serving the
React build) talking to **RDS MySQL**. Three of the steps also complete the
"Earn AWS credits" activities (+$20 each). Stay in **ap-south-1** the whole time.

Rough cost: EC2 t3.small (~$15/mo) + RDS db.t3.micro (~$13/mo) ≈ **$28/mo → ~$170 over 6 months**, inside your $200.

---

## Step 0 — Cost budget  ✅ credit activity ($20)
Billing and Cost Management → **Budgets** → Create budget → **Zero spend** or a **$20 monthly** cost budget → add your email for alerts. This completes the *"Set up a cost budget"* activity and protects you from overspend.

## Step 1 — Database: RDS MySQL  ✅ credit activity ($20)
RDS → **Create database** →
- Engine: **MySQL** (8.0.x) · Template: **Free tier** (or Dev/Test)
- DB instance: **db.t3.micro** · Storage: 20 GB gp3 (disable storage autoscaling)
- **Master username:** `admin` · set a strong **master password** (save it)
- **Initial database name:** `talentai`  (Additional configuration → *Initial database name*)
- **Public access: No** · Multi-AZ: **No** (single instance = cheaper)
- VPC: default. Create it.
- After it's created, note the **Endpoint** (e.g. `talentai.xxxx.ap-south-1.rds.amazonaws.com`).

> The app runs Flyway on first boot and creates all tables inside `talentai` — no manual schema step.

## Step 2 — Launch the app server: EC2  ✅ credit activity ($20)
EC2 → **Launch instance** →
- Name: `talentai` · AMI: **Amazon Linux 2023** · Type: **t3.small**
- **Key pair:** create/download one (e.g. `talentai-key.pem`) — you need it to upload files
- Network: default VPC, **Auto-assign public IP: Enable**
- **Security group** (create), inbound rules:
  - SSH `22` → **My IP** only
  - HTTP `80` → Anywhere (0.0.0.0/0)
  - HTTPS `443` → Anywhere (for later, optional)
- **Advanced details → User data:** paste the contents of [`user-data.sh`](user-data.sh)
- Launch. Note the instance's **Public IPv4 / DNS**.

## Step 3 — Let EC2 reach RDS
RDS console → your DB → **Connectivity & security → VPC security groups** → edit its inbound rules → add:
- Type **MySQL/Aurora (3306)**, Source = **the EC2 instance's security group**.

(Keeps the DB private; only your app server can reach it.)

## Step 4 — Build the two artifacts locally
On your machine (`D:\TalentAI`):
```bash
# Backend JAR
cd Backend && mvn clean package -DskipTests            # -> target/talentai-backend-0.1.0-SNAPSHOT.jar
# Frontend (production build already points VITE_API_BASE_URL=/api/v1)
cd ../Frontend && npm ci && npm run build              # -> dist/
```

## Step 5 — Upload artifacts to the instance
From `D:\TalentAI` (Git Bash / PowerShell with OpenSSH). Replace `EC2_HOST` and the key path:
```bash
KEY=~/Downloads/talentai-key.pem
HOST=ec2-user@EC2_HOST

scp -i "$KEY" Backend/target/talentai-backend-0.1.0-SNAPSHOT.jar "$HOST:/tmp/app.jar"
scp -i "$KEY" -r Frontend/dist/* "$HOST:/tmp/web/"        # create /tmp/web first if scp complains

ssh -i "$KEY" "$HOST" '
  sudo mv /tmp/app.jar /opt/talentai/app.jar &&
  sudo chown talentai:talentai /opt/talentai/app.jar &&
  sudo mkdir -p /var/www/talentai && sudo cp -r /tmp/web/* /var/www/talentai/'
```

## Step 6 — Fill in secrets on the server
```bash
ssh -i "$KEY" "$HOST"
sudo nano /etc/talentai/talentai.env
```
Set: `DB_HOST` = RDS endpoint, `DB_USERNAME=admin`, `DB_PASSWORD` = RDS master password,
`JWT_SECRET` = a fresh 48-char value (`openssl rand -base64 48`), `DB_USE_SSL=true`,
`CORS_ALLOWED_ORIGINS=http://<EC2 public DNS>`. Save (it's `chmod 600`, root-only, not in git).

## Step 7 — Start it
```bash
sudo systemctl start talentai
sudo systemctl status talentai          # should be active (running)
journalctl -u talentai -f               # watch it boot + run Flyway; Ctrl+C to stop tailing
```
Then open **`http://<EC2 public DNS>`** in a browser — the TalentAI landing page should load,
and `http://<EC2 public DNS>/api/actuator/health` should return `{"status":"UP"}`.

## Step 8 (optional) — HTTPS with a free cert
Point a domain's A-record at the EC2 IP, then:
```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## The two remaining credit activities (quick, throwaway) — +$40
- **Amazon Bedrock** → open the playground, run one prompt. (Enable model access first if prompted.)
- **AWS Lambda** → follow the built-in "Create a web app" guided tutorial.

That's **all five activities → +$100 → $200 total**, and TalentAI live.

---

### Managing it later
- Redeploy backend: rebuild JAR → `scp` to `/opt/talentai/app.jar` → `sudo systemctl restart talentai`.
- Redeploy frontend: rebuild → copy `dist/*` to `/var/www/talentai/`.
- **Stop paying while idle:** EC2 → Instance state → **Stop** (you only pay for storage while stopped). Start it again when you demo.
- Logs: `journalctl -u talentai -f`.

### Hardening upgrades (optional, later)
- Move `/etc/talentai/talentai.env` secrets to **SSM Parameter Store** and have the instance role read them at boot (the file becomes generated, not stored).
- Move resume storage from the local disk to **S3** if you ever run more than one instance.
