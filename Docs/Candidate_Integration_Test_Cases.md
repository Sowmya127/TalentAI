# TalentAI — Candidate Module Integration Test Cases

Full-stack integration tests: **REST Controller → Spring Security → JWT → Service → Repository → MySQL**, run against a **MySQL Testcontainer** (no H2) with **Flyway** migrations V1–V29 and Hibernate `ddl-auto: validate`.

- **Test type:** `@SpringBootTest` + `@AutoConfigureMockMvc` + `@Testcontainers` (MySQL 8.0)
- **Auth:** real JWT minted with the app's secret; the filter reloads authorities from the DB
- **Validation failures return HTTP 422** (`VALIDATION_FAILED`), not 400 — this is the app's actual contract (`GlobalExceptionHandler`)
- **Location:** `Backend/src/test/java/com/talentai/candidate/integration/`

> **Prerequisite:** Docker must be running on the machine executing the tests (Testcontainers starts a real MySQL container).

## Legend
Priority: **P1** critical · **P2** high · **P3** medium

---

## 1. Candidate Registration & Profile (`CandidateControllerIT`)

| TC ID | Module | Feature | Scenario | Preconditions | Test Steps | Expected Result | Priority |
|------|--------|---------|----------|---------------|-----------|-----------------|----------|
| CAND-IT-001 | Candidate | Registration | Register + login candidate | Candidate role seeded (V25) | POST `/v1/auth/register`; then POST `/v1/auth/login` | 201 `{userId, message}`; 200 `{token, roles:[ROLE_CANDIDATE]}` | P1 |
| CAND-IT-002 | Candidate | Registration | Duplicate email | A user already registered | POST `/v1/auth/register` twice, same email | 2nd → **409** `DUPLICATE_RESOURCE` | P1 |
| CAND-IT-003 | Candidate | Registration | Invalid email | — | POST register with `email=not-an-email` | **422** `VALIDATION_FAILED` | P2 |
| CAND-IT-004 | Candidate | Registration | Missing mandatory fields | — | POST register without lastName/password | **422** | P2 |
| CAND-IT-005 | Candidate | Profile create | Valid create | User registered + JWT | POST `/v1/candidates` `{userId,phone,location}` | 201 `{candidateId, "Candidate profile created."}`; row persisted | P1 |
| CAND-IT-006 | Candidate | Profile create | Missing userId | JWT | POST `/v1/candidates` `{userId:null}` | **422** `VALIDATION_FAILED` | P1 |
| CAND-IT-007 | Candidate | Profile create | Duplicate profile | Profile already exists for user | POST `/v1/candidates` again | **409** `DUPLICATE_RESOURCE` | P1 |
| CAND-IT-008 | Candidate | Profile create | Unknown user | JWT; `userId` not in DB | POST `/v1/candidates` `{userId:9999999}` | **404** `RESOURCE_NOT_FOUND` | P2 |
| CAND-IT-009 | Candidate | Get by user id | `/me` | Profile exists + JWT | GET `/v1/candidates/me` | 200; own `candidateId` | P1 |
| CAND-IT-010 | Candidate | Get by id | Existing candidate | Profile exists + JWT | GET `/v1/candidates/{id}` | 200; profile body | P1 |
| CAND-IT-011 | Candidate | Get by id | Not found | JWT | GET `/v1/candidates/9999999` | **404** `RESOURCE_NOT_FOUND` | P2 |
| CAND-IT-012 | Candidate | Update | Valid update | Profile exists + JWT | PUT `/v1/candidates/{id}` `{location,...}`; GET back | 200; `location` persisted to MySQL | P1 |
| CAND-IT-013 | Candidate | REST | Response headers | Profile exists | GET `/v1/candidates/{id}` | 200; `Content-Type: application/json` | P3 |
| CAND-IT-014 | Candidate | REST | Response time | Profile exists | GET `/v1/candidates/{id}` | 200; < 5000 ms | P3 |

## 2. Security (`CandidateSecurityIT`)

| TC ID | Module | Feature | Scenario | Preconditions | Test Steps | Expected Result | Priority |
|------|--------|---------|----------|---------------|-----------|-----------------|----------|
| CAND-IT-020 | Candidate | AuthN | Missing JWT | — | GET `/v1/candidates/me` no header | **401** `UNAUTHENTICATED` | P1 |
| CAND-IT-021 | Candidate | AuthN | Invalid JWT | — | GET with `Authorization: Bearer garbage` | **401** | P1 |
| CAND-IT-022 | Candidate | AuthN | Expired JWT | Real user exists | GET with a correctly-signed but expired token | **401** | P1 |
| CAND-IT-023 | Candidate | AuthZ | Recruiter views candidate | Candidate exists; user has RECRUITER role | GET `/v1/candidates/{id}` | 200 | P2 |
| CAND-IT-024 | Candidate | AuthZ | Admin manages candidate | Candidate exists; user has HR_ADMIN role | PUT `/v1/candidates/{id}` | 200 | P2 |
| CAND-IT-025 | Candidate | AuthZ | Any authenticated role can read | Interviewer role | GET `/v1/candidates/{id}` | 200 *(gap: no role restriction)* | P2 |
| CAND-IT-026 | Candidate | AuthZ | Candidate reads another candidate | Two candidates exist | GET other's `/v1/candidates/{id}` | **200** *(⚠ gap: no ownership check — see Known Gaps)* | P1 |

