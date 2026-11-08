import json
from typing import Any

def response(status: int, payload: dict[str, Any]) -> dict[str, Any]:
    return {"statusCode": status, "headers": {"content-type": "application/json", "cache-control": "no-store"}, "body": json.dumps(payload)}

def get_claims(event: dict[str, Any]) -> dict[str, Any]:
    return event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})

def get_groups(claims: dict[str, Any]) -> list[str]:
    raw = claims.get("cognito:groups", [])
    if isinstance(raw, list): values = raw
    elif isinstance(raw, str):
        try:
            value = json.loads(raw)
            if isinstance(value, list):
                values = value
            else:
                values = [value]
        except json.JSONDecodeError:
            values = raw.strip("[]").split(",")
    else:
        values = []
    return [
        str(group).strip().strip("'\"[] ")
        for group in values
        if str(group).strip().strip("'\"[] ")
    ]

def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    request = event.get("requestContext", {}).get("http", {})
    method = request.get("method", "GET")
    path = event.get("rawPath") or event.get("path") or ""
    if method == "OPTIONS": return {"statusCode": 204, "headers": {}, "body": ""}
    claims = get_claims(event)
    if not claims: return response(401, {"message": "Unauthorized"})
    groups = get_groups(claims)
    is_admin = any(g.upper() == "ADMIN" for g in groups)
    if path == "/api/health" and method == "GET": return response(200, {"status": "UP", "service": "ta-api"})
    if path == "/api/me" and method == "GET":
        subject = claims.get("sub", "")
        return response(200, {"id": subject, "username": claims.get("username") or subject, "email": claims.get("email", ""), "groups": groups, "role": "ADMIN" if is_admin else "UNASSIGNED"})
    if path == "/api/admin/health" and method == "GET":
        if not is_admin: return response(403, {"message": "ADMIN role required"})
        return response(200, {"status": "AUTHORIZED", "role": "ADMIN"})
    return response(404, {"message": "Not found", "path": path})
