# Apply on Website - Implementation Details

## Architecture Overview

```
User Click → Frontend Call → API Endpoint
                              ↓
                    Authentication Check
                              ↓
                    applyOnWebsite() Controller
                              ↓
                    applyOnWebsiteService()
                     /                  \
            Try to Fetch Job Data    Error Handling
                     |                    |
            Provision Recruiter    Fallback to Generic
                     |                    |
            Create Chat Connection       |
                     |___________________/
                              ↓
                        Return 200 OK
                         (Always)
```

## Key Implementation Details

### 1. Fallback Mechanism (`fetchJobDataWithFallback`)

**Purpose**: Gracefully handle API failures while still providing the feature

```typescript
// If API succeeds:
{
  company: { companyName: "Actual Company Name" },
  city: "Stockholm",
  country: "Sweden"
}

// If API fails:
null

// Result: Uses generic company name "Job Bank - {jobId}"
```

**Benefits**:

- Feature works even if API is down
- No user-facing errors
- Proper logging for debugging
- Maintains feature availability

### 2. Recruiter Provisioning (`provisionRecruiterService`)

**Database Query Pattern**:

```typescript
// Case-insensitive search with optional location matching
WHERE companyName = 'X' (case-insensitive)
  AND city = 'Y' (if provided, case-insensitive)
  AND country = 'Z' (if provided, case-insensitive)
```

**New Account Creation** (if not found):

```typescript
{
  email: "recruiter-{timestamp}-{random}@trustbee.auto",
  password: bcrypt.hash("trustbee-{timestamp}-{random}"),
  companyName: "From API or Fallback",
  phoneNumber: "0000000000", // Placeholder
  organizationNumber: "AUTO-{timestamp}", // Placeholder
  city: "From API or undefined",
  country: "From API or undefined"
}
```

### 3. Chat Connection (`ensureChatConnectionService`)

**Logic**:

- Checks if ANY message exists between job seeker and recruiter
- If no messages: Creates initial system message
- This makes recruiter appear in chat list

**Message Content**:

```
[System: Connection established for job application]
```

### 4. Email Notification (`sendRecruiterNotificationEmail`)

**Triggered**: Only when recruiter is newly created

**Email Template**:

```
Subject: Your Trustbee account is ready - {JobSeekerName} is interested!

Body:
- Welcome message
- Company name
- Candidate name
- Account setup link (with pre-filled email)
- Instructions to complete profile

Link Format:
{FRONTEND_URL}/recruiter/onboarding?email=recruiter-*@trustbee.auto
```

## Error Scenarios & Handling

### Scenario 1: API Connection Failed

```
Status: 200 OK
Action: Use fallback company name "Job Bank - {jobId}"
Log: Warning message with original error
Result: Feature still works
```

### Scenario 2: Recruiter Already Exists

```
Status: 200 OK
Action: Skip creation, use existing ID
Email: Not sent
Chat: Connected immediately
```

### Scenario 3: Database Constraint Violation

```
Status: 200 OK
Action: Silent error catch
Log: Error message
Result: Returns success to avoid breaking UX
```

### Scenario 4: Email Service Down

```
Status: 200 OK
Action: Log error, continue
Email: Not sent (non-blocking)
Result: Application still succeeds
```

## Data Flow Examples

### Example 1: New Recruiter (Happy Path)

```
Input:
- jobSeekerId: 5
- jobBankId: "8570682"
- jobSeekerFirstName: "Anna"

Step 1: Fetch Job Data
Output: company="Spotify", city="Stockholm", country="Sweden"

Step 2: Provision Recruiter
Search: Find Spotify + Stockholm + Sweden (not found)
Create: New recruiter account
Email: Send welcome notification
Output: recruiterId = 42

Step 3: Chat Connection
Create: Message record linking job seeker 5 ↔ recruiter 42
Output: Chat established

Final Response:
{
  "status": "success",
  "message": "Application initiated successfully"
}
```

### Example 2: API Unavailable

