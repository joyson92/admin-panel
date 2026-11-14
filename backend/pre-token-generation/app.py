"""Cognito Pre Token Generation V2: inject trusted tenant claims."""


def handler(event, context):
    attributes = event.get("request", {}).get("userAttributes", {})

    company_id = attributes.get("custom:company_id")
    if not company_id:
        # Fail closed: users without tenant assignment must not receive API tokens.
        raise ValueError("Cognito user is missing custom:company_id")

    try:
        company_id = int(company_id)
        if company_id < 1:
            raise ValueError
    except (TypeError, ValueError):
        raise ValueError("Cognito custom:company_id must be a positive integer")

    claims = {"company_id": company_id}

    branch_id = attributes.get("custom:branch_id")
    if branch_id not in (None, ""):
        try:
            branch_id = int(branch_id)
            if branch_id < 1:
                raise ValueError
        except (TypeError, ValueError):
            raise ValueError("Cognito custom:branch_id must be a positive integer")
        claims["branch_id"] = branch_id

    display_name = attributes.get("name") or attributes.get("custom:name")
    if display_name:
        claims["name"] = display_name

    response = event.setdefault("response", {})
    response["claimsAndScopeOverrideDetails"] = {
        "idTokenGeneration": {
            "claimsToAddOrOverride": claims
        },
        "accessTokenGeneration": {
            "claimsToAddOrOverride": claims
        }
    }
    return event
