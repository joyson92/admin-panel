# TA Staff Lambda

Dedicated Python 3.12 Lambda for CRUD against the existing MySQL/InnoDB `ta_users` table. Uses PyMySQL and AWS Secrets Manager.

Secret JSON shape:
```json
{"host":"your-rds-endpoint","port":3306,"username":"ta_app","password":"...","database":"your_database","ssl":true}
```

The Lambda runs in private subnets and needs network access to MySQL TCP/3306. Attach the Lambda security group to the function and allow inbound TCP/3306 from that security group on the database security group. The execution role needs `secretsmanager:GetSecretValue` and VPC ENI permissions.

`STAFF_COMPANY_ID` scopes list, read, update and soft-delete operations. The create endpoint uses the configured company ID unless a company_id is explicitly passed. For a multi-tenant system, derive company_id from a trusted identity claim or server-side user-to-company mapping instead of accepting it from arbitrary client input.

Deletion is soft: `active=0`; no row is physically deleted.
