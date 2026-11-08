# TA — Time & Attendance

React admin frontend with Amazon Cognito authentication and a Python 3.12 AWS Lambda API.

Deployment target: us-east-1; private S3 + CloudFront frontend; API Gateway HTTP API; Cognito email sign-in; administrator-provisioned users in the ADMIN group. See `backend/README.md`.


## Staff and attendance frontend integration

The Admin dashboard now loads Staff from `GET /staff` through `src/services/staffService.js`.
The list displays only fields returned by the current `ta_users` schema: name, email, external ID, created date and active status. Add/Edit send `name`, `email`, `external_id` and `active` to the Staff Lambda. Deactivate calls `DELETE /staff/{id}`.

Attendance views use `src/services/attendanceService.js` and `src/components/attendance/AttendanceModule.jsx`:
- Today's Attendance: `GET /attendance/today?date=YYYY-MM-DD`
- Employee Attendance: first loads `GET /staff` for the employee selector, then `GET /attendance/employees/{id}?start_date=...&end_date=...`
- Attendance Sheet: `GET /attendance/sheet?month=YYYY-MM`

All requests go through `src/services/apiClient.js`, which attaches the Cognito access token as a Bearer token. Set `VITE_API_BASE_URL` in `.env.production` to the API Gateway base URL (no trailing slash), then rebuild the frontend and upload the generated `dist/` files to S3. The backend stack must already have the matching routes deployed.

Note: current `ta_users` schema does not store gender, phone, address, salary, department or designation as separate columns. The Staff list therefore intentionally shows only fields persisted by the existing table rather than displaying invented placeholder values.
