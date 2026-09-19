# Enabling the AI features (Amazon Bedrock)

TalentAI's two AI features — **candidate–job matching** (adds a written
assessment: summary + strengths + concerns on top of the deterministic score)
and **résumé parsing** (extracts skills / experience / education / certs /
companies from an uploaded PDF) — call **Amazon Bedrock** with an Anthropic
Claude model.

The app ships with AI **off** (`BEDROCK_ENABLED=false`). In that state everything
works on the deterministic heuristic, exactly as before. Turning it on is three
steps and needs **no code change and no AWS keys** — the EC2 instance role
provides credentials.

---

## 1. Enable Claude model access (once per account)

AWS **retired the "Model access" page**. Serverless foundation models are now
enabled automatically the first time you invoke them in an account — there is no
page to click through anymore. **One exception applies to us:** Anthropic models
require first-time users to **submit use-case details** before the first invoke
will succeed.

1. AWS Console → **Amazon Bedrock** → set the Region (top-right) to the one you'll
   use (default here is **ap-south-1 / Mumbai**, matching the EC2/RDS stack; Claude
   3 Haiku runs on-demand there).
2. Left nav → **Model catalog** → open **Anthropic → Claude 3 Haiku**. If a
   **Submit use case details** (Anthropic access request) form appears, fill it in
   once — a short questionnaire (company, use case). Approval is typically quick.
3. That's it — no "grant access" step. The first `InvokeModel` call from the app
   enables the model account-wide.

> Using a different Region (e.g. us-east-1)? Just set `BEDROCK_REGION` to match —
> enablement is account-wide, but the model must be **offered** in that Region. If
> Claude 3 Haiku isn't available on-demand there, either set
> `BEDROCK_REGION=us-east-1` (cross-Region calls work) or use an inference-profile
> model id. Update the IAM policy ARN's region to match too.
>
> If the very first invoke returns `AccessDeniedException` mentioning the model,
> it's this Anthropic use-case step (step 2) not yet completed — the app just
> falls back to the heuristic until it is.

## 2. Grant the EC2 instance role permission to call Bedrock

The backend runs on EC2 under an **IAM instance role**. Add an inline policy so
it may invoke the model:

1. Console → **IAM** → **Roles** → open the role attached to the TalentAI EC2
   instance (EC2 → the instance → **Security** tab → *IAM Role*).
2. **Add permissions → Create inline policy → JSON**.
3. Paste [`iam-bedrock-policy.json`](iam-bedrock-policy.json). If your
   `BEDROCK_REGION`/model differ, edit the `Resource` ARN's region and model id
   to match (or use `"Resource": "*"` while testing). **Next → Create policy.**

No access keys are stored anywhere — the SDK's default credential chain picks up
the instance role automatically.

## 3. Flip the switch and restart

On the EC2 box, edit the backend env file and set `BEDROCK_ENABLED=true`
(the keys are already present, added by `ec2/user-data.sh`):

```bash
sudo sed -i 's/^BEDROCK_ENABLED=.*/BEDROCK_ENABLED=true/' /etc/talentai/talentai.env
sudo systemctl restart talentai
```

Confirm it came back up:

```bash
curl -fsS http://localhost/api/actuator/health && echo OK
```

---

## Verifying

- **Matching** — open a job's **AI Match Results**. The "AI Ranking Summary" card
  now shows a written assessment of the top candidate plus *Strengths* /
  *Concerns* chips. (Endpoint: `POST /api/v1/ai/candidate-match`.)
- **Résumé parsing** — upload a **PDF** résumé for a candidate, then trigger parse
  (`POST /api/v1/candidates/{id}/resume/parse`). Extracted fields now come from
  the résumé text rather than only the stored profile. Word (.doc/.docx) files
  fall back to the deterministic parse (PDF only for the AI path).

## Env vars (reference)

| Var | Default | Meaning |
|-----|---------|---------|
| `BEDROCK_ENABLED` | `false` | Master switch for both AI features |
| `BEDROCK_REGION` | `ap-south-1` | Bedrock Region (must offer the model) |
| `BEDROCK_MODEL_ID` | `anthropic.claude-3-haiku-20240307-v1:0` | Model to invoke |
| `BEDROCK_MAX_TOKENS` | `1024` | Max output tokens per call |
| `BEDROCK_TIMEOUT_MS` | `20000` | Per-call API timeout |

## Failure behaviour

Every Bedrock call is best-effort. If AI is disabled, credentials/permissions are
missing, the model is throttled, or a call times out or returns junk, the request
**silently falls back** to the deterministic result and logs a warning. The user
never sees an error caused by the AI layer, and the numeric match score is always
the deterministic, explainable one — Bedrock only adds narrative around it.

## Cost

Claude 3 Haiku is inexpensive (fractions of a cent per matching/parse call at
these token sizes). Calls happen only when a recruiter opens match results or a
résumé is parsed — not on a schedule. Your AWS credits cover ordinary usage.
