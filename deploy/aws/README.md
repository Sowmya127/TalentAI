# TalentAI on AWS — secrets & configuration

Passwords and keys live **only in AWS Secrets Manager**. ECS reads them at container
start and injects them so the app resolves its existing `${DB_PASSWORD}` / `${JWT_SECRET}`
placeholders. **No code change, no `.env`, no value in `application.yml`.** Non-secret
config is plain ECS `environment` (or SSM Parameter Store if you prefer).

## What goes where

| Key | Where | How |
|---|---|---|
| `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` | **Secrets Manager** (`talentai/prod/app`) | ECS `secrets` block → env at startup |
| `MAIL_USERNAME`/`MAIL_PASSWORD`, `OPENAI_API_KEY` | Secrets Manager (only when mail/AI are enabled) | same |
| `DB_HOST`, `DB_NAME`, `DB_USE_SSL`, pool sizes, JWT TTLs, CORS, log levels, Swagger/Actuator flags, multipart sizes | ECS `environment` | plain (not sensitive) |
| `VITE_API_BASE_URL`, `VITE_APP_NAME` | Frontend build (S3/CloudFront) | baked in at `npm run build` (public) |

## Steps

1. **Create the secret** (real values never touch the repo):
   ```bash
   DB_PASSWORD='...' JWT_SECRET="$(openssl rand -base64 48)" ./create-secret.sh us-east-1
   ```
   Note the returned ARN (looks like `...:secret:talentai/prod/app-AbCdEf`).

2. **Wire the task definition** — in [ecs-task-definition.json](ecs-task-definition.json), replace the
   `valueFrom` ARNs with your secret ARN. The `:DB_PASSWORD::` suffix selects that one JSON key
   from the secret (`<secret-arn>:<json-key>:<version-stage>:<version-id>`).

3. **Grant the execution role access** — attach [iam-execution-role-policy.json](iam-execution-role-policy.json)
   to `talentai-ecs-execution-role` (`secretsmanager:GetSecretValue`, plus `kms:Decrypt` only if you
   used a customer-managed KMS key). This is the role ECS uses to pull secrets *before* the container runs.

4. **Register & deploy**:
   ```bash
   aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
   aws ecs update-service --cluster talentai --service talentai-backend --task-definition talentai-backend
   ```

## Recommended: let RDS own the DB credential
Instead of putting `DB_PASSWORD` in your own secret, have **RDS manage it** (RDS → "Manage master
credentials in Secrets Manager", or a rotation-enabled secret). Then point the task's `secrets` at
that RDS-managed secret's `username` / `password` keys:
```json
{ "name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:rds!db-XXXX:password::" },
{ "name": "DB_USERNAME", "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:rds!db-XXXX:username::" }
```
You get automatic rotation for free, and you never type the password anywhere.

## Rotation
- App secrets: `./create-secret.sh` again (it does `put-secret-value`), then a new ECS deployment so
  tasks pick up the new value. (ECS reads secrets at task start, not live — force a new deployment.)
- RDS-managed secret: rotation is automatic; still force a deployment for tasks to re-read.

## Notes tied to this codebase
- `SWAGGER_UI_ENABLED=false` and `ACTUATOR_HEALTH_DETAILS=never` in prod (already set here).
- `DB_USE_SSL=true` — RDS enforces TLS.
- **Resume uploads use local disk** (`FILE_UPLOAD_PATH`). With >1 task, mount **EFS** at that path
  (the task def points it at `/mnt/uploads/resumes`) or refactor `CandidateService.uploadResume` to S3.
- Local development is unaffected — it still uses `Backend/.env`; only the **deployed** app uses Secrets Manager.