## 3. Repository & Database (`CandidateRepositoryIT`, transactional)

| TC ID | Module | Feature | Scenario | Preconditions | Test Steps | Expected Result | Priority |
|------|--------|---------|----------|---------------|-----------|-----------------|----------|
| CAND-IT-030 | Candidate | Persistence | Insert + load | User exists | `save()` then `findById()` | Row persisted; fields round-trip | P1 |
| CAND-IT-031 | Candidate | Custom query | `findByUserId` | Candidate saved | `findByUserId(userId)` | Present; correct user | P1 |
| CAND-IT-032 | Candidate | Custom query | `existsByUserId` | — | before/after save | false → true; false for unknown | P2 |
| CAND-IT-033 | Candidate | Pagination/Sort | Page + sort by id | ≥3 candidates | `findAll(PageRequest 0,2 sort id)` | size 2; ids ascending; total ≥3 | P2 |
| CAND-IT-034 | Candidate | Constraint | Unique `user_id` | Candidate saved | `saveAndFlush` 2nd with same user_id | **DataIntegrityViolationException** (rollback) | P1 |
| CAND-IT-035 | Candidate | Constraint | FK `user_id` | — | `saveAndFlush` with user_id=9999999 | **DataIntegrityViolationException** | P1 |

## 4. Search / Filter / Pagination / Sort (`CandidateSearchIT`, transactional)

> No candidate search REST endpoint exists — validated at the data-access layer (see Known Gaps).

| TC ID | Module | Feature | Scenario | Preconditions | Test Steps | Expected Result | Priority |
|------|--------|---------|----------|---------------|-----------|-----------------|----------|
| CAND-IT-040 | Candidate | Filter | Filter by user id | Several candidates | `findByUserId(target)` | Only the target row | P2 |
| CAND-IT-041 | Candidate | Pagination | Page navigation | ≥2 candidates | `findAll` page 0 vs page 1, size 1 | Distinct rows; total ≥2 | P2 |
| CAND-IT-042 | Candidate | Sorting | Sort by experience desc | Varied experience | `findAll(sort totalExperience desc)` | List sorted descending | P2 |

## 5. Resume (`CandidateResumeIT`)

| TC ID | Module | Feature | Scenario | Preconditions | Test Steps | Expected Result | Priority |
|------|--------|---------|----------|---------------|-----------|-----------------|----------|
| CAND-IT-050 | Candidate | Resume upload | Valid PDF | Candidate + JWT | multipart POST `/resume` (`resume`=cv.pdf) | 201 `{fileName, status:"Uploaded"}` | P1 |
| CAND-IT-051 | Candidate | Resume upload | Any format accepted | Candidate + JWT | multipart POST `.txt` | 201 *(⚠ gap: no format/size validation)* | P2 |
| CAND-IT-052 | Candidate | Resume parse | Parse | Candidate + JWT | POST `/resume/parse` | 200 `status:"PendingReview"`, `extracted` present | P2 |
| CAND-IT-053 | Candidate | Resume upload | Unknown candidate | JWT | multipart POST to id 9999999 | **404** `RESOURCE_NOT_FOUND` | P2 |
| CAND-IT-054 | Candidate | Resume upload | Unauthenticated | — | multipart POST no JWT | **401** | P1 |

## 6. Education CRUD (`CandidateEducationIT`)

| TC ID | Module | Feature | Scenario | Preconditions | Test Steps | Expected Result | Priority |
|------|--------|---------|----------|---------------|-----------|-----------------|----------|
| CAND-IT-060 | Candidate | Education | Add | Candidate + JWT | POST `/education` | 201; `degree`, `endYear` | P1 |
| CAND-IT-061 | Candidate | Education | start_year + field (V29) | Candidate + JWT | POST then GET | `startYear` & `fieldOfStudy` persisted | P2 |
| CAND-IT-062 | Candidate | Education | List | 1 added | GET `/education` | array length 1 | P2 |
| CAND-IT-063 | Candidate | Education | Update | Entry exists | PUT `/education/{id}` | 200; updated fields | P1 |
| CAND-IT-064 | Candidate | Education | Delete | Entry exists | DELETE then GET | 204; list empty | P1 |
| CAND-IT-065 | Candidate | Education | Missing degree | Candidate + JWT | POST `degree=""` | **422** `VALIDATION_FAILED` | P1 |
| CAND-IT-066 | Candidate | Education | Unauthenticated | — | GET `/education` no JWT | **401** | P2 |

