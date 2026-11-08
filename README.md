# TA — Time & Attendance

Admin-focused React frontend with Amazon Cognito authentication and a Java 21 / Spring Boot API foundation for AWS.

## AWS deployment target

- Region: `us-east-1`
- Deployment: AWS CloudShell + AWS SAM / CloudFormation
- Backend: API Gateway HTTP API + Java 21 Lambda + Cognito `ADMIN` group
- Frontend: private Amazon S3 bucket + Amazon CloudFront (OAC)

Follow [`backend/README.md`](backend/README.md) for the console setup and deployment sequence.

## Frontend local development

```bash
npm install
cp .env.example .env.local
# Fill in the Cognito and API values from the deployed CloudFormation stack.
npm run dev
```

## Project structure

- `src/` — React admin UI, Cognito authentication, and API client.
- `backend/` — Spring Boot API, SAM template, Cognito ADMIN group, and CloudShell deployment script.

## Scope note

The current backend provides the authentication and API foundation. Staff and attendance persistence endpoints are not yet implemented; dashboard rows currently include sample data and must not be used as live records.
