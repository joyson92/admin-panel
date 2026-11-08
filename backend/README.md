# TA backend deployment

Includes the existing Cognito/API authentication Lambda and a dedicated `ta-staff-api` Python 3.12 Lambda using the existing MySQL/InnoDB `ta_users` table.

## Secrets Manager
Create a secret in `us-east-1` with JSON: `{"host":"YOUR_RDS_ENDPOINT","port":3306,"username":"ta_app","password":"...","database":"YOUR_DATABASE","ssl":true}`. Use a least-privilege DB user with SELECT, INSERT and UPDATE on `ta_users`.

The database security group must allow inbound TCP/3306 from the Lambda security group. Lambda runs in private subnets with network access to the database. Provide Secrets Manager connectivity using NAT or a VPC endpoint.

## Deploy from CloudShell
`./deploy-cloudshell.sh https://YOUR-CLOUDFRONT-DOMAIN.cloudfront.net arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:ta/mysql-SUFFIX subnet-aaaa,subnet-bbbb sg-xxxxxxxx 1`

The last argument is company_id (default 1).

## Staff API
- GET `/staff` — active staff for configured company
- GET `/staff/{id}` — one staff member
- POST `/staff` — create with `name`, `email`, optional `face_id`, `external_id`
- PUT `/staff/{id}` — update allowed fields
- DELETE `/staff/{id}` — soft delete (`active=0`)

All routes use the API Cognito JWT authorizer and independently verify `ADMIN` group membership.

## Existing table assumptions
Uses `ta_users`: `id`, `name`, `email`, `face_id`, `created_at`, `updated_at`, `active`, `external_id`, `company_id`. `created_at`/`updated_at` should have timestamp defaults.

The frontend staff list is connected to the API. The current table does not include mobile, address, gender, salary or designation columns, so those fields are not persisted and display placeholders. Account password fields are not sent to MySQL; provision Cognito staff identities separately if needed.

Attendance Lambda: separate `ta-attendance-api` provides GET `/attendance/today`, GET `/attendance/employees/{id}`, and GET `/attendance/sheet`. Reuses staff secret/VPC parameters by default. Current table stores check-in events only; no checkout, break, shift, leave or holiday values are inferred.
