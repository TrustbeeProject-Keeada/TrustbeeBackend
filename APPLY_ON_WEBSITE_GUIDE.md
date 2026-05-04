# Apply on Website - Feature Guide

## Overview

This feature enables Job Seekers to click "Apply on Website" for jobs from the Arbetsförmedlingen API. The backend automatically:

1. Finds or creates a Recruiter account
2. Establishes a chat connection
3. Sends notifications (if new account created)
4. Returns success silently (no errors to user)

## API Endpoint

### POST `/api/applications/website/:jobBankId`

**Authentication:** Required (Job Seeker only)

**Parameters:**

- `jobBankId` (string): Job ID from Arbetsförmedlingen API

**Headers:**

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Response:**

```json
{
  "status": "success",
  "message": "Application initiated successfully"
}
```

**Response Status:** Always `200 OK` (errors are handled silently)

## How It Works

### Scenario A: Recruiter Account Doesn't Exist

1. Backend fetches job from Arbetsförmedlingen API
2. Searches for recruiter by company name + location
3. If not found:
   - Creates new recruiter account with auto-generated email: `recruiter-{timestamp}-{random}@trustbee.auto`
   - Generates secure hashed password
   - Stores company info (name, city, country)
4. Sends welcome email to recruiter with account setup link
5. Creates chat connection message

### Scenario B: Recruiter Account Already Exists

1. Backend finds existing recruiter
2. Establishes chat connection
3. Returns success (no email sent)

### Error Handling

- **API Unreachable**: Falls back to generic company name (`Job Bank - {jobId}`)
- **Database Errors**: Fails silently, still returns 200 OK to user
- **Email Send Fails**: Fails silently, doesn't break the flow

## Environment Variables

Required for email notifications:

```env
ADMIN_EMAIL=your-email@gmail.com
ADMIN_EMAIL_PASSWORD=your-app-password
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=your-secret-key
```

## Testing

### 1. Basic Test

```bash
# Get a valid JWT token from login endpoint
JWT_TOKEN="your_token_here"
JOB_ID="8570682"  # Example job ID from Arbetsförmedlingen

curl -X POST http://localhost:3000/api/applications/website/$JOB_ID \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "status": "success",
#   "message": "Application initiated successfully"
# }
```

### 2. Test with Invalid Job ID

```bash
curl -X POST http://localhost:3000/api/applications/website/invalid123 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"

# Still returns success (API error handled gracefully)
```

### 3. Test Without Authentication

```bash
curl -X POST http://localhost:3000/api/applications/website/8570682

# Returns 401 Unauthorized
```

### 4. Verify Chat Connection

After calling the endpoint, verify in database:

```sql
-- Check if message was created
SELECT * FROM "Messages"
WHERE "senderJobSeekerId" = {jobSeekerId}
AND "receiverRecruiterId" = {recruiterId};

-- Check recruiter was created
SELECT * FROM "CompanyRecruiter"
WHERE "email" LIKE 'recruiter-%@trustbee.auto';
```

## Database Records Created

When new recruiter is provisioned:

**CompanyRecruiter table:**

- `email`: `recruiter-{timestamp}-{random}@trustbee.auto`
- `password`: Hashed (cannot be used for normal login initially)
- `companyName`: From API or generic fallback
- `city`: From API or NULL
- `country`: From API or NULL
- `phoneNumber`: `0000000000` (placeholder)
- `organizationNumber`: `AUTO-{timestamp}` (placeholder)

**Messages table:**

- `senderJobSeekerId`: The job seeker's ID
- `receiverRecruiterId`: The recruiter's ID
- `content`: `[System: Connection established for job application]`
- `createdAt`: Current timestamp

## Recruiter Onboarding Flow

1. **Account Created**: Recruiter receives email at `recruiter-*@trustbee.auto`
2. **Email Contains**: Account setup link with pre-filled email
3. **Link**: `{FRONTEND_URL}/recruiter/onboarding?email=recruiter-*@trustbee.auto`
4. **Recruiter Updates**: Email, password, and company details
5. **Chat Ready**: Job seeker can send messages immediately

## Security Considerations

- ✅ Auto-generated accounts are isolated from normal accounts
- ✅ Passwords are hashed with bcrypt
- ✅ No credential leakage in responses
- ✅ JWT tokens include firstName for context
- ✅ All database operations are validated
- ✅ Errors never exposed to frontend

## Troubleshooting

### Issue: Getting 401 Unauthorized

- **Cause**: JWT token missing or invalid
- **Fix**: Ensure token is passed in Authorization header as `Bearer {token}`

### Issue: Getting 403 Forbidden

- **Cause**: User is not a Job Seeker
- **Fix**: Only Job Seekers can use this endpoint

### Issue: Recruiter not appearing in chat

- **Cause**: Chat message not created
- **Debug**: Check Messages table for record creation
- **Fix**: Verify job seeker ID and recruiter ID in database

### Issue: Email not sent to recruiter

- **Cause**: Email service misconfigured or unreachable
- **Debug**: Check logs for "Failed to send recruiter notification email"
- **Note**: Application still succeeds (email is non-blocking)

### Issue: API failing to fetch job data

- **Cause**: Arbetsförmedlingen API unreachable or job ID invalid
- **Fix**: Backend falls back to generic company name automatically
- **Note**: Feature still works with fallback data

## Monitoring

Monitor these logs for potential issues:

```bash
# Warning logs (non-blocking):
"Failed to fetch job data for {jobBankId}, using fallback"
"Failed to send recruiter notification email"

# Error logs (shouldn't occur):
"Error in applyOnWebsiteService"
```

## Future Enhancements

- [ ] Batch process recruiter profile updates
- [ ] Send reminder emails if recruiter doesn't complete setup
- [ ] Track job application source for analytics
- [ ] Support multiple company locations
- [ ] Add webhook for external recruiter notifications
- [ ] Implement recruiter profile auto-fill from API data

## Related Features

- **Recruiter Onboarding**: `/recruiter/onboarding`
- **Job Bank Integration**: Arbetsförmedlingen API fetch
- **Chat System**: Messages service for Job Seeker ↔ Recruiter
- **Auth**: JWT-based authentication with role-based access
