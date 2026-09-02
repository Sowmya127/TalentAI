/* =====================================================================
   TalentAI Recruitment Application - SQL Server Database Schema
   Version 2.0 -- Revised against BRD/FRD gap review
   =====================================================================
   Target platform : Microsoft SQL Server 2016+ (uses FOR JSON in triggers)
   Companion to    : TalentAI Data Model, Logical/Physical ER Diagrams,
                      BRD/FRD, Business Rules & Acceptance Criteria

   CHANGES FROM v1.0 (this revision closes gaps found reviewing the
   schema against the actual BRD/FRD, not just the 18-entity list):

   NEW TABLES
   - ScreeningQuestion, ScreeningResponse   (BRD Phase 5 / FR-10, FR-11,
     BR-032..BR-035 -- was entirely missing; sp_ShortlistCandidate had
     no way to check mandatory eligibility criteria)
   - ApprovalHistory                        (FR-REQ-02, FR-OFF-02 --
     multi-level approval chains for Job and Offer; polymorphic via
     EntityType/EntityID, same pattern already used by AuditLog)
   - CandidateDemographic                   (FR-AI-08, FR-RPT-04 -- DEI
     self-ID data, kept in its own table because BRD Section 10.2
     classifies it "Highly Confidential -- Restricted, Aggregated
     Reporting Only." Apply row-level security / column encryption at
     the database layer before production use; this schema only
     provides the structural separation.)
   - InterviewCompetencyRating               (FR-INT-05 -- replaces the
     three fixed rating columns that used to live on InterviewFeedback
     with a configurable per-competency rubric)

   CHANGED COLUMNS
   - Job: added CostCenter, Headcount, BusinessJustification (FR-REQ-01)
   - Job.JobStatus CHECK list changed to match FR-REQ-04 exactly:
     Draft, Pending Approval, Approved, Open, On Hold, Closed, Cancelled
     (previously Draft/Published/Closed/Archived)
   - Application: added ConsentGiven, ConsentDate, ConsentVersion
     (FR-APP-05, NFR-PRIV-04)
   - Application.ApplicationStatus CHECK list gained 'Withdrawn'
     (FR-APP-07 -- was structurally impossible to record before)
   - Offer: added DeclineReason (FR-OFF-07), SignedDocumentURL (FR-OFF-03)
   - Offer.OfferStatus CHECK list changed to match FR-OFF-04 exactly:
     Draft, Pending Approval, Sent, Accepted, Declined, Expired, Rescinded
     (previously used 'Rejected' instead of 'Declined', no 'Rescinded')
   - JobSkill: added Weight (FR-AI-04 -- configurable weighted criteria;
     MandatoryFlag is retained separately, since "must-have" and
     "how much this counts" are different concepts)
   - User: added ExternalIdPSubjectID (FR-ADM-02 -- SAML/OIDC mapping)
   - InterviewFeedback: TechnicalRating/CommunicationRating/
     ProblemSolvingRating columns REMOVED -- replaced by
     InterviewCompetencyRating (see NEW TABLES above)

   CARRIED-FORWARD SCOPE NOTES FROM v1.0 (still apply):
   1. Interview -> InterviewFeedback remains 1:M, not 1:1 as originally
      specified, for panel-interview support (FR-INT-06).
   2. Application -> AIMatchDetail remains 1:M, not 1:1, to preserve a
      full scoring history for audit (FR-AI-10).
   3. UQ_Application_Candidate_Job still blocks duplicate applications
      outright; move to application logic if the configurable exception
      in the business rules is needed.
   4. Foreign keys are added in a separate ALTER TABLE section after all
      tables exist.
   5. AuditLog is append-only by convention; its own audit columns are
      structurally present but should never be written to by app code.

   STILL NOT MODELED (flagged, not fixed in this pass -- ask if wanted):
   - Background Verification / Onboarding (FR-BGV, FR-ONB): excluded
     per the unresolved BRD scope conflict (Sec 5.8 vs Sec 7.9) flagged
     repeatedly earlier in this project's documents.
   - Requisition templates (FR-REQ-03) and budget/headcount plan
     linkage (FR-REQ-06) -- both Should/Could-have, not Must-have.
   - Column-level encryption / dynamic data masking for compensation,
     background-check, and demographic fields (NFR-SEC-04) -- this is a
     database-configuration step on top of the schema, not a table
     change.
   ===================================================================== */

/* =====================================================================
   SECTION 1: DATABASE CREATION
   ===================================================================== */
IF DB_ID(N'TalentAI') IS NULL
BEGIN
    CREATE DATABASE TalentAI;
END
GO

USE TalentAI;
GO

/* =====================================================================
   SECTION 2: TABLES
   (Primary keys, NOT NULL, DEFAULT, CHECK, UNIQUE inline.
    FOREIGN KEY constraints are added in Section 3.)
   ===================================================================== */

-- ---------------------------------------------------------------------
-- User  (bracketed: USER is a reserved word in T-SQL)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.[User]
(
    UserID                BIGINT          IDENTITY(1,1) NOT NULL,
    FirstName              NVARCHAR(50)    NOT NULL,
    LastName                NVARCHAR(50)    NOT NULL,
    Email                     NVARCHAR(150)   NOT NULL,
    PasswordHash               NVARCHAR(255)   NOT NULL,
    PhoneNumber                  NVARCHAR(20)    NULL,
    UserStatus                     NVARCHAR(20)    NOT NULL CONSTRAINT DF_User_UserStatus DEFAULT ('Active'),
    ExternalIdPSubjectID              NVARCHAR(255)   NULL,  -- SAML/OIDC subject identifier (FR-ADM-02)
    CreatedDate                         DATETIME2       NOT NULL CONSTRAINT DF_User_CreatedDate DEFAULT (GETDATE()),
    CreatedBy                            BIGINT          NULL,
    ModifiedDate                           DATETIME2       NULL,
    ModifiedBy                              BIGINT          NULL,
    IsActive                                 BIT             NOT NULL CONSTRAINT DF_User_IsActive DEFAULT (1),
    CONSTRAINT PK_User PRIMARY KEY CLUSTERED (UserID),
    CONSTRAINT UQ_User_Email UNIQUE (Email),
    CONSTRAINT CK_User_UserStatus CHECK (UserStatus IN ('Active','Inactive','Suspended'))
);
GO

-- ---------------------------------------------------------------------
-- Role
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Role
(
    RoleID          INT             IDENTITY(1,1) NOT NULL,
    RoleName        NVARCHAR(50)    NOT NULL,
    Description     NVARCHAR(200)   NULL,
    CreatedDate     DATETIME2       NOT NULL CONSTRAINT DF_Role_CreatedDate DEFAULT (GETDATE()),
    CreatedBy       BIGINT          NULL,
    ModifiedDate    DATETIME2       NULL,
    ModifiedBy      BIGINT          NULL,
    IsActive        BIT             NOT NULL CONSTRAINT DF_Role_IsActive DEFAULT (1),
    CONSTRAINT PK_Role PRIMARY KEY CLUSTERED (RoleID),
    CONSTRAINT UQ_Role_RoleName UNIQUE (RoleName)
);
GO

-- ---------------------------------------------------------------------
-- Skill
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Skill
(
    SkillID         INT             IDENTITY(1,1) NOT NULL,
    SkillName       NVARCHAR(80)    NOT NULL,
    Category        NVARCHAR(50)    NULL,
    CreatedDate     DATETIME2       NOT NULL CONSTRAINT DF_Skill_CreatedDate DEFAULT (GETDATE()),
    CreatedBy       BIGINT          NULL,
    ModifiedDate    DATETIME2       NULL,
    ModifiedBy      BIGINT          NULL,
    IsActive        BIT             NOT NULL CONSTRAINT DF_Skill_IsActive DEFAULT (1),
    CONSTRAINT PK_Skill PRIMARY KEY CLUSTERED (SkillID),
    CONSTRAINT UQ_Skill_SkillName UNIQUE (SkillName)
);
GO

-- ---------------------------------------------------------------------
-- UserRole  (User <-> Role, many-to-many)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.UserRole
(
    UserRoleID      BIGINT          IDENTITY(1,1) NOT NULL,
    UserID          BIGINT          NOT NULL,
    RoleID          INT             NOT NULL,
    CreatedDate     DATETIME2       NOT NULL CONSTRAINT DF_UserRole_CreatedDate DEFAULT (GETDATE()),
    CreatedBy       BIGINT          NULL,
    ModifiedDate    DATETIME2       NULL,
    ModifiedBy      BIGINT          NULL,
    IsActive        BIT             NOT NULL CONSTRAINT DF_UserRole_IsActive DEFAULT (1),
    CONSTRAINT PK_UserRole PRIMARY KEY CLUSTERED (UserRoleID),
    CONSTRAINT UQ_UserRole_User_Role UNIQUE (UserID, RoleID)
);
GO

-- ---------------------------------------------------------------------
-- Candidate  (1:1 with User)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Candidate
(
    CandidateID         BIGINT          IDENTITY(1,1) NOT NULL,
    UserID              BIGINT          NOT NULL,
    DateOfBirth         DATE            NULL,
    Gender              NVARCHAR(20)    NULL,
    CurrentLocation     NVARCHAR(100)   NULL,
    TotalExperience     DECIMAL(4,1)    NOT NULL CONSTRAINT DF_Candidate_TotalExperience DEFAULT (0),
    ResumeURL           NVARCHAR(500)   NULL,
    ResumeScore         DECIMAL(5,2)    NULL,
    NoticePeriodDays    INT             NULL,
    SalaryExpectation   DECIMAL(12,2)   NULL,
    CreatedDate         DATETIME2       NOT NULL CONSTRAINT DF_Candidate_CreatedDate DEFAULT (GETDATE()),
    CreatedBy           BIGINT          NULL,
    ModifiedDate        DATETIME2       NULL,
    ModifiedBy           BIGINT          NULL,
    IsActive             BIT             NOT NULL CONSTRAINT DF_Candidate_IsActive DEFAULT (1),
    CONSTRAINT PK_Candidate PRIMARY KEY CLUSTERED (CandidateID),
    CONSTRAINT UQ_Candidate_User UNIQUE (UserID),
    CONSTRAINT CK_Candidate_TotalExperience CHECK (TotalExperience >= 0),
    CONSTRAINT CK_Candidate_ResumeScore CHECK (ResumeScore IS NULL OR ResumeScore BETWEEN 0 AND 100),
    CONSTRAINT CK_Candidate_NoticePeriod CHECK (NoticePeriodDays IS NULL OR NoticePeriodDays >= 0)
);
GO

