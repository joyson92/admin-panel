#!/usr/bin/env bash
set -euo pipefail
FRONTEND_ORIGIN="${1:-}"
STAFF_DB_SECRET_ARN="${2:-}"
STAFF_DB_SUBNET_IDS="${3:-}"
STAFF_LAMBDA_SECURITY_GROUP_ID="${4:-}"
ATTENDANCE_DB_SECRET_ARN="${5:-$STAFF_DB_SECRET_ARN}"
ATTENDANCE_DB_SUBNET_IDS="${6:-$STAFF_DB_SUBNET_IDS}"
ATTENDANCE_LAMBDA_SECURITY_GROUP_ID="${7:-$STAFF_LAMBDA_SECURITY_GROUP_ID}"
if [[ -z "$FRONTEND_ORIGIN" || -z "$STAFF_DB_SECRET_ARN" || -z "$STAFF_DB_SUBNET_IDS" || -z "$STAFF_LAMBDA_SECURITY_GROUP_ID" ]]; then
 echo "Usage: $0 <frontend-origin> <staff-secret-arn> <staff-subnets> <staff-sg> [company-id] [attendance-secret-arn] [attendance-subnets] [attendance-sg] [attendance-company-id]"; exit 1
fi
export AWS_DEFAULT_REGION=us-east-1
aws sts get-caller-identity >/dev/null
sam validate --template-file template.yaml
sam build --template-file template.yaml
sam deploy --template-file .aws-sam/build/template.yaml --stack-name ta-time-attendance --region us-east-1 --resolve-s3 --capabilities CAPABILITY_IAM --parameter-overrides "FrontendOrigin=$FRONTEND_ORIGIN" "StaffDbSecretArn=$STAFF_DB_SECRET_ARN" "StaffDbSubnetIds=$STAFF_DB_SUBNET_IDS" "StaffLambdaSecurityGroupId=$STAFF_LAMBDA_SECURITY_GROUP_ID" "AttendanceDbSecretArn=$ATTENDANCE_DB_SECRET_ARN" "AttendanceDbSubnetIds=$ATTENDANCE_DB_SUBNET_IDS" "AttendanceLambdaSecurityGroupId=$ATTENDANCE_LAMBDA_SECURITY_GROUP_ID" --no-confirm-changeset
aws cloudformation describe-stacks --stack-name ta-time-attendance --region us-east-1 --query 'Stacks[0].Outputs' --output table
