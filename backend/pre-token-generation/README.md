# Cognito Pre Token Generation Lambda

Cognito invokes this function before issuing tokens. It requires `custom:company_id` on every user and adds `company_id` to both ID and access tokens. It adds `branch_id` when assigned and includes the user's display name when available.

The User Pool must use Pre Token Generation event version `V2_0` (access-token customization). The SAM template configures this through `LambdaConfig.PreTokenGenerationConfig`.