-- ---------------------------------------------------------------------
-- CandidateDemographic  (DEI self-ID -- restricted, see header note)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.CandidateDemographic
(
    DemographicID     BIGINT          IDENTITY(1,1) NOT NULL,
    CandidateID        BIGINT          NOT NULL,
    GenderSelfID         NVARCHAR(50)    NULL,
    EthnicitySelfID         NVARCHAR(50)    NULL,
    DisabilityStatus          NVARCHAR(20)    NULL,
    VeteranStatus                NVARCHAR(20)    NULL,
    ConsentGiven                    BIT             NOT NULL CONSTRAINT DF_CandidateDemographic_Consent DEFAULT (0),
    ConsentDate                        DATETIME2       NULL,
    CreatedDate                          DATETIME2       NOT NULL CONSTRAINT DF_CandidateDemographic_CreatedDate DEFAULT (GETDATE()),
    CreatedBy                             BIGINT          NULL,
    ModifiedDate                            DATETIME2       NULL,
    ModifiedBy                               BIGINT          NULL,
    IsActive                                  BIT             NOT NULL CONSTRAINT DF_CandidateDemographic_IsActive DEFAULT (1),
    CONSTRAINT PK_CandidateDemographic PRIMARY KEY CLUSTERED (DemographicID),
    CONSTRAINT UQ_CandidateDemographic_Candidate UNIQUE (CandidateID)
);
GO

-- ---------------------------------------------------------------------
-- Job
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Job
(
    JobID                   BIGINT          IDENTITY(1,1) NOT NULL,
    Title                   NVARCHAR(150)   NOT NULL,
    Description             NVARCHAR(MAX)   NULL,
    Department              NVARCHAR(80)    NULL,
    CostCenter               NVARCHAR(50)    NULL,
    Headcount                 INT             NOT NULL CONSTRAINT DF_Job_Headcount DEFAULT (1),
    BusinessJustification       NVARCHAR(MAX)   NULL,
    Location                      NVARCHAR(100)   NULL,
    EmploymentType                  NVARCHAR(30)    NULL,
    ExperienceRequiredMin             DECIMAL(3,1)    NULL,
    ExperienceRequiredMax               DECIMAL(3,1)    NULL,
    SalaryMin                             DECIMAL(12,2)   NULL,
    SalaryMax                               DECIMAL(12,2)   NULL,
    JobStatus                                 NVARCHAR(20)    NOT NULL CONSTRAINT DF_Job_JobStatus DEFAULT ('Draft'),
    RecruiterID                                BIGINT          NOT NULL,
    HiringManagerID                              BIGINT          NULL,
    TargetHiringDate                               DATE            NULL,
    CreatedDate                                      DATETIME2       NOT NULL CONSTRAINT DF_Job_CreatedDate DEFAULT (GETDATE()),
    CreatedBy                                         BIGINT          NULL,
    ModifiedDate                                        DATETIME2       NULL,
    ModifiedBy                                           BIGINT          NULL,
    IsActive                                              BIT             NOT NULL CONSTRAINT DF_Job_IsActive DEFAULT (1),
    CONSTRAINT PK_Job PRIMARY KEY CLUSTERED (JobID),
    CONSTRAINT CK_Job_JobStatus CHECK (JobStatus IN ('Draft','Pending Approval','Approved','Open','On Hold','Closed','Cancelled')),
    CONSTRAINT CK_Job_SalaryRange CHECK (SalaryMax IS NULL OR SalaryMin IS NULL OR SalaryMax >= SalaryMin),
    CONSTRAINT CK_Job_ExperienceRange CHECK (ExperienceRequiredMax IS NULL OR ExperienceRequiredMin IS NULL OR ExperienceRequiredMax >= ExperienceRequiredMin),
    CONSTRAINT CK_Job_Headcount CHECK (Headcount >= 1)
);
GO

-- ---------------------------------------------------------------------
-- CandidateSkill  (Candidate <-> Skill, many-to-many)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.CandidateSkill
(
    CandidateSkillID    BIGINT          IDENTITY(1,1) NOT NULL,
    CandidateID         BIGINT          NOT NULL,
    SkillID              INT             NOT NULL,
    YearsExperience      DECIMAL(3,1)    NOT NULL CONSTRAINT DF_CandidateSkill_Years DEFAULT (0),
    CreatedDate          DATETIME2       NOT NULL CONSTRAINT DF_CandidateSkill_CreatedDate DEFAULT (GETDATE()),
    CreatedBy             BIGINT          NULL,
    ModifiedDate          DATETIME2       NULL,
    ModifiedBy             BIGINT          NULL,
    IsActive               BIT             NOT NULL CONSTRAINT DF_CandidateSkill_IsActive DEFAULT (1),
    CONSTRAINT PK_CandidateSkill PRIMARY KEY CLUSTERED (CandidateSkillID),
    CONSTRAINT UQ_CandidateSkill_Candidate_Skill UNIQUE (CandidateID, SkillID),
    CONSTRAINT CK_CandidateSkill_Years CHECK (YearsExperience >= 0)
);
GO

-- ---------------------------------------------------------------------
-- JobSkill  (Job <-> Skill, many-to-many)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.JobSkill
(
    JobSkillID      BIGINT          IDENTITY(1,1) NOT NULL,
    JobID            BIGINT          NOT NULL,
    SkillID          INT             NOT NULL,
    MandatoryFlag    BIT             NOT NULL CONSTRAINT DF_JobSkill_Mandatory DEFAULT (1),
    Weight            DECIMAL(5,2)    NULL,  -- configurable scoring weight, e.g. 0-100 (FR-AI-04)
    CreatedDate      DATETIME2       NOT NULL CONSTRAINT DF_JobSkill_CreatedDate DEFAULT (GETDATE()),
    CreatedBy         BIGINT          NULL,
    ModifiedDate      DATETIME2       NULL,
    ModifiedBy         BIGINT          NULL,
    IsActive            BIT             NOT NULL CONSTRAINT DF_JobSkill_IsActive DEFAULT (1),
    CONSTRAINT PK_JobSkill PRIMARY KEY CLUSTERED (JobSkillID),
    CONSTRAINT UQ_JobSkill_Job_Skill UNIQUE (JobID, SkillID),
    CONSTRAINT CK_JobSkill_Weight CHECK (Weight IS NULL OR Weight BETWEEN 0 AND 100)
);
GO

-- ---------------------------------------------------------------------
-- Education
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Education
(
    EducationID   BIGINT          IDENTITY(1,1) NOT NULL,
    CandidateID   BIGINT          NOT NULL,
    Degree        NVARCHAR(100)   NOT NULL,
    Institution   NVARCHAR(150)   NULL,
    GraduationYear SMALLINT       NULL,
    Percentage    DECIMAL(5,2)    NULL,
    CreatedDate   DATETIME2       NOT NULL CONSTRAINT DF_Education_CreatedDate DEFAULT (GETDATE()),
    CreatedBy     BIGINT          NULL,
    ModifiedDate  DATETIME2       NULL,
    ModifiedBy    BIGINT          NULL,
    IsActive      BIT             NOT NULL CONSTRAINT DF_Education_IsActive DEFAULT (1),
    CONSTRAINT PK_Education PRIMARY KEY CLUSTERED (EducationID),
    CONSTRAINT CK_Education_GraduationYear CHECK (GraduationYear IS NULL OR GraduationYear BETWEEN 1950 AND 2100),
    CONSTRAINT CK_Education_Percentage CHECK (Percentage IS NULL OR Percentage BETWEEN 0 AND 100)
);
GO

-- ---------------------------------------------------------------------
-- WorkExperience
-- ---------------------------------------------------------------------
CREATE TABLE dbo.WorkExperience
(
    ExperienceID   BIGINT          IDENTITY(1,1) NOT NULL,
    CandidateID    BIGINT          NOT NULL,
    CompanyName    NVARCHAR(150)   NOT NULL,
    Designation    NVARCHAR(100)   NULL,
    StartDate      DATE            NULL,
    EndDate        DATE            NULL,
    Responsibilities NVARCHAR(MAX) NULL,
    CreatedDate    DATETIME2       NOT NULL CONSTRAINT DF_WorkExperience_CreatedDate DEFAULT (GETDATE()),
    CreatedBy      BIGINT          NULL,
    ModifiedDate   DATETIME2       NULL,
    ModifiedBy     BIGINT          NULL,
    IsActive       BIT             NOT NULL CONSTRAINT DF_WorkExperience_IsActive DEFAULT (1),
    CONSTRAINT PK_WorkExperience PRIMARY KEY CLUSTERED (ExperienceID),
    CONSTRAINT CK_WorkExperience_Dates CHECK (EndDate IS NULL OR StartDate IS NULL OR EndDate >= StartDate)
);
GO

-- ---------------------------------------------------------------------
-- Certification
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Certification
(
    CertificationID BIGINT          IDENTITY(1,1) NOT NULL,
    CandidateID     BIGINT          NOT NULL,
    CertificationName NVARCHAR(150) NOT NULL,
    IssuedBy        NVARCHAR(150)   NULL,
    IssueDate       DATE            NULL,
    CreatedDate     DATETIME2       NOT NULL CONSTRAINT DF_Certification_CreatedDate DEFAULT (GETDATE()),
    CreatedBy       BIGINT          NULL,
    ModifiedDate    DATETIME2       NULL,
    ModifiedBy      BIGINT          NULL,
    IsActive        BIT             NOT NULL CONSTRAINT DF_Certification_IsActive DEFAULT (1),
    CONSTRAINT PK_Certification PRIMARY KEY CLUSTERED (CertificationID)
);
GO

-- ---------------------------------------------------------------------
-- ScreeningQuestion  (per-Job, BRD Phase 5 / FR-10)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.ScreeningQuestion
(
    QuestionID          BIGINT          IDENTITY(1,1) NOT NULL,
    JobID                BIGINT          NOT NULL,
    QuestionText           NVARCHAR(500)   NOT NULL,
    QuestionType              NVARCHAR(20)    NOT NULL,
    MandatoryFlag                BIT             NOT NULL CONSTRAINT DF_ScreeningQuestion_Mandatory DEFAULT (1),
    DisqualifyingAnswer             NVARCHAR(200)   NULL,
    DisplayOrder                       INT             NULL,
    CreatedDate                          DATETIME2       NOT NULL CONSTRAINT DF_ScreeningQuestion_CreatedDate DEFAULT (GETDATE()),
    CreatedBy                             BIGINT          NULL,
    ModifiedDate                            DATETIME2       NULL,
    ModifiedBy                               BIGINT          NULL,
    IsActive                                  BIT             NOT NULL CONSTRAINT DF_ScreeningQuestion_IsActive DEFAULT (1),
    CONSTRAINT PK_ScreeningQuestion PRIMARY KEY CLUSTERED (QuestionID),
    CONSTRAINT CK_ScreeningQuestion_Type CHECK (QuestionType IN ('YesNo','MultipleChoice','FreeText','Numeric'))
);
GO