```
Input:
- jobSeekerId: 5
- jobBankId: "8570682"
- jobSeekerFirstName: "Anna"

Step 1: Fetch Job Data
Error: Network timeout
Fallback: companyName = "Job Bank - 8570682"

Step 2: Provision Recruiter
Search: Find "Job Bank - 8570682" (not found)
Create: New recruiter with fallback name
Output: recruiterId = 43

Step 3: Chat Connection
Create: Message record
Output: Chat established

Final Response:
{
  "status": "success",
  "message": "Application initiated successfully"
}
```

### Example 3: Existing Recruiter

```
Input:
- jobSeekerId: 5
- jobBankId: "8570682"
- jobSeekerFirstName: "Anna"

Step 1: Fetch Job Data
Output: company="Spotify", city="Stockholm", country="Sweden"

Step 2: Provision Recruiter
Search: Find Spotify + Stockholm + Sweden (FOUND!)
Output: recruiterId = 42 (existing)

Step 3: Chat Connection
Check: Messages exist between 5 ↔ 42 (YES)
Skip: Don't create duplicate
Output: Chat ready

Final Response:
{
  "status": "success",
  "message": "Application initiated successfully"
}
```

## Code Dependencies

```
application.service.ts
├── bcrypt (password hashing)
├── job.service.ts (getBankJobByIdService)
├── mailer.ts (sendRecruiterNotificationEmail)
├── prisma (database)
│   ├── companyRecruiter.findFirst()
│   ├── companyRecruiter.create()
│   ├── messages.findFirst()
│   └── messages.create()
└── app.error.ts (error handling)

application.controller.ts
├── application.service.ts (applyOnWebsiteService)
└── middleware (authentication)

auth.middleware.ts
└── JWT payload (includes firstName)
```

## Performance Considerations

### Database Queries

- `findFirst` on CompanyRecruiter: O(1) with indexed companyName
- `create` operations: Standard write performance
- `findFirst` on Messages: O(1) with indexed relationships

### API Calls

- Arbetsförmedlingen API: ~2-5 second timeout
- Fallback activates on timeout: Feature doesn't block

### Email Sending

- Non-blocking: No wait for response
- Timeout: 10 seconds
- Failure: Logged but doesn't break flow

### Expected Latency

- Happy path: ~3-5 seconds (API call)
- Fallback path: ~100-200ms (no API call)
- Expected user experience: Instant (async processing)

## Monitoring & Debugging

### Logs to Monitor

```bash
# Warnings (non-critical):
"Failed to fetch job data for {jobBankId}, using fallback"
"Failed to send recruiter notification email"

# Errors (debug):
"Error in applyOnWebsiteService"
```

### Database Verification

```sql
-- Verify recruiter creation
SELECT id, email, "companyName", city, country
FROM "CompanyRecruiter"
WHERE email LIKE 'recruiter-%@trustbee.auto'
ORDER BY id DESC LIMIT 5;

-- Verify message creation
SELECT * FROM "Messages"
WHERE content LIKE '[System:%'
ORDER BY "createdAt" DESC LIMIT 5;

-- Check user counts
SELECT
  COUNT(*) as "recruiters",
  COUNT(CASE WHEN email LIKE 'recruiter-%' THEN 1 END) as "auto_provisioned"
FROM "CompanyRecruiter";
```

## Security Audit

- ✅ No SQL injection: Using Prisma ORM
- ✅ No credential leakage: Passwords hashed, not exposed
- ✅ No authorization bypass: JWT verified, role checked
- ✅ Error handling: No stack traces to user
- ✅ Rate limiting: Apply to existing endpoints
- ✅ Input validation: jobBankId is string, passed safely

## Future Optimization

1. **Caching**: Cache job data temporarily to reduce API calls
2. **Batch Processing**: Process multiple applications in batch
3. **Event-Based**: Trigger recruiter setup completion emails
4. **Analytics**: Track provisioning success rates
5. **A/B Testing**: Test email effectiveness
