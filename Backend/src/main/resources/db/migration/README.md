# Migration notes

**V27 is intentionally missing.** It originally held 10 stored
procedures (`sp_register_user`, `sp_apply_for_job`,
`sp_shortlist_candidate`, etc.), ported from the reviewed SQL Server
design for parity. They were removed once the Spring service layer
started being built: `AuthServiceImpl`/`UserServiceImpl` already
implement the same logic directly through JPA repositories, and having
both copies live was a real risk, not just duplication -- anything
calling a stored proc directly bypasses whatever the Java layer does
around it (audit logging today, notifications later).

The business rules those procedures encoded aren't lost -- they're the
spec for what each domain's `@Service` class needs to implement:

| Removed procedure | Rule it enforced | Owning future service |
|---|---|---|
| `sp_apply_for_job` | Job must be `Open`; blocks duplicate applications | `ApplicationService` |
| `sp_shortlist_candidate` | All mandatory screening questions must pass first (BR-035) | `ApplicationService` |
| `sp_withdraw_application` | Sets status to `Withdrawn` | `ApplicationService` |
| `sp_schedule_interview` | Application must be in an interview-eligible stage | `InterviewService` |
| `sp_submit_feedback` | One feedback row per interviewer; writes competency ratings | `InterviewService` |
| `sp_generate_offer` | Application must be `Selected`; blocks a second offer | `OfferService` |
| `sp_record_approval` | Advances Job/Offer status on Approved/Rejected | `ApprovalService` (or folded into Job/Offer services) |
| `sp_create_job`, `sp_register_user`, `sp_submit_screening_response` | Already fully superseded -- see `auth`/`user` packages for the pattern | `JobService`, done, `ScreeningService` |

Triggers (V28) are unaffected by this -- audit logging stays
DB-owned for the 8 tables listed there, and is the one thing that is
*not* duplicated in Java (the sole exception, `app_user`, is handled
by `AuditService` precisely because it has no DB trigger).