-- ---------------------------------------------------------------------
-- Application  (Candidate <-> Job)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Application
(
    ApplicationID       BIGINT          IDENTITY(1,1) NOT NULL,
    CandidateID          BIGINT          NOT NULL,
    JobID                 BIGINT          NOT NULL,
    AppliedDate            DATETIME2       NOT NULL CONSTRAINT DF_Application_AppliedDate DEFAULT (GETDATE()),
    ApplicationStatus       NVARCHAR(30)    NOT NULL CONSTRAINT DF_Application_Status DEFAULT ('Applied'),
    MatchScore                DECIMAL(5,2)    NULL,
    SourceChannel               NVARCHAR(50)    NULL,
    ConsentGiven                  BIT             NOT NULL CONSTRAINT DF_Application_ConsentGiven DEFAULT (0),
    ConsentDate                     DATETIME2       NULL,
    ConsentVersion                    NVARCHAR(20)    NULL,
    CreatedDate                         DATETIME2       NOT NULL CONSTRAINT DF_Application_CreatedDate DEFAULT (GETDATE()),
    CreatedBy                            BIGINT          NULL,
    ModifiedDate                           DATETIME2       NULL,
    ModifiedBy                              BIGINT          NULL,
    IsActive                                 BIT             NOT NULL CONSTRAINT DF_Application_IsActive DEFAULT (1),
    CONSTRAINT PK_Application PRIMARY KEY CLUSTERED (ApplicationID),
    -- See scope note 3 at top of file re: duplicate-application exception.
    CONSTRAINT UQ_Application_Candidate_Job UNIQUE (CandidateID, JobID),
    CONSTRAINT CK_Application_Status CHECK (ApplicationStatus IN (
        'Applied','Under Review','Shortlisted','Interview Scheduled',
        'Interview Completed','Selected','Rejected','Offer Sent','Hired','Withdrawn')),
    CONSTRAINT CK_Application_MatchScore CHECK (MatchScore IS NULL OR MatchScore BETWEEN 0 AND 100)
);
GO

-- ---------------------------------------------------------------------
-- ScreeningResponse  (per-Application answers to ScreeningQuestion)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.ScreeningResponse
(
    ResponseID       BIGINT          IDENTITY(1,1) NOT NULL,
    ApplicationID     BIGINT          NOT NULL,
    QuestionID          BIGINT          NOT NULL,
    AnswerText             NVARCHAR(500)   NULL,
    ResultStatus              NVARCHAR(20)    NOT NULL CONSTRAINT DF_ScreeningResponse_Result DEFAULT ('NotEvaluated'),
    CreatedDate                  DATETIME2       NOT NULL CONSTRAINT DF_ScreeningResponse_CreatedDate DEFAULT (GETDATE()),
    CreatedBy                     BIGINT          NULL,
    ModifiedDate                    DATETIME2       NULL,
    ModifiedBy                       BIGINT          NULL,
    IsActive                          BIT             NOT NULL CONSTRAINT DF_ScreeningResponse_IsActive DEFAULT (1),
    CONSTRAINT PK_ScreeningResponse PRIMARY KEY CLUSTERED (ResponseID),
    CONSTRAINT UQ_ScreeningResponse_App_Question UNIQUE (ApplicationID, QuestionID),
    CONSTRAINT CK_ScreeningResponse_Result CHECK (ResultStatus IN ('Pass','Fail','NotEvaluated'))
);
GO

-- ---------------------------------------------------------------------
-- Interview
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Interview
(
    InterviewID       BIGINT          IDENTITY(1,1) NOT NULL,
    ApplicationID      BIGINT          NOT NULL,
    InterviewerID       BIGINT          NOT NULL,
    InterviewDate         DATETIME2       NOT NULL,
    InterviewType           NVARCHAR(30)    NULL,
    InterviewMode             NVARCHAR(30)    NULL,
    InterviewStatus            NVARCHAR(20)    NOT NULL CONSTRAINT DF_Interview_Status DEFAULT ('Scheduled'),
    CreatedDate                  DATETIME2       NOT NULL CONSTRAINT DF_Interview_CreatedDate DEFAULT (GETDATE()),
    CreatedBy                     BIGINT          NULL,
    ModifiedDate                    DATETIME2       NULL,
    ModifiedBy                       BIGINT          NULL,
    IsActive                          BIT             NOT NULL CONSTRAINT DF_Interview_IsActive DEFAULT (1),
    CONSTRAINT PK_Interview PRIMARY KEY CLUSTERED (InterviewID),
    CONSTRAINT CK_Interview_Status CHECK (InterviewStatus IN ('Scheduled','Rescheduled','Completed','Cancelled'))
);
GO

-- ---------------------------------------------------------------------
-- InterviewFeedback  (1:M per Interview -- see scope note 1 at top)
-- TechnicalRating/CommunicationRating/ProblemSolvingRating from v1.0
-- removed; per-competency ratings now live in InterviewCompetencyRating.
-- ---------------------------------------------------------------------
CREATE TABLE dbo.InterviewFeedback
(
    FeedbackID              BIGINT          IDENTITY(1,1) NOT NULL,
    InterviewID              BIGINT          NOT NULL,
    InterviewerID              BIGINT          NOT NULL,
    Recommendation                NVARCHAR(20)    NULL,
    Comments                        NVARCHAR(MAX)   NULL,
    CreatedDate                       DATETIME2       NOT NULL CONSTRAINT DF_InterviewFeedback_CreatedDate DEFAULT (GETDATE()),
    CreatedBy                          BIGINT          NULL,
    ModifiedDate                         DATETIME2       NULL,
    ModifiedBy                            BIGINT          NULL,
    IsActive                               BIT             NOT NULL CONSTRAINT DF_InterviewFeedback_IsActive DEFAULT (1),
    CONSTRAINT PK_InterviewFeedback PRIMARY KEY CLUSTERED (FeedbackID),
    CONSTRAINT UQ_InterviewFeedback_Interview_Interviewer UNIQUE (InterviewID, InterviewerID),
    CONSTRAINT CK_InterviewFeedback_Recommendation CHECK (Recommendation IS NULL OR Recommendation IN ('Strong Hire','Hire','Hold','Reject'))
);
GO

-- ---------------------------------------------------------------------
-- InterviewCompetencyRating  (configurable rubric, FR-INT-05)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.InterviewCompetencyRating
(
    CompetencyRatingID   BIGINT          IDENTITY(1,1) NOT NULL,
    FeedbackID            BIGINT          NOT NULL,
    CompetencyName          NVARCHAR(80)    NOT NULL,   -- e.g. 'Technical Skills', 'Communication'
    Rating                     SMALLINT        NOT NULL,
    CreatedDate                  DATETIME2       NOT NULL CONSTRAINT DF_InterviewCompetencyRating_CreatedDate DEFAULT (GETDATE()),
    CreatedBy                     BIGINT          NULL,
    ModifiedDate                    DATETIME2       NULL,
    ModifiedBy                       BIGINT          NULL,
    IsActive                          BIT             NOT NULL CONSTRAINT DF_InterviewCompetencyRating_IsActive DEFAULT (1),
    CONSTRAINT PK_InterviewCompetencyRating PRIMARY KEY CLUSTERED (CompetencyRatingID),
    CONSTRAINT UQ_InterviewCompetencyRating_Feedback_Competency UNIQUE (FeedbackID, CompetencyName),
    CONSTRAINT CK_InterviewCompetencyRating_Rating CHECK (Rating BETWEEN 1 AND 5)
);
GO

-- ---------------------------------------------------------------------
-- Offer  (0..1 per Application)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Offer
(
    OfferID          BIGINT          IDENTITY(1,1) NOT NULL,
    ApplicationID      BIGINT          NOT NULL,
    Salary               DECIMAL(12,2)   NOT NULL,
    JoiningDate            DATE            NULL,
    OfferStatus               NVARCHAR(20)    NOT NULL CONSTRAINT DF_Offer_Status DEFAULT ('Draft'),
    ApprovedBy                  BIGINT          NULL,
    DeclineReason                  NVARCHAR(300)   NULL,
    SignedDocumentURL                 NVARCHAR(500)   NULL,
    CreatedDate                          DATETIME2       NOT NULL CONSTRAINT DF_Offer_CreatedDate DEFAULT (GETDATE()),
    CreatedBy                             BIGINT          NULL,
    ModifiedDate                            DATETIME2       NULL,
    ModifiedBy                               BIGINT          NULL,
    IsActive                                  BIT             NOT NULL CONSTRAINT DF_Offer_IsActive DEFAULT (1),
    CONSTRAINT PK_Offer PRIMARY KEY CLUSTERED (OfferID),
    CONSTRAINT UQ_Offer_Application UNIQUE (ApplicationID),
    CONSTRAINT CK_Offer_Status CHECK (OfferStatus IN ('Draft','Pending Approval','Sent','Accepted','Declined','Expired','Rescinded')),
    CONSTRAINT CK_Offer_Salary CHECK (Salary > 0)
);
GO

-- ---------------------------------------------------------------------
-- ApprovalHistory  (polymorphic: Job or Offer approval chains,
-- FR-REQ-02, FR-OFF-02 -- same EntityType/EntityID pattern as AuditLog)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.ApprovalHistory
(
    ApprovalID       BIGINT          IDENTITY(1,1) NOT NULL,
    EntityType         NVARCHAR(20)    NOT NULL,
    EntityID              BIGINT          NOT NULL,
    ApprovalStage           NVARCHAR(50)    NOT NULL,   -- e.g. 'Hiring Manager','Finance','HR Director'
    ApproverID                 BIGINT          NOT NULL,
    Decision                      NVARCHAR(20)    NOT NULL CONSTRAINT DF_ApprovalHistory_Decision DEFAULT ('Pending'),
    Comments                         NVARCHAR(500)   NULL,
    ActionDate                          DATETIME2       NULL,
    CreatedDate                            DATETIME2       NOT NULL CONSTRAINT DF_ApprovalHistory_CreatedDate DEFAULT (GETDATE()),
    CreatedBy                               BIGINT          NULL,
    ModifiedDate                              DATETIME2       NULL,
    ModifiedBy                                 BIGINT          NULL,
    IsActive                                     BIT             NOT NULL CONSTRAINT DF_ApprovalHistory_IsActive DEFAULT (1),
    CONSTRAINT PK_ApprovalHistory PRIMARY KEY CLUSTERED (ApprovalID),
    CONSTRAINT CK_ApprovalHistory_EntityType CHECK (EntityType IN ('Job','Offer')),
    CONSTRAINT CK_ApprovalHistory_Decision CHECK (Decision IN ('Approved','Rejected','Pending'))
);
GO