## 7. Work Experience CRUD (`CandidateExperienceIT`)

| TC ID | Module | Feature | Scenario | Preconditions | Test Steps | Expected Result | Priority |
|------|--------|---------|----------|---------------|-----------|-----------------|----------|
| CAND-IT-070 | Candidate | Experience | Add | Candidate + JWT | POST `/work-experience` | 201; `companyName`, `jobTitle` | P1 |
| CAND-IT-071 | Candidate | Experience | Current role | Candidate + JWT | POST `isCurrent=true`, no endDate | 201; `isCurrent=true`, no `endDate` | P2 |
| CAND-IT-072 | Candidate | Experience | List | 1 added | GET | length 1 | P2 |
| CAND-IT-073 | Candidate | Experience | Update | Entry exists | PUT `/work-experience/{id}` | 200; updated | P1 |
| CAND-IT-074 | Candidate | Experience | Delete | Entry exists | DELETE then GET | 204; empty | P1 |
| CAND-IT-075 | Candidate | Experience | Missing companyName | Candidate + JWT | POST `companyName=""` | **422** | P1 |

## 8. Certification CRUD (`CandidateCertificationIT`)

| TC ID | Module | Feature | Scenario | Preconditions | Test Steps | Expected Result | Priority |
|------|--------|---------|----------|---------------|-----------|-----------------|----------|
| CAND-IT-080 | Candidate | Certification | Add | Candidate + JWT | POST `/certifications` | 201; `name`, `issuer` | P1 |
| CAND-IT-081 | Candidate | Certification | List | 1 added | GET | length 1 | P2 |
| CAND-IT-082 | Candidate | Certification | Delete | Entry exists | DELETE then GET | 204; empty | P1 |
| CAND-IT-083 | Candidate | Certification | Missing name | Candidate + JWT | POST `name=""` | **422** | P1 |

## 9. Skills (`CandidateSkillIT`)

| TC ID | Module | Feature | Scenario | Preconditions | Test Steps | Expected Result | Priority |
|------|--------|---------|----------|---------------|-----------|-----------------|----------|
| CAND-IT-090 | Candidate | Skills | Set skills | Candidate + JWT | PUT `/skills` `["Java","SQL"]` | 200; both present | P1 |
| CAND-IT-091 | Candidate | Skills | Replace | Skills set | PUT `["Python","AWS"]`; GET | Python/AWS present; Java gone | P1 |
| CAND-IT-092 | Candidate | Skills | Re-add same skill | `["Java"]` set | PUT `["Java","SQL"]` | 200 (no duplicate-key 500) — regression | P1 |
| CAND-IT-093 | Candidate | Skills | Null skills | Candidate + JWT | PUT `{skills:null}` | **422** `VALIDATION_FAILED` | P1 |
| CAND-IT-094 | Candidate | Skills | Unauthenticated | — | GET `/skills` no JWT | **401** | P2 |

---

## Known gaps & scope notes (verified against production code — NOT modified)

These reflect the application's *actual* behaviour. Tests assert what the app really does; where behaviour differs from the brief, it is documented rather than "fixed" (production code must not change).

1. **No ownership check on candidate endpoints.** `CandidateController` has no `@PreAuthorize` and no owner comparison, so a candidate reading another candidate's profile returns **200, not 403** (CAND-IT-026). Role-based access is *authentication-only* (any valid JWT). To enforce ownership/roles, add `@PreAuthorize`/checks in the controller — the affected tests then flip to 403.
2. **No candidate search / list / pagination REST endpoint** and **no delete-candidate endpoint.** Section 4 therefore validates pagination/filter/sort at the repository layer.
3. **No resume format/size validation** in `CandidateService.uploadResume` — any file is accepted (CAND-IT-051).
4. **Validation → HTTP 422** (`VALIDATION_FAILED`), per `GlobalExceptionHandler` (not 400).
5. **Candidate DTO has no email/DOB/experience fields** (`CreateCandidateRequest = {userId, phone, location}`). "Invalid email / duplicate email" is tested at **registration** (`/v1/auth/register`); DOB/experience validation is N/A for the candidate create contract.
6. **Duplicate phone** is not a constraint (candidate `phone` lives on `app_user`, not unique) — not asserted.
7. "Database unavailable / unexpected exception → 500" is intentionally not asserted as an automated IT (would require faulting the container mid-run); the `GlobalExceptionHandler` maps them to 500 `INTERNAL_ERROR`.
