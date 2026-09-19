# Enabling the AI features (Amazon Bedrock)

TalentAI's two AI features — **candidate–job matching** (adds a written
assessment: summary + strengths + concerns on top of the deterministic score)
and **résumé parsing** (extracts skills / experience / education / certs /
companies from an uploaded PDF) — call **Amazon Bedrock** through the
model-agnostic **Converse API**. The model is chosen by config, so you can run an
Amazon model today and switch to Anthropic Claude later with a single env var and
no code change.

The app ships with AI **off** (`BEDROCK_ENABLED=false`). In that state everything
works on the deterministic heuristic, exactly as before. Turning it on is three
steps and needs **no code change and no AWS keys** — the EC2 instance role
provides credentials.

**Default model: `apac.amazon.nova-lite-v1:0`** — Amazon Nova Lite via the APAC
cross-region inference profile (the on-demand form for Nova in ap-south-1). It
needs no Anthropic use-case approval. Discover the live ids in your account with:

```bash
aws bedrock list-foundation-models --region ap-south-1 --by-output-modality TEXT \
  --query "modelSummaries[?modelLifecycle.status=='ACTIVE'].modelId" --output text
aws bedrock list-inference-profiles --region ap-south-1 \
  --query "inferenceProfileSummaries[].inferenceProfileId" --output text
```

> The older Amazon Titan Text G1 models are **retired** ("model version has
> reached the end of its life") — don't use them.

---

## 1. Model access

AWS **retired the "Model access" page**. Serverless foundation models are now
enabled automatically the first time you invoke them in an account — there is no
page to click through.

- **Amazon models (the default, Titan):** nothing to do. The first Converse call
  from the app enables the model account-wide.
- **Anthropic models (Claude):** first-time users must **submit use-case details**
  once (Bedrock → **Model catalog** → *Anthropic → Claude…* → *Submit use case
  details*). On a brand-new account this can return *"not authorized… create a
  support case"* — that's an account-level gate; see *Switching to Claude*. This
  is why the default is an Amazon model.

> Region: default is **ap-south-1 / Mumbai** (matches the EC2/RDS stack). Titan
> Text Express runs on-demand there. To use another Region, set `BEDROCK_REGION`
> and update the IAM policy ARN's region to match. If a chosen model isn't offered
> on-demand in a Region, the call fails and the app just falls back to the
> heuristic — harmless, but nothing lights up until the model/region line up.

## 2. Grant the EC2 instance role permission to call Bedrock

The backend runs on EC2 under an **IAM instance role**. Add an inline policy so
it may invoke the model:

1. Console → **IAM** → **Roles** → open the role attached to the TalentAI EC2
   instance (EC2 → the instance → **Security** tab → *IAM Role*).
2. **Add permissions → Create inline policy → JSON**.
3. Paste [`iam-bedrock-policy.json`](iam-bedrock-policy.json). It allows
   `bedrock:InvokeModel` + `bedrock:Converse` on **all** foundation models in
   ap-south-1, so it already covers both Titan and Claude — no edit needed when
   you switch models. Using another Region? Change the ARN's region.
   **Next → Create policy.**

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
| `BEDROCK_MODEL_ID` | `apac.amazon.nova-lite-v1:0` | Any live Converse-compatible model id (discover with the CLI below) |
| `BEDROCK_MAX_TOKENS` | `1024` | Max output tokens per call |
| `BEDROCK_TIMEOUT_MS` | `20000` | Per-call API timeout |

## Switching to Claude (once Anthropic access is granted)

The code uses the Converse API, so switching models is config-only — no
redeploy of code needed:

1. Complete the Anthropic use-case step (Bedrock → Model catalog → Claude →
   *Submit use case details*). On a new account that first returns *"not
   authorized"*, open the AWS **support case** it points you to; access is
   usually granted in 1–2 business days.
2. On the EC2 box, point the model id at Claude and restart:

```bash
sudo sed -i 's|^BEDROCK_MODEL_ID=.*|BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0|' /etc/talentai/talentai.env
sudo systemctl restart talentai
```

The IAM policy already covers Claude (it grants all foundation models in the
Region), so nothing else changes.

## Troubleshooting

Check `sudo journalctl -u talentai | grep -i bedrock` for the exact reason a call
fell back:

| Log / error | Meaning | Fix |
|-------------|---------|-----|
| `ResourceNotFoundException: This model version has reached the end of its life` | The model id is retired | Pick a live id from the CLI discovery above |
| `ValidationException: Operation not allowed` on **every** model/vendor | The AWS **account** isn't enabled for Bedrock inference (common on new/unverified accounts) | Open an AWS support case to enable Bedrock model invocation; usually 1–2 business days |
| `AccessDeniedException` | IAM role/policy missing or not yet propagated | Confirm the instance role has `bedrock:InvokeModel` (step 2) |
| `Bedrock returned non-JSON output` | Model answered but not as JSON | Harmless — falls back; try a stronger model id |

In all cases the request **silently falls back** to the deterministic result — the
app keeps working while you sort the cause.

## Failure behaviour

Every Bedrock call is best-effort. If AI is disabled, credentials/permissions are
missing, the model is throttled, or a call times out or returns junk, the request
**silently falls back** to the deterministic result and logs a warning. The user
never sees an error caused by the AI layer, and the numeric match score is always
the deterministic, explainable one — Bedrock only adds narrative around it.

## Cost

These models are inexpensive (fractions of a cent per matching/parse call at
these token sizes). Calls happen only when a recruiter opens match results or a
résumé is parsed — not on a schedule. Your AWS credits cover ordinary usage.