-- ---------------------------------------------------------------------
-- AIMatchDetail  (1:M per Application -- see scope note 2 at top)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.AIMatchDetail
(
    MatchDetailID       BIGINT          IDENTITY(1,1) NOT NULL,
    ApplicationID         BIGINT          NOT NULL,
    OverallScore            DECIMAL(5,2)    NOT NULL,
    SkillsScore                DECIMAL(5,2)    NULL,
    ExperienceScore              DECIMAL(5,2)    NULL,
    EducationScore                  DECIMAL(5,2)    NULL,
    MatchedSkills                     NVARCHAR(MAX)   NULL,
    MissingSkills                       NVARCHAR(MAX)   NULL,
    GeneratedDate                         DATETIME2       NOT NULL CONSTRAINT DF_AIMatchDetail_GeneratedDate DEFAULT (GETDATE()),
    CreatedDate                            DATETIME2       NOT NULL CONSTRAINT DF_AIMatchDetail_CreatedDate DEFAULT (GETDATE()),
    CreatedBy                               BIGINT          NULL,
    ModifiedDate                              DATETIME2       NULL,
    ModifiedBy                                 BIGINT          NULL,
    IsActive                                    BIT             NOT NULL CONSTRAINT DF_AIMatchDetail_IsActive DEFAULT (1),
    CONSTRAINT PK_AIMatchDetail PRIMARY KEY CLUSTERED (MatchDetailID),
    CONSTRAINT CK_AIMatchDetail_OverallScore CHECK (OverallScore BETWEEN 0 AND 100)
);
GO

-- ---------------------------------------------------------------------
-- Notification
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Notification
(
    NotificationID         BIGINT          IDENTITY(1,1) NOT NULL,
    UserID                   BIGINT          NOT NULL,
    NotificationType           NVARCHAR(20)    NOT NULL,
    Subject                       NVARCHAR(150)   NULL,
    Message                         NVARCHAR(MAX)   NULL,
    NotificationStatus                NVARCHAR(20)    NOT NULL CONSTRAINT DF_Notification_Status DEFAULT ('Pending'),
    SentDate                             DATETIME2       NULL,
    CreatedDate                            DATETIME2       NOT NULL CONSTRAINT DF_Notification_CreatedDate DEFAULT (GETDATE()),
    CreatedBy                               BIGINT          NULL,
    ModifiedDate                              DATETIME2       NULL,
    ModifiedBy                                 BIGINT          NULL,
    IsActive                                    BIT             NOT NULL CONSTRAINT DF_Notification_IsActive DEFAULT (1),
    CONSTRAINT PK_Notification PRIMARY KEY CLUSTERED (NotificationID),
    CONSTRAINT CK_Notification_Type CHECK (NotificationType IN ('Email','SMS','InApp')),
    CONSTRAINT CK_Notification_Status CHECK (NotificationStatus IN ('Pending','Sent','Failed'))
);
GO

-- ---------------------------------------------------------------------
-- AuditLog  (append-only by convention -- see scope note 5 at top)
-- ---------------------------------------------------------------------
CREATE TABLE dbo.AuditLog
(
    AuditID           BIGINT          IDENTITY(1,1) NOT NULL,
    UserID              BIGINT          NULL,   -- actor; nullable for system-generated events
    ActionType            NVARCHAR(30)    NOT NULL,
    EntityType              NVARCHAR(50)    NOT NULL,
    EntityID                  BIGINT          NULL,
    OldValue                    NVARCHAR(MAX)   NULL,
    NewValue                      NVARCHAR(MAX)   NULL,
    ActionDate                      DATETIME2       NOT NULL CONSTRAINT DF_AuditLog_ActionDate DEFAULT (GETDATE()),
    CreatedDate                       DATETIME2       NOT NULL CONSTRAINT DF_AuditLog_CreatedDate DEFAULT (GETDATE()),
    CreatedBy                          BIGINT          NULL,
    ModifiedDate                         DATETIME2       NULL,
    ModifiedBy                            BIGINT          NULL,
    IsActive                               BIT             NOT NULL CONSTRAINT DF_AuditLog_IsActive DEFAULT (1),
    CONSTRAINT PK_AuditLog PRIMARY KEY CLUSTERED (AuditID)
);
GO

/* =====================================================================
   SECTION 3: CONSTRAINTS (Foreign Keys)
   Added after all tables exist -- avoids ordering/circular-reference
   issues, including User's self-referencing CreatedBy/ModifiedBy.
   ===================================================================== */

-- User (self-referencing)
ALTER TABLE dbo.[User] ADD CONSTRAINT FK_User_CreatedBy  FOREIGN KEY (CreatedBy)  REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.[User] ADD CONSTRAINT FK_User_ModifiedBy FOREIGN KEY (ModifiedBy) REFERENCES dbo.[User](UserID);
GO

-- Role
ALTER TABLE dbo.Role ADD CONSTRAINT FK_Role_CreatedBy  FOREIGN KEY (CreatedBy)  REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Role ADD CONSTRAINT FK_Role_ModifiedBy FOREIGN KEY (ModifiedBy) REFERENCES dbo.[User](UserID);
GO

-- Skill
ALTER TABLE dbo.Skill ADD CONSTRAINT FK_Skill_CreatedBy  FOREIGN KEY (CreatedBy)  REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Skill ADD CONSTRAINT FK_Skill_ModifiedBy FOREIGN KEY (ModifiedBy) REFERENCES dbo.[User](UserID);
GO

-- UserRole
ALTER TABLE dbo.UserRole ADD CONSTRAINT FK_UserRole_User        FOREIGN KEY (UserID)     REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.UserRole ADD CONSTRAINT FK_UserRole_Role        FOREIGN KEY (RoleID)     REFERENCES dbo.Role(RoleID);
ALTER TABLE dbo.UserRole ADD CONSTRAINT FK_UserRole_CreatedBy   FOREIGN KEY (CreatedBy)  REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.UserRole ADD CONSTRAINT FK_UserRole_ModifiedBy  FOREIGN KEY (ModifiedBy) REFERENCES dbo.[User](UserID);
GO

-- Candidate
ALTER TABLE dbo.Candidate ADD CONSTRAINT FK_Candidate_User        FOREIGN KEY (UserID)     REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Candidate ADD CONSTRAINT FK_Candidate_CreatedBy   FOREIGN KEY (CreatedBy)  REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Candidate ADD CONSTRAINT FK_Candidate_ModifiedBy  FOREIGN KEY (ModifiedBy) REFERENCES dbo.[User](UserID);
GO

-- CandidateDemographic
ALTER TABLE dbo.CandidateDemographic ADD CONSTRAINT FK_CandidateDemographic_Candidate  FOREIGN KEY (CandidateID) REFERENCES dbo.Candidate(CandidateID);
ALTER TABLE dbo.CandidateDemographic ADD CONSTRAINT FK_CandidateDemographic_CreatedBy  FOREIGN KEY (CreatedBy)   REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.CandidateDemographic ADD CONSTRAINT FK_CandidateDemographic_ModifiedBy FOREIGN KEY (ModifiedBy)  REFERENCES dbo.[User](UserID);
GO

-- Job
ALTER TABLE dbo.Job ADD CONSTRAINT FK_Job_Recruiter      FOREIGN KEY (RecruiterID)     REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Job ADD CONSTRAINT FK_Job_HiringManager  FOREIGN KEY (HiringManagerID) REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Job ADD CONSTRAINT FK_Job_CreatedBy      FOREIGN KEY (CreatedBy)       REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Job ADD CONSTRAINT FK_Job_ModifiedBy     FOREIGN KEY (ModifiedBy)      REFERENCES dbo.[User](UserID);
GO

-- CandidateSkill
ALTER TABLE dbo.CandidateSkill ADD CONSTRAINT FK_CandidateSkill_Candidate  FOREIGN KEY (CandidateID) REFERENCES dbo.Candidate(CandidateID);
ALTER TABLE dbo.CandidateSkill ADD CONSTRAINT FK_CandidateSkill_Skill      FOREIGN KEY (SkillID)     REFERENCES dbo.Skill(SkillID);
ALTER TABLE dbo.CandidateSkill ADD CONSTRAINT FK_CandidateSkill_CreatedBy  FOREIGN KEY (CreatedBy)   REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.CandidateSkill ADD CONSTRAINT FK_CandidateSkill_ModifiedBy FOREIGN KEY (ModifiedBy)  REFERENCES dbo.[User](UserID);
GO

-- JobSkill
ALTER TABLE dbo.JobSkill ADD CONSTRAINT FK_JobSkill_Job         FOREIGN KEY (JobID)      REFERENCES dbo.Job(JobID);
ALTER TABLE dbo.JobSkill ADD CONSTRAINT FK_JobSkill_Skill       FOREIGN KEY (SkillID)    REFERENCES dbo.Skill(SkillID);
ALTER TABLE dbo.JobSkill ADD CONSTRAINT FK_JobSkill_CreatedBy   FOREIGN KEY (CreatedBy)  REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.JobSkill ADD CONSTRAINT FK_JobSkill_ModifiedBy  FOREIGN KEY (ModifiedBy) REFERENCES dbo.[User](UserID);
GO

-- Education
ALTER TABLE dbo.Education ADD CONSTRAINT FK_Education_Candidate  FOREIGN KEY (CandidateID) REFERENCES dbo.Candidate(CandidateID);
ALTER TABLE dbo.Education ADD CONSTRAINT FK_Education_CreatedBy  FOREIGN KEY (CreatedBy)   REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Education ADD CONSTRAINT FK_Education_ModifiedBy FOREIGN KEY (ModifiedBy)  REFERENCES dbo.[User](UserID);
GO

-- WorkExperience
ALTER TABLE dbo.WorkExperience ADD CONSTRAINT FK_WorkExperience_Candidate  FOREIGN KEY (CandidateID) REFERENCES dbo.Candidate(CandidateID);
ALTER TABLE dbo.WorkExperience ADD CONSTRAINT FK_WorkExperience_CreatedBy  FOREIGN KEY (CreatedBy)   REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.WorkExperience ADD CONSTRAINT FK_WorkExperience_ModifiedBy FOREIGN KEY (ModifiedBy)  REFERENCES dbo.[User](UserID);
GO

-- Certification
ALTER TABLE dbo.Certification ADD CONSTRAINT FK_Certification_Candidate  FOREIGN KEY (CandidateID) REFERENCES dbo.Candidate(CandidateID);
ALTER TABLE dbo.Certification ADD CONSTRAINT FK_Certification_CreatedBy  FOREIGN KEY (CreatedBy)   REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Certification ADD CONSTRAINT FK_Certification_ModifiedBy FOREIGN KEY (ModifiedBy)  REFERENCES dbo.[User](UserID);
GO

