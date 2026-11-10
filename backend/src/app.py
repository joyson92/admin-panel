
import json
import os
import boto3
from typing import Any

cognito = boto3.client(
    "cognito-idp",
    region_name=os.environ.get("AWS_REGION", "us-east-1")
)

USER_POOL_ID = os.environ["COGNITO_USER_POOL_ID"]


def response(status: int, payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {
            "content-type": "application/json",
            "cache-control": "no-store"
        },
        "body": json.dumps(payload)
    }


def get_claims(event: dict[str, Any]) -> dict[str, Any]:
    return (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("jwt", {})
        .get("claims", {})
    )


def get_groups(claims: dict[str, Any]) -> list[str]:
    raw = claims.get("cognito:groups", [])

    if isinstance(raw, list):
        values = raw
    elif isinstance(raw, str):
        try:
            value = json.loads(raw)
            values = value if isinstance(value, list) else [value]
        except json.JSONDecodeError:
            values = raw.strip("[]").split(",")
    else:
        values = []

    return [
        str(group).strip().strip("'\"[] ")
        for group in values
        if str(group).strip().strip("'\"[] ")
    ]


def get_cognito_attributes(claims: dict[str, Any]) -> dict[str, str]:
    """
    Retrieve trusted user attributes directly from Cognito.
    Never accept company_id or branch_id from request payload.
    """

    username = (
        claims.get("cognito:username")
        or claims.get("username")
        or claims.get("email")
    )

    if not username:
        raise ValueError("Unable to identify authenticated Cognito user")

    result = cognito.admin_get_user(
        UserPoolId=USER_POOL_ID,
        Username=username
    )

    return {
        item["Name"]: item["Value"]
        for item in result.get("UserAttributes", [])
    }


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:

    request = event.get("requestContext", {}).get("http", {})
    method = request.get("method", "GET")
    path = event.get("rawPath") or event.get("path") or ""

    if method == "OPTIONS":
        return {"statusCode": 204, "headers": {}, "body": ""}

    claims = get_claims(event)

    if not claims:
        return response(401, {"message": "Unauthorized"})

    groups = get_groups(claims)
    is_admin = any(group.upper() == "ADMIN" for group in groups)

    if path == "/api/health" and method == "GET":
        return response(200, {
            "status": "UP",
            "service": "ta-api"
        })

    if path == "/api/me" and method == "GET":

        subject = claims.get("sub", "")

        try:
            attributes = get_cognito_attributes(claims)

            company_id = attributes.get("custom:company_id")
            branch_id = attributes.get("custom:branch_id")
            fname = attributes.get("custom:name")

            return response(200, {
                "id": subject,
                "username": (
                    claims.get("cognito:username")
                    or claims.get("username")
                    or attributes.get("email", "")
                ),
                "name": attributes.get("name", claims.get("name", "")),
                "email": attributes.get("email", claims.get("email", "")),
                "company_id": int(company_id) if company_id else None,
                "branch_id": int(branch_id) if branch_id else None,
                "fname": fname if fname else None,
                "groups": groups,
                "role": "ADMIN" if is_admin else "UNASSIGNED"
            })

        except cognito.exceptions.UserNotFoundException:
            return response(404, {
                "message": "Cognito user not found"
            })

        except (ValueError, KeyError) as exc:
            return response(400, {
                "message": str(exc)
            })

        except Exception:
            return response(500, {
                "message": "Unable to retrieve Cognito user attributes"
            })

    if path == "/api/admin/health" and method == "GET":

        if not is_admin:
            return response(403, {
                "message": "ADMIN role required"
            })

        return response(200, {
            "status": "AUTHORIZED",
            "role": "ADMIN"
        })

    return response(404, {
        "message": "Not found",
        "path": path
    })
