# Apply on Website - Quick Reference

## Endpoint

```
POST /api/applications/website/:jobBankId
Authorization: Bearer {jwt_token}
```

## Response (Always 200 OK)

```json
{
  "status": "success",
  "message": "Application initiated successfully"
}
```

## What Happens Behind the Scenes

| Step | Action                     | Result                          |
| ---- | -------------------------- | ------------------------------- |
| 1    | Fetch job from API         | Get company details             |
| 2    | Search recruiter           | Find or prepare to create       |
| 3    | Create account (if needed) | Auto-generated email & password |
| 4    | Send email (if new)        | Welcome + setup link            |
| 5    | Create chat message        | Recruiter appears in DMs        |

## Key Features

✅ **Silent** - No errors to user
✅ **Idempotent** - Safe to call multiple times
✅ **Resilient** - Works even if API down
✅ **Instant** - Chat ready immediately
✅ **Traceable** - All actions logged

## Environment Setup

```bash
# .env file
FRONTEND_URL=https://yourdomain.com
ADMIN_EMAIL=noreply@trustbee.app
ADMIN_EMAIL_PASSWORD=your_app_password
JWT_SECRET=your_secret_key
```

## Testing

```bash
# 1. Get JWT token (from login)
TOKEN=$(curl -X POST http://localhost:3000/api/auth/jobseeker/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password"}' | jq -r '.token')

# 2. Call apply endpoint
curl -X POST http://localhost:3000/api/applications/website/8570682 \
  -H "Authorization: Bearer $TOKEN"

# 3. Verify in database
sqlite3 prisma/dev.db "SELECT COUNT(*) as messages FROM Messages WHERE content LIKE '[System:%'"
```

## Troubleshooting

| Problem               | Check        | Solution                      |
| --------------------- | ------------ | ----------------------------- |
| 401 Unauthorized      | JWT token    | Ensure Bearer token in header |
| 403 Forbidden         | User role    | Must be JOB_SEEKER            |
| Recruiter not in chat | Database     | Check Messages table          |
| Email not sent        | Email config | Check ADMIN_EMAIL variables   |

## Database Tables Affected

| Table              | Operation     | Notes                           |
| ------------------ | ------------- | ------------------------------- |
| `CompanyRecruiter` | INSERT/SELECT | Only if recruiter new           |
| `Messages`         | INSERT/SELECT | Always (establishes connection) |

## Code Files

- Service: `src/services/application.service.ts`
- Controller: `src/controllers/application.controller.ts`
- Routes: `src/routes/application.routes.ts`
- Email: `src/utils/mailer.ts`

## API Flow

```
JOB SEEKER CLIENT
    ↓
[Click "Apply on Website"]
    ↓
POST /api/applications/website/:jobBankId
    ↓
BACKEND
├─ Auth Check (JWT)
├─ Fetch API Data (with fallback)
├─ Provision Recruiter (if needed)
├─ Create Chat Message
├─ Send Email (silent fail if down)
    ↓
200 OK { status: "success" }
    ↓
JOB SEEKER SEES
├─ External link opens in new tab
├─ Recruiter appears in DMs instantly
└─ No errors or loading states
```

## Generated Account Details

```
Email:              recruiter-{timestamp}-{random}@trustbee.auto
Password:           Auto-hashed (user gets setup link)
Phone:              0000000000 (placeholder)
Organization ID:    AUTO-{timestamp} (placeholder)
Company Name:       From API or "Job Bank - {id}"
```

## Email Content

Subject: `Your Trustbee account is ready - {CandidateName} is interested!`

Contains:

- Welcome message
- Candidate name
- Account setup link
- Instructions to complete profile

## Common Queries

### Find all auto-provisioned recruiters

```sql
SELECT * FROM "CompanyRecruiter"
WHERE email LIKE 'recruiter-%@trustbee.auto';
```

### Check recent applications

```sql
SELECT
  js."firstName",
  cr."companyName",
  m."createdAt"
FROM "Messages" m
JOIN "JobSeeker" js ON m."senderJobSeekerId" = js.id
JOIN "CompanyRecruiter" cr ON m."receiverRecruiterId" = cr.id
WHERE m.content LIKE '[System:%'
ORDER BY m."createdAt" DESC
LIMIT 10;
```

### Track provisioning success

```sql
SELECT
  COUNT(*) as total_applications,
  COUNT(DISTINCT cr.id) as unique_recruiters,
  COUNT(DISTINCT cr.id) FILTER (WHERE cr.email LIKE 'recruiter-%') as auto_provisioned
FROM "Messages" m
JOIN "CompanyRecruiter" cr ON m."receiverRecruiterId" = cr.id
WHERE m.content LIKE '[System:%';
```

## Monitoring Checklist

- [ ] No 500 errors in logs
- [ ] Warning messages (API fallback) logged
- [ ] Recruiter emails sent successfully
- [ ] Chat messages created for all applications
- [ ] No duplicate recruiters created
- [ ] JWT tokens include firstName
- [ ] Database connections stable

## Related Endpoints

| Endpoint                         | Purpose         |
| -------------------------------- | --------------- |
| `POST /api/auth/jobseeker/login` | Get JWT token   |
| `GET /api/messages`              | View chats      |
| `POST /api/messages`             | Send message    |
| `GET /api/jobs`                  | Browse all jobs |

## Notes for Developers

- Feature always returns 200 OK (errors silent)
- API timeout = 2-5 seconds (then fallback)
- Email is non-blocking (set and forget)
- Database calls are optimized with indexes
- All operations logged for auditing
- No personal data exposed in errors

---

Last Updated: April 30, 2026