-- ScreeningQuestion
ALTER TABLE dbo.ScreeningQuestion ADD CONSTRAINT FK_ScreeningQuestion_Job        FOREIGN KEY (JobID)      REFERENCES dbo.Job(JobID);
ALTER TABLE dbo.ScreeningQuestion ADD CONSTRAINT FK_ScreeningQuestion_CreatedBy  FOREIGN KEY (CreatedBy)  REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.ScreeningQuestion ADD CONSTRAINT FK_ScreeningQuestion_ModifiedBy FOREIGN KEY (ModifiedBy) REFERENCES dbo.[User](UserID);
GO

-- Application
ALTER TABLE dbo.Application ADD CONSTRAINT FK_Application_Candidate  FOREIGN KEY (CandidateID) REFERENCES dbo.Candidate(CandidateID);
ALTER TABLE dbo.Application ADD CONSTRAINT FK_Application_Job        FOREIGN KEY (JobID)       REFERENCES dbo.Job(JobID);
ALTER TABLE dbo.Application ADD CONSTRAINT FK_Application_CreatedBy  FOREIGN KEY (CreatedBy)   REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Application ADD CONSTRAINT FK_Application_ModifiedBy FOREIGN KEY (ModifiedBy)  REFERENCES dbo.[User](UserID);
GO

-- ScreeningResponse
ALTER TABLE dbo.ScreeningResponse ADD CONSTRAINT FK_ScreeningResponse_Application FOREIGN KEY (ApplicationID) REFERENCES dbo.Application(ApplicationID);
ALTER TABLE dbo.ScreeningResponse ADD CONSTRAINT FK_ScreeningResponse_Question    FOREIGN KEY (QuestionID)    REFERENCES dbo.ScreeningQuestion(QuestionID);
ALTER TABLE dbo.ScreeningResponse ADD CONSTRAINT FK_ScreeningResponse_CreatedBy   FOREIGN KEY (CreatedBy)     REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.ScreeningResponse ADD CONSTRAINT FK_ScreeningResponse_ModifiedBy  FOREIGN KEY (ModifiedBy)    REFERENCES dbo.[User](UserID);
GO

-- Interview
ALTER TABLE dbo.Interview ADD CONSTRAINT FK_Interview_Application  FOREIGN KEY (ApplicationID) REFERENCES dbo.Application(ApplicationID);
ALTER TABLE dbo.Interview ADD CONSTRAINT FK_Interview_Interviewer  FOREIGN KEY (InterviewerID) REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Interview ADD CONSTRAINT FK_Interview_CreatedBy    FOREIGN KEY (CreatedBy)     REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Interview ADD CONSTRAINT FK_Interview_ModifiedBy   FOREIGN KEY (ModifiedBy)    REFERENCES dbo.[User](UserID);
GO

-- InterviewFeedback
ALTER TABLE dbo.InterviewFeedback ADD CONSTRAINT FK_InterviewFeedback_Interview    FOREIGN KEY (InterviewID)   REFERENCES dbo.Interview(InterviewID);
ALTER TABLE dbo.InterviewFeedback ADD CONSTRAINT FK_InterviewFeedback_Interviewer  FOREIGN KEY (InterviewerID) REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.InterviewFeedback ADD CONSTRAINT FK_InterviewFeedback_CreatedBy    FOREIGN KEY (CreatedBy)     REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.InterviewFeedback ADD CONSTRAINT FK_InterviewFeedback_ModifiedBy   FOREIGN KEY (ModifiedBy)    REFERENCES dbo.[User](UserID);
GO

-- InterviewCompetencyRating
ALTER TABLE dbo.InterviewCompetencyRating ADD CONSTRAINT FK_InterviewCompetencyRating_Feedback   FOREIGN KEY (FeedbackID) REFERENCES dbo.InterviewFeedback(FeedbackID);
ALTER TABLE dbo.InterviewCompetencyRating ADD CONSTRAINT FK_InterviewCompetencyRating_CreatedBy   FOREIGN KEY (CreatedBy)  REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.InterviewCompetencyRating ADD CONSTRAINT FK_InterviewCompetencyRating_ModifiedBy  FOREIGN KEY (ModifiedBy) REFERENCES dbo.[User](UserID);
GO

-- Offer
ALTER TABLE dbo.Offer ADD CONSTRAINT FK_Offer_Application  FOREIGN KEY (ApplicationID) REFERENCES dbo.Application(ApplicationID);
ALTER TABLE dbo.Offer ADD CONSTRAINT FK_Offer_ApprovedBy   FOREIGN KEY (ApprovedBy)    REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Offer ADD CONSTRAINT FK_Offer_CreatedBy    FOREIGN KEY (CreatedBy)     REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Offer ADD CONSTRAINT FK_Offer_ModifiedBy   FOREIGN KEY (ModifiedBy)    REFERENCES dbo.[User](UserID);
GO

-- ApprovalHistory (EntityID is intentionally polymorphic -- Job or
-- Offer depending on EntityType -- so it carries no FK to either;
-- application code / stored procedures are responsible for validity)
ALTER TABLE dbo.ApprovalHistory ADD CONSTRAINT FK_ApprovalHistory_Approver    FOREIGN KEY (ApproverID) REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.ApprovalHistory ADD CONSTRAINT FK_ApprovalHistory_CreatedBy   FOREIGN KEY (CreatedBy)  REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.ApprovalHistory ADD CONSTRAINT FK_ApprovalHistory_ModifiedBy  FOREIGN KEY (ModifiedBy) REFERENCES dbo.[User](UserID);
GO

-- AIMatchDetail
ALTER TABLE dbo.AIMatchDetail ADD CONSTRAINT FK_AIMatchDetail_Application  FOREIGN KEY (ApplicationID) REFERENCES dbo.Application(ApplicationID);
ALTER TABLE dbo.AIMatchDetail ADD CONSTRAINT FK_AIMatchDetail_CreatedBy    FOREIGN KEY (CreatedBy)     REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.AIMatchDetail ADD CONSTRAINT FK_AIMatchDetail_ModifiedBy   FOREIGN KEY (ModifiedBy)    REFERENCES dbo.[User](UserID);
GO

-- Notification
ALTER TABLE dbo.Notification ADD CONSTRAINT FK_Notification_User        FOREIGN KEY (UserID)     REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Notification ADD CONSTRAINT FK_Notification_CreatedBy   FOREIGN KEY (CreatedBy)  REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.Notification ADD CONSTRAINT FK_Notification_ModifiedBy  FOREIGN KEY (ModifiedBy) REFERENCES dbo.[User](UserID);
GO

-- AuditLog
ALTER TABLE dbo.AuditLog ADD CONSTRAINT FK_AuditLog_User        FOREIGN KEY (UserID)     REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.AuditLog ADD CONSTRAINT FK_AuditLog_CreatedBy   FOREIGN KEY (CreatedBy)  REFERENCES dbo.[User](UserID);
ALTER TABLE dbo.AuditLog ADD CONSTRAINT FK_AuditLog_ModifiedBy  FOREIGN KEY (ModifiedBy) REFERENCES dbo.[User](UserID);
GO

/* =====================================================================
   SECTION 4: INDEXES
   ===================================================================== */

-- Explicitly requested (Email and SkillName are already covered by the
-- UQ_User_Email / UQ_Skill_SkillName unique constraints above).
CREATE NONCLUSTERED INDEX IX_Job_JobStatus         ON dbo.Job (JobStatus);
CREATE NONCLUSTERED INDEX IX_Application_Status    ON dbo.Application (ApplicationStatus);
CREATE NONCLUSTERED INDEX IX_Interview_InterviewDate ON dbo.Interview (InterviewDate);
CREATE NONCLUSTERED INDEX IX_Offer_OfferStatus     ON dbo.Offer (OfferStatus);
GO

-- SSO lookup: unique only among non-null subject IDs
CREATE UNIQUE NONCLUSTERED INDEX UX_User_ExternalIdPSubjectID ON dbo.[User] (ExternalIdPSubjectID) WHERE ExternalIdPSubjectID IS NOT NULL;
GO

-- Foreign-key lookup / join performance (SQL Server does not auto-index FKs)
CREATE NONCLUSTERED INDEX IX_Application_CandidateID          ON dbo.Application (CandidateID);
CREATE NONCLUSTERED INDEX IX_Application_JobID                 ON dbo.Application (JobID);
CREATE NONCLUSTERED INDEX IX_Interview_ApplicationID             ON dbo.Interview (ApplicationID);
CREATE NONCLUSTERED INDEX IX_InterviewFeedback_InterviewID        ON dbo.InterviewFeedback (InterviewID);
CREATE NONCLUSTERED INDEX IX_InterviewCompetencyRating_FeedbackID   ON dbo.InterviewCompetencyRating (FeedbackID);
CREATE NONCLUSTERED INDEX IX_AIMatchDetail_ApplicationID              ON dbo.AIMatchDetail (ApplicationID);
CREATE NONCLUSTERED INDEX IX_CandidateSkill_CandidateID                 ON dbo.CandidateSkill (CandidateID);
CREATE NONCLUSTERED INDEX IX_CandidateSkill_SkillID                       ON dbo.CandidateSkill (SkillID);
CREATE NONCLUSTERED INDEX IX_JobSkill_JobID                                 ON dbo.JobSkill (JobID);
CREATE NONCLUSTERED INDEX IX_JobSkill_SkillID                                 ON dbo.JobSkill (SkillID);
CREATE NONCLUSTERED INDEX IX_UserRole_UserID                                    ON dbo.UserRole (UserID);
CREATE NONCLUSTERED INDEX IX_UserRole_RoleID                                      ON dbo.UserRole (RoleID);
CREATE NONCLUSTERED INDEX IX_Notification_UserID                                    ON dbo.Notification (UserID);
CREATE NONCLUSTERED INDEX IX_AuditLog_UserID                                          ON dbo.AuditLog (UserID);
CREATE NONCLUSTERED INDEX IX_AuditLog_EntityType_EntityID                               ON dbo.AuditLog (EntityType, EntityID);
CREATE NONCLUSTERED INDEX IX_ScreeningQuestion_JobID                                      ON dbo.ScreeningQuestion (JobID);
CREATE NONCLUSTERED INDEX IX_ScreeningResponse_ApplicationID                                ON dbo.ScreeningResponse (ApplicationID);
CREATE NONCLUSTERED INDEX IX_ScreeningResponse_QuestionID                                     ON dbo.ScreeningResponse (QuestionID);
CREATE NONCLUSTERED INDEX IX_ApprovalHistory_EntityType_EntityID                                ON dbo.ApprovalHistory (EntityType, EntityID);
CREATE NONCLUSTERED INDEX IX_CandidateDemographic_CandidateID                                     ON dbo.CandidateDemographic (CandidateID);
GO

/* =====================================================================
   SECTION 5: SEED DATA
   ===================================================================== */

-- Bootstrap system user (CreatedBy = NULL since nothing precedes it)
INSERT INTO dbo.[User] (FirstName, LastName, Email, PasswordHash, UserStatus, CreatedBy)
VALUES ('System', 'Administrator', 'system.admin@talentai.local', 'N/A - system account', 'Active', NULL);

DECLARE @SystemUserID BIGINT = SCOPE_IDENTITY();
UPDATE dbo.[User] SET CreatedBy = @SystemUserID WHERE UserID = @SystemUserID;

-- Roles
INSERT INTO dbo.Role (RoleName, Description, CreatedBy) VALUES
    ('Candidate',       'External job seeker applying for roles',                       @SystemUserID),
    ('Recruiter',       'Manages requisitions, sourcing, screening, scheduling',         @SystemUserID),
    ('Hiring Manager',  'Owns the role; reviews and interviews candidates',              @SystemUserID),
    ('Interviewer',     'Conducts interviews and submits structured feedback',           @SystemUserID),
    ('HR Admin',        'Manages offer logistics and onboarding tasks',                  @SystemUserID),
    ('System Admin',    'Configures workflows, roles, integrations',                     @SystemUserID);

-- Sample Skills
INSERT INTO dbo.Skill (SkillName, Category, CreatedBy) VALUES
    ('Java',             'Technical',    @SystemUserID),
    ('Spring Boot',      'Technical',    @SystemUserID),
    ('SQL',              'Technical',    @SystemUserID),
    ('AWS',               'Technical',    @SystemUserID),
    ('Kafka',              'Technical',    @SystemUserID),
    ('Communication',       'Functional',   @SystemUserID),
    ('Project Management',   'Functional',   @SystemUserID);

-- Sample Users (one Recruiter, one Hiring Manager, one Candidate-to-be)
INSERT INTO dbo.[User] (FirstName, LastName, Email, PasswordHash, UserStatus, CreatedBy) VALUES
    ('Priya', 'Nair',  'priya.nair@talentai.local',  'placeholder-hash-1', 'Active', @SystemUserID),
    ('Arjun', 'Rao',    'arjun.rao@talentai.local',    'placeholder-hash-2', 'Active', @SystemUserID),
    ('John',  'Doe',     'john.doe@gmail.com',           'placeholder-hash-3', 'Active', @SystemUserID);

DECLARE @RecruiterUserID BIGINT = (SELECT UserID FROM dbo.[User] WHERE Email = 'priya.nair@talentai.local');
DECLARE @HMUserID        BIGINT = (SELECT UserID FROM dbo.[User] WHERE Email = 'arjun.rao@talentai.local');
DECLARE @CandidateUserID BIGINT = (SELECT UserID FROM dbo.[User] WHERE Email = 'john.doe@gmail.com');

INSERT INTO dbo.UserRole (UserID, RoleID, CreatedBy) VALUES
    (@RecruiterUserID, (SELECT RoleID FROM dbo.Role WHERE RoleName = 'Recruiter'),      @SystemUserID),
    (@HMUserID,        (SELECT RoleID FROM dbo.Role WHERE RoleName = 'Hiring Manager'), @SystemUserID),
    (@CandidateUserID, (SELECT RoleID FROM dbo.Role WHERE RoleName = 'Candidate'),      @SystemUserID);

-- Sample Candidate
INSERT INTO dbo.Candidate (UserID, CurrentLocation, TotalExperience, ResumeURL, ResumeScore, CreatedBy)
VALUES (@CandidateUserID, 'Bengaluru', 6.0, '/files/resumes/john_doe.pdf', 82.5, @SystemUserID);

DECLARE @SampleCandidateID BIGINT = (SELECT CandidateID FROM dbo.Candidate WHERE UserID = @CandidateUserID);

-- Sample Job (JobStatus 'Open' per the corrected FR-REQ-04 status list)
INSERT INTO dbo.Job (Title, Description, Department, CostCenter, Headcount, BusinessJustification,
                      Location, EmploymentType, ExperienceRequiredMin, ExperienceRequiredMax,
                      SalaryMin, SalaryMax, JobStatus, RecruiterID, HiringManagerID, CreatedBy)
VALUES ('Senior Java Developer',
        'Own backend services for the recruitment pipeline.',
        'Engineering', 'CC-ENG-100', 1, 'Backlog growth requires an additional senior backend engineer.',
        'Bengaluru', 'Full-Time', 5.0, 8.0,
        1800000, 2600000, 'Open', @RecruiterUserID, @HMUserID, @SystemUserID);

DECLARE @SampleJobID BIGINT = (SELECT JobID FROM dbo.Job WHERE Title = 'Senior Java Developer');

-- Sample screening questions for the sample job
INSERT INTO dbo.ScreeningQuestion (JobID, QuestionText, QuestionType, MandatoryFlag, DisqualifyingAnswer, DisplayOrder, CreatedBy)
VALUES
    (@SampleJobID, 'Are you willing to relocate to Bengaluru?', 'YesNo', 1, 'No', 1, @SystemUserID),
    (@SampleJobID, 'Years of Java experience?', 'Numeric', 1, NULL, 2, @SystemUserID);
GO

/* =====================================================================
   SECTION 6: VIEWS
   ===================================================================== */

CREATE OR ALTER VIEW dbo.vwCandidateProfile
AS
SELECT
    c.CandidateID,
    u.UserID,
    u.FirstName,
    u.LastName,
    u.Email,
    u.PhoneNumber,
    c.CurrentLocation,
    c.TotalExperience,
    c.ResumeURL,
    c.ResumeScore,
    c.NoticePeriodDays,
    c.SalaryExpectation,
    c.IsActive
FROM dbo.Candidate c
INNER JOIN dbo.[User] u ON u.UserID = c.UserID;
GO

CREATE OR ALTER VIEW dbo.vwJobApplications
AS
SELECT
    a.ApplicationID,
    j.JobID,
    j.Title              AS JobTitle,
    j.Department,
    j.JobStatus,
    c.CandidateID,
    u.FirstName + ' ' + u.LastName AS CandidateName,
    u.Email              AS CandidateEmail,
    a.ApplicationStatus,
    a.MatchScore,
    a.AppliedDate,
    a.SourceChannel
FROM dbo.Application a
INNER JOIN dbo.Job j       ON j.JobID = a.JobID
INNER JOIN dbo.Candidate c ON c.CandidateID = a.CandidateID
INNER JOIN dbo.[User] u    ON u.UserID = c.UserID;
GO

CREATE OR ALTER VIEW dbo.vwInterviewSchedule
AS
SELECT
    i.InterviewID,
    i.InterviewDate,
    i.InterviewType,
    i.InterviewMode,
    i.InterviewStatus,
    a.ApplicationID,
    j.Title AS JobTitle,
    cu.FirstName + ' ' + cu.LastName AS CandidateName,
    iu.FirstName + ' ' + iu.LastName AS InterviewerName
FROM dbo.Interview i
INNER JOIN dbo.Application a ON a.ApplicationID = i.ApplicationID
INNER JOIN dbo.Job j         ON j.JobID = a.JobID
INNER JOIN dbo.Candidate c   ON c.CandidateID = a.CandidateID
INNER JOIN dbo.[User] cu     ON cu.UserID = c.UserID
INNER JOIN dbo.[User] iu     ON iu.UserID = i.InterviewerID;
GO

CREATE OR ALTER VIEW dbo.vwRecruitmentDashboard
AS
SELECT
    (SELECT COUNT(*) FROM dbo.Job WHERE JobStatus = 'Open')                 AS OpenPositions,
    (SELECT COUNT(*) FROM dbo.Application)                                  AS TotalApplications,
    (SELECT COUNT(*) FROM dbo.Application WHERE ApplicationStatus = 'Shortlisted') AS Shortlisted,
    (SELECT COUNT(*) FROM dbo.Interview)                                    AS TotalInterviews,
    (SELECT COUNT(*) FROM dbo.Offer)                                        AS TotalOffers,
    (SELECT COUNT(*) FROM dbo.Application WHERE ApplicationStatus = 'Hired')       AS TotalHires,
    (SELECT COUNT(*) FROM dbo.Application WHERE ApplicationStatus = 'Rejected')    AS TotalRejections,
    (SELECT COUNT(*) FROM dbo.Application WHERE ApplicationStatus = 'Withdrawn')   AS TotalWithdrawn;
GO

/* =====================================================================
   SECTION 6b: USER-DEFINED TABLE TYPES
   (supports sp_SubmitFeedback below, which now writes a variable
   number of competency ratings instead of three fixed columns)
   ===================================================================== */

IF TYPE_ID(N'dbo.CompetencyRatingTableType') IS NULL
BEGIN
    CREATE TYPE dbo.CompetencyRatingTableType AS TABLE
    (
        CompetencyName NVARCHAR(80) NOT NULL,
        Rating         SMALLINT     NOT NULL
    );
END
GO

/* =====================================================================
   SECTION 7: STORED PROCEDURES
   ===================================================================== */

CREATE OR ALTER PROCEDURE dbo.sp_RegisterUser
    @FirstName      NVARCHAR(50),
    @LastName       NVARCHAR(50),
    @Email          NVARCHAR(150),
    @PasswordHash   NVARCHAR(255),
    @PhoneNumber    NVARCHAR(20) = NULL,
    @RoleName       NVARCHAR(50) = 'Candidate',
    @CreatedBy      BIGINT = NULL,
    @NewUserID      BIGINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM dbo.[User] WHERE Email = @Email)
            THROW 50001, 'A user with this email already exists.', 1;

        DECLARE @RoleID INT = (SELECT RoleID FROM dbo.Role WHERE RoleName = @RoleName);
        IF @RoleID IS NULL
            THROW 50002, 'Specified role does not exist.', 1;

        BEGIN TRANSACTION;

        INSERT INTO dbo.[User] (FirstName, LastName, Email, PasswordHash, PhoneNumber, CreatedBy)
        VALUES (@FirstName, @LastName, @Email, @PasswordHash, @PhoneNumber, @CreatedBy);

        SET @NewUserID = SCOPE_IDENTITY();

        INSERT INTO dbo.UserRole (UserID, RoleID, CreatedBy)
        VALUES (@NewUserID, @RoleID, @CreatedBy);

        IF @RoleName = 'Candidate'
            INSERT INTO dbo.Candidate (UserID, CreatedBy) VALUES (@NewUserID, @CreatedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_CreateJob
    @Title                 NVARCHAR(150),
    @Description           NVARCHAR(MAX) = NULL,
    @Department             NVARCHAR(80)  = NULL,
    @CostCenter               NVARCHAR(50)  = NULL,
    @Headcount                  INT = 1,
    @BusinessJustification         NVARCHAR(MAX) = NULL,
    @Location                        NVARCHAR(100) = NULL,
    @EmploymentType                    NVARCHAR(30)  = NULL,
    @RecruiterID                          BIGINT,
    @HiringManagerID                        BIGINT = NULL,
    @SalaryMin                                DECIMAL(12,2) = NULL,
    @SalaryMax                                  DECIMAL(12,2) = NULL,
    @CreatedBy                                    BIGINT = NULL,
    @NewJobID                                       BIGINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.[User] WHERE UserID = @RecruiterID)
            THROW 50010, 'Recruiter does not exist.', 1;

        INSERT INTO dbo.Job (Title, Description, Department, CostCenter, Headcount, BusinessJustification,
                             Location, EmploymentType, RecruiterID, HiringManagerID, SalaryMin, SalaryMax,
                             JobStatus, CreatedBy)
        VALUES (@Title, @Description, @Department, @CostCenter, @Headcount, @BusinessJustification,
                @Location, @EmploymentType, @RecruiterID, @HiringManagerID, @SalaryMin, @SalaryMax,
                'Draft', @CreatedBy);

        SET @NewJobID = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_RecordApproval
    @EntityType      NVARCHAR(20),      -- 'Job' or 'Offer'
    @EntityID          BIGINT,
    @ApprovalStage        NVARCHAR(50),
    @ApproverID              BIGINT,
    @Decision                  NVARCHAR(20),    -- 'Approved' or 'Rejected'
    @Comments                    NVARCHAR(500) = NULL,
    @NewApprovalID                  BIGINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @EntityType NOT IN ('Job','Offer')
            THROW 50070, 'EntityType must be Job or Offer.', 1;

        IF @EntityType = 'Job' AND NOT EXISTS (SELECT 1 FROM dbo.Job WHERE JobID = @EntityID)
            THROW 50071, 'Job does not exist.', 1;

        IF @EntityType = 'Offer' AND NOT EXISTS (SELECT 1 FROM dbo.Offer WHERE OfferID = @EntityID)
            THROW 50072, 'Offer does not exist.', 1;

        INSERT INTO dbo.ApprovalHistory (EntityType, EntityID, ApprovalStage, ApproverID, Decision, Comments, ActionDate, CreatedBy)
        VALUES (@EntityType, @EntityID, @ApprovalStage, @ApproverID, @Decision, @Comments, GETDATE(), @ApproverID);

        SET @NewApprovalID = SCOPE_IDENTITY();

        IF @EntityType = 'Job' AND @Decision = 'Approved'
            UPDATE dbo.Job SET JobStatus = 'Approved', ModifiedDate = GETDATE(), ModifiedBy = @ApproverID WHERE JobID = @EntityID;
        ELSE IF @EntityType = 'Job' AND @Decision = 'Rejected'
            UPDATE dbo.Job SET JobStatus = 'Draft', ModifiedDate = GETDATE(), ModifiedBy = @ApproverID WHERE JobID = @EntityID;
        ELSE IF @EntityType = 'Offer' AND @Decision = 'Approved'
            UPDATE dbo.Offer SET OfferStatus = 'Sent', ModifiedDate = GETDATE(), ModifiedBy = @ApproverID WHERE OfferID = @EntityID;
        ELSE IF @EntityType = 'Offer' AND @Decision = 'Rejected'
            UPDATE dbo.Offer SET OfferStatus = 'Draft', ModifiedDate = GETDATE(), ModifiedBy = @ApproverID WHERE OfferID = @EntityID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_ApplyForJob
    @CandidateID        BIGINT,
    @JobID               BIGINT,
    @SourceChannel        NVARCHAR(50) = NULL,
    @ConsentGiven           BIT = 0,
    @ConsentVersion            NVARCHAR(20) = NULL,
    @CreatedBy                    BIGINT = NULL,
    @NewApplicationID                BIGINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Job WHERE JobID = @JobID AND JobStatus = 'Open')
            THROW 50020, 'Job is not open for applications.', 1;

        IF EXISTS (SELECT 1 FROM dbo.Application WHERE CandidateID = @CandidateID AND JobID = @JobID)
            THROW 50021, 'Candidate has already applied for this job.', 1;

        INSERT INTO dbo.Application (CandidateID, JobID, ApplicationStatus, SourceChannel, ConsentGiven, ConsentDate, ConsentVersion, CreatedBy)
        VALUES (@CandidateID, @JobID, 'Applied', @SourceChannel, @ConsentGiven,
                CASE WHEN @ConsentGiven = 1 THEN GETDATE() ELSE NULL END, @ConsentVersion, @CreatedBy);

        SET @NewApplicationID = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_SubmitScreeningResponse
    @ApplicationID    BIGINT,
    @QuestionID         BIGINT,
    @AnswerText           NVARCHAR(500) = NULL,
    @CreatedBy               BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @MandatoryFlag BIT, @DisqualifyingAnswer NVARCHAR(200);
        SELECT @MandatoryFlag = MandatoryFlag, @DisqualifyingAnswer = DisqualifyingAnswer
        FROM dbo.ScreeningQuestion WHERE QuestionID = @QuestionID;

        IF @MandatoryFlag IS NULL
            THROW 50081, 'Screening question does not exist.', 1;

        DECLARE @ResultStatus NVARCHAR(20) =
            CASE WHEN @DisqualifyingAnswer IS NOT NULL AND @AnswerText = @DisqualifyingAnswer THEN 'Fail'
                 ELSE 'Pass' END;

        MERGE dbo.ScreeningResponse AS target
        USING (SELECT @ApplicationID AS ApplicationID, @QuestionID AS QuestionID) AS src
        ON target.ApplicationID = src.ApplicationID AND target.QuestionID = src.QuestionID
        WHEN MATCHED THEN
            UPDATE SET AnswerText = @AnswerText, ResultStatus = @ResultStatus, ModifiedDate = GETDATE(), ModifiedBy = @CreatedBy
        WHEN NOT MATCHED THEN
            INSERT (ApplicationID, QuestionID, AnswerText, ResultStatus, CreatedBy)
            VALUES (@ApplicationID, @QuestionID, @AnswerText, @ResultStatus, @CreatedBy);
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_ShortlistCandidate
    @ApplicationID  BIGINT,
    @ModifiedBy     BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Application WHERE ApplicationID = @ApplicationID)
            THROW 50030, 'Application does not exist.', 1;

        -- BR-035: candidate must satisfy all mandatory eligibility criteria
        -- before being shortlisted. Block if any mandatory screening
        -- question failed, or is unanswered.
        IF EXISTS (
            SELECT 1
            FROM dbo.ScreeningQuestion q
            LEFT JOIN dbo.ScreeningResponse r
                ON r.QuestionID = q.QuestionID AND r.ApplicationID = @ApplicationID
            WHERE q.JobID = (SELECT JobID FROM dbo.Application WHERE ApplicationID = @ApplicationID)
              AND q.MandatoryFlag = 1
              AND (r.ResponseID IS NULL OR r.ResultStatus <> 'Pass')
        )
            THROW 50031, 'Candidate does not satisfy all mandatory screening criteria.', 1;

        UPDATE dbo.Application
        SET ApplicationStatus = 'Shortlisted',
            ModifiedDate = GETDATE(),
            ModifiedBy = @ModifiedBy
        WHERE ApplicationID = @ApplicationID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_WithdrawApplication
    @ApplicationID  BIGINT,
    @ModifiedBy     BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Application WHERE ApplicationID = @ApplicationID)
            THROW 50032, 'Application does not exist.', 1;

        UPDATE dbo.Application
        SET ApplicationStatus = 'Withdrawn', ModifiedDate = GETDATE(), ModifiedBy = @ModifiedBy
        WHERE ApplicationID = @ApplicationID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_ScheduleInterview
    @ApplicationID    BIGINT,
    @InterviewerID     BIGINT,
    @InterviewDate       DATETIME2,
    @InterviewType         NVARCHAR(30) = NULL,
    @InterviewMode           NVARCHAR(30) = NULL,
    @CreatedBy                 BIGINT = NULL,
    @NewInterviewID              BIGINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (
            SELECT 1 FROM dbo.Application
            WHERE ApplicationID = @ApplicationID
              AND ApplicationStatus IN ('Shortlisted','Interview Scheduled','Interview Completed')
        )
            THROW 50040, 'Candidate is not in an interview-eligible stage.', 1;

        INSERT INTO dbo.Interview (ApplicationID, InterviewerID, InterviewDate, InterviewType, InterviewMode, InterviewStatus, CreatedBy)
        VALUES (@ApplicationID, @InterviewerID, @InterviewDate, @InterviewType, @InterviewMode, 'Scheduled', @CreatedBy);

        SET @NewInterviewID = SCOPE_IDENTITY();

        UPDATE dbo.Application
        SET ApplicationStatus = 'Interview Scheduled', ModifiedDate = GETDATE(), ModifiedBy = @CreatedBy
        WHERE ApplicationID = @ApplicationID AND ApplicationStatus <> 'Interview Scheduled';
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_SubmitFeedback
    @InterviewID           BIGINT,
    @InterviewerID           BIGINT,
    @Ratings                   dbo.CompetencyRatingTableType READONLY,
    @Recommendation               NVARCHAR(20) = NULL,
    @Comments                        NVARCHAR(MAX) = NULL,
    @CreatedBy                          BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Interview WHERE InterviewID = @InterviewID)
            THROW 50050, 'Interview does not exist.', 1;

        BEGIN TRANSACTION;

        INSERT INTO dbo.InterviewFeedback (InterviewID, InterviewerID, Recommendation, Comments, CreatedBy)
        VALUES (@InterviewID, @InterviewerID, @Recommendation, @Comments, @CreatedBy);

        DECLARE @FeedbackID BIGINT = SCOPE_IDENTITY();

        INSERT INTO dbo.InterviewCompetencyRating (FeedbackID, CompetencyName, Rating, CreatedBy)
        SELECT @FeedbackID, CompetencyName, Rating, @CreatedBy FROM @Ratings;

        UPDATE dbo.Interview
        SET InterviewStatus = 'Completed', ModifiedDate = GETDATE(), ModifiedBy = @CreatedBy
        WHERE InterviewID = @InterviewID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_GenerateOffer
    @ApplicationID    BIGINT,
    @Salary            DECIMAL(12,2),
    @JoiningDate         DATE = NULL,
    @CreatedBy             BIGINT = NULL,
    @NewOfferID              BIGINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Application WHERE ApplicationID = @ApplicationID AND ApplicationStatus = 'Selected')
            THROW 50060, 'Offer can only be created for a selected candidate.', 1;

        IF EXISTS (SELECT 1 FROM dbo.Offer WHERE ApplicationID = @ApplicationID)
            THROW 50061, 'An offer already exists for this application.', 1;

        INSERT INTO dbo.Offer (ApplicationID, Salary, JoiningDate, OfferStatus, CreatedBy)
        VALUES (@ApplicationID, @Salary, @JoiningDate, 'Draft', @CreatedBy);

        SET @NewOfferID = SCOPE_IDENTITY();

        UPDATE dbo.Application
        SET ApplicationStatus = 'Offer Sent', ModifiedDate = GETDATE(), ModifiedBy = @CreatedBy
        WHERE ApplicationID = @ApplicationID;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

/* =====================================================================
   SECTION 8: TRIGGERS
   ===================================================================== */

-- ---------------------------------------------------------------------
-- 8a. ModifiedDate auto-update -- one trigger per mutable table (22;
-- AuditLog excluded by convention, see scope note 5 at top)
-- ---------------------------------------------------------------------
CREATE OR ALTER TRIGGER dbo.TR_User_SetModifiedDate ON dbo.[User] AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.[User] t INNER JOIN inserted i ON i.UserID = t.UserID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_Role_SetModifiedDate ON dbo.Role AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.Role t INNER JOIN inserted i ON i.RoleID = t.RoleID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_Skill_SetModifiedDate ON dbo.Skill AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.Skill t INNER JOIN inserted i ON i.SkillID = t.SkillID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_UserRole_SetModifiedDate ON dbo.UserRole AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.UserRole t INNER JOIN inserted i ON i.UserRoleID = t.UserRoleID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_Candidate_SetModifiedDate ON dbo.Candidate AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.Candidate t INNER JOIN inserted i ON i.CandidateID = t.CandidateID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_CandidateDemographic_SetModifiedDate ON dbo.CandidateDemographic AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.CandidateDemographic t INNER JOIN inserted i ON i.DemographicID = t.DemographicID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_Job_SetModifiedDate ON dbo.Job AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.Job t INNER JOIN inserted i ON i.JobID = t.JobID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_CandidateSkill_SetModifiedDate ON dbo.CandidateSkill AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.CandidateSkill t INNER JOIN inserted i ON i.CandidateSkillID = t.CandidateSkillID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_JobSkill_SetModifiedDate ON dbo.JobSkill AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.JobSkill t INNER JOIN inserted i ON i.JobSkillID = t.JobSkillID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_Education_SetModifiedDate ON dbo.Education AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.Education t INNER JOIN inserted i ON i.EducationID = t.EducationID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_WorkExperience_SetModifiedDate ON dbo.WorkExperience AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.WorkExperience t INNER JOIN inserted i ON i.ExperienceID = t.ExperienceID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_Certification_SetModifiedDate ON dbo.Certification AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.Certification t INNER JOIN inserted i ON i.CertificationID = t.CertificationID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_ScreeningQuestion_SetModifiedDate ON dbo.ScreeningQuestion AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.ScreeningQuestion t INNER JOIN inserted i ON i.QuestionID = t.QuestionID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_Application_SetModifiedDate ON dbo.Application AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.Application t INNER JOIN inserted i ON i.ApplicationID = t.ApplicationID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_ScreeningResponse_SetModifiedDate ON dbo.ScreeningResponse AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.ScreeningResponse t INNER JOIN inserted i ON i.ResponseID = t.ResponseID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_Interview_SetModifiedDate ON dbo.Interview AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.Interview t INNER JOIN inserted i ON i.InterviewID = t.InterviewID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_InterviewFeedback_SetModifiedDate ON dbo.InterviewFeedback AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.InterviewFeedback t INNER JOIN inserted i ON i.FeedbackID = t.FeedbackID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_InterviewCompetencyRating_SetModifiedDate ON dbo.InterviewCompetencyRating AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.InterviewCompetencyRating t INNER JOIN inserted i ON i.CompetencyRatingID = t.CompetencyRatingID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_Offer_SetModifiedDate ON dbo.Offer AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.Offer t INNER JOIN inserted i ON i.OfferID = t.OfferID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_ApprovalHistory_SetModifiedDate ON dbo.ApprovalHistory AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.ApprovalHistory t INNER JOIN inserted i ON i.ApprovalID = t.ApprovalID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_AIMatchDetail_SetModifiedDate ON dbo.AIMatchDetail AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.AIMatchDetail t INNER JOIN inserted i ON i.MatchDetailID = t.MatchDetailID; END
GO
CREATE OR ALTER TRIGGER dbo.TR_Notification_SetModifiedDate ON dbo.Notification AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET ModifiedDate = GETDATE() FROM dbo.Notification t INNER JOIN inserted i ON i.NotificationID = t.NotificationID; END
GO

-- ---------------------------------------------------------------------
-- 8b. Audit logging -- generic JSON-snapshot pattern, applied to the
-- eight most audit-critical tables (added CandidateDemographic and
-- ApprovalHistory to the original six in this revision, since
-- restricted-data access and approval decisions are exactly what an
-- audit trail exists for). To extend to another table, copy one of
-- these triggers and change the table name, PK column, and EntityType
-- literal -- the body is otherwise identical.
-- ---------------------------------------------------------------------
CREATE OR ALTER TRIGGER dbo.TR_Application_Audit ON dbo.Application AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ActionType NVARCHAR(10) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;

    INSERT INTO dbo.AuditLog (UserID, ActionType, EntityType, EntityID, OldValue, NewValue, ActionDate)
    SELECT
        COALESCE(i.ModifiedBy, i.CreatedBy, d.ModifiedBy, d.CreatedBy),
        @ActionType, 'Application', COALESCE(i.ApplicationID, d.ApplicationID),
        (SELECT d.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        (SELECT i.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        GETDATE()
    FROM inserted i
    FULL OUTER JOIN deleted d ON d.ApplicationID = i.ApplicationID;
END
GO

CREATE OR ALTER TRIGGER dbo.TR_Offer_Audit ON dbo.Offer AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ActionType NVARCHAR(10) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;

    INSERT INTO dbo.AuditLog (UserID, ActionType, EntityType, EntityID, OldValue, NewValue, ActionDate)
    SELECT
        COALESCE(i.ModifiedBy, i.CreatedBy, d.ModifiedBy, d.CreatedBy),
        @ActionType, 'Offer', COALESCE(i.OfferID, d.OfferID),
        (SELECT d.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        (SELECT i.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        GETDATE()
    FROM inserted i
    FULL OUTER JOIN deleted d ON d.OfferID = i.OfferID;
END
GO

CREATE OR ALTER TRIGGER dbo.TR_Interview_Audit ON dbo.Interview AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ActionType NVARCHAR(10) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;

    INSERT INTO dbo.AuditLog (UserID, ActionType, EntityType, EntityID, OldValue, NewValue, ActionDate)
    SELECT
        COALESCE(i.ModifiedBy, i.CreatedBy, d.ModifiedBy, d.CreatedBy),
        @ActionType, 'Interview', COALESCE(i.InterviewID, d.InterviewID),
        (SELECT d.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        (SELECT i.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        GETDATE()
    FROM inserted i
    FULL OUTER JOIN deleted d ON d.InterviewID = i.InterviewID;
END
GO

CREATE OR ALTER TRIGGER dbo.TR_InterviewFeedback_Audit ON dbo.InterviewFeedback AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ActionType NVARCHAR(10) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;

    INSERT INTO dbo.AuditLog (UserID, ActionType, EntityType, EntityID, OldValue, NewValue, ActionDate)
    SELECT
        COALESCE(i.ModifiedBy, i.CreatedBy, d.ModifiedBy, d.CreatedBy),
        @ActionType, 'InterviewFeedback', COALESCE(i.FeedbackID, d.FeedbackID),
        (SELECT d.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        (SELECT i.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        GETDATE()
    FROM inserted i
    FULL OUTER JOIN deleted d ON d.FeedbackID = i.FeedbackID;
END
GO

CREATE OR ALTER TRIGGER dbo.TR_Candidate_Audit ON dbo.Candidate AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ActionType NVARCHAR(10) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;

    INSERT INTO dbo.AuditLog (UserID, ActionType, EntityType, EntityID, OldValue, NewValue, ActionDate)
    SELECT
        COALESCE(i.ModifiedBy, i.CreatedBy, d.ModifiedBy, d.CreatedBy),
        @ActionType, 'Candidate', COALESCE(i.CandidateID, d.CandidateID),
        (SELECT d.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        (SELECT i.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        GETDATE()
    FROM inserted i
    FULL OUTER JOIN deleted d ON d.CandidateID = i.CandidateID;
END
GO

CREATE OR ALTER TRIGGER dbo.TR_Job_Audit ON dbo.Job AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ActionType NVARCHAR(10) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;

    INSERT INTO dbo.AuditLog (UserID, ActionType, EntityType, EntityID, OldValue, NewValue, ActionDate)
    SELECT
        COALESCE(i.ModifiedBy, i.CreatedBy, d.ModifiedBy, d.CreatedBy),
        @ActionType, 'Job', COALESCE(i.JobID, d.JobID),
        (SELECT d.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        (SELECT i.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        GETDATE()
    FROM inserted i
    FULL OUTER JOIN deleted d ON d.JobID = i.JobID;
END
GO

CREATE OR ALTER TRIGGER dbo.TR_CandidateDemographic_Audit ON dbo.CandidateDemographic AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ActionType NVARCHAR(10) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;

    INSERT INTO dbo.AuditLog (UserID, ActionType, EntityType, EntityID, OldValue, NewValue, ActionDate)
    SELECT
        COALESCE(i.ModifiedBy, i.CreatedBy, d.ModifiedBy, d.CreatedBy),
        @ActionType, 'CandidateDemographic', COALESCE(i.DemographicID, d.DemographicID),
        (SELECT d.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        (SELECT i.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        GETDATE()
    FROM inserted i
    FULL OUTER JOIN deleted d ON d.DemographicID = i.DemographicID;
END
GO

CREATE OR ALTER TRIGGER dbo.TR_ApprovalHistory_Audit ON dbo.ApprovalHistory AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ActionType NVARCHAR(10) =
        CASE WHEN EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS (SELECT 1 FROM inserted) THEN 'INSERT'
             ELSE 'DELETE' END;

    INSERT INTO dbo.AuditLog (UserID, ActionType, EntityType, EntityID, OldValue, NewValue, ActionDate)
    SELECT
        COALESCE(i.ModifiedBy, i.CreatedBy, d.ModifiedBy, d.CreatedBy),
        @ActionType, 'ApprovalHistory', COALESCE(i.ApprovalID, d.ApprovalID),
        (SELECT d.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        (SELECT i.* FOR JSON AUTO, INCLUDE_NULL_VALUES),
        GETDATE()
    FROM inserted i
    FULL OUTER JOIN deleted d ON d.ApprovalID = i.ApprovalID;
END
GO

/* =====================================================================
   END OF SCRIPT
   ===================================================================== */
