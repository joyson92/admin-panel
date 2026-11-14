import json
import os
import re
from datetime import date, datetime
from decimal import Decimal

import boto3
import pymysql
from pymysql.cursors import DictCursor

_secrets = boto3.client('secretsmanager')
_secret_cache = None


def response(status, payload):
    return {'statusCode': status, 'headers': {'content-type': 'application/json', 'cache-control': 'no-store'}, 'body': json.dumps(payload, default=json_default)}


def json_default(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    raise TypeError(f'Unsupported type: {type(value).__name__}')


def db_config():
    global _secret_cache
    if _secret_cache is None:
        secret = _secrets.get_secret_value(SecretId=os.environ['STAFF_DB_SECRET_ARN'])
        _secret_cache = json.loads(secret['SecretString'])
    return _secret_cache


def connect():
    cfg = db_config()
    return pymysql.connect(
        host=cfg['host'], port=int(cfg.get('port', 3306)),
        user=cfg['username'], password=cfg['password'],
        database=cfg['database'], connect_timeout=5,
        read_timeout=10, write_timeout=10, cursorclass=DictCursor,
        autocommit=False, ssl={} if cfg.get('ssl', False) else None
    )


def claims(event):
    return event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})


def is_admin(event):
    raw = claims(event).get('cognito:groups', [])
    if isinstance(raw, str):
        # Cognito JWT normally contains a JSON array string in HTTP API claims.
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            raw = re.split(r'[,\s]+', raw.strip('[] '))
    if not isinstance(raw, list):
        raw = []
    return any(str(group).strip().strip("'\"[] ").upper() == 'ADMIN' for group in raw)


def tenant_company_id(event):
    # This claim is injected by Cognito Pre Token Generation V2 and validated
    # by API Gateway's JWT authorizer. Never accept tenant IDs from payloads.
    raw = claims(event).get('company_id')
    try:
        value = int(raw)
        if value < 1:
            raise ValueError
        return value
    except (TypeError, ValueError):
        raise PermissionError('Authenticated user has no valid company_id claim')
    

def parse_body(event):
    try:
        return json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        raise ValueError('Request body must be valid JSON')


def handler(event, context):
    if not is_admin(event):
        return response(403, {'message': 'ADMIN role required'})

    method = event.get('requestContext', {}).get('http', {}).get('method', 'GET').upper()
    path_params = event.get('pathParameters') or {}
    staff_id = path_params.get('id')
    try:
        company_id = tenant_company_id(event)
    except PermissionError as exc:
        return response(403, {'message': str(exc)})

    try:
        with connect() as conn:
            with conn.cursor() as cur:
                if method == 'GET' and not staff_id:
                    cur.execute(
                        'SELECT id, name, email, face_id, created_at, updated_at, active, external_id, company_id '
                        'FROM ta_users WHERE company_id=%s AND active=0 ORDER BY id DESC',
                        (company_id,)
                    )
                    return response(200, {'items': cur.fetchall()})

                if method == 'GET' and staff_id:
                    cur.execute('SELECT id, name, email, face_id, created_at, updated_at, active, external_id, company_id FROM ta_users WHERE id=%s AND company_id=%s', (staff_id, company_id))
                    row = cur.fetchone()
                    return response(200, row) if row else response(404, {'message': 'Staff member not found'})

                if method == 'POST':
                    data = parse_body(event)
                    name = str(data.get('name', '')).strip()
                    email = str(data.get('email', '')).strip().lower()
                    if not name or not email:
                        return response(400, {'message': 'name and email are required'})
                    cur.execute(
                        'INSERT INTO ta_users (name, email, face_id, active, external_id, company_id) VALUES (%s,%s,%s,1,%s,%s)',
                        (name, email, data.get('face_id') or None, data.get('external_id') or None, company_id)
                    )
                    new_id = cur.lastrowid
                    conn.commit()
                    cur.execute('SELECT id, name, email, face_id, created_at, updated_at, active, external_id, company_id FROM ta_users WHERE id=%s', (new_id,))
                    return response(201, cur.fetchone())

                if method == 'PUT' and staff_id:
                    data = parse_body(event)
                    allowed = {'name', 'email', 'face_id', 'external_id', 'active'}
                    fields = [(key, data[key]) for key in allowed if key in data]
                    if not fields:
                        return response(400, {'message': 'No editable fields supplied'})
                    if 'name' in data and not str(data['name']).strip():
                        return response(400, {'message': 'name cannot be empty'})
                    if 'email' in data and not str(data['email']).strip():
                        return response(400, {'message': 'email cannot be empty'})
                    assignments = ', '.join(f'{key}=%s' for key, _ in fields)
                    values = [value for _, value in fields]
                    values.extend([staff_id, company_id])
                    cur.execute(f'UPDATE ta_users SET {assignments}, updated_at=CURRENT_TIMESTAMP WHERE id=%s AND company_id=%s', values)
                    if cur.rowcount == 0:
                        conn.rollback()
                        cur.execute('SELECT id FROM ta_users WHERE id=%s AND company_id=%s', (staff_id, company_id))
                        return response(404, {'message': 'Staff member not found'}) if not cur.fetchone() else response(200, {'message': 'No changes detected'})
                    conn.commit()
                    cur.execute('SELECT id, name, email, face_id, created_at, updated_at, active, external_id, company_id FROM ta_users WHERE id=%s AND company_id=%s', (staff_id, company_id))
                    return response(200, cur.fetchone())

                if method == 'DELETE' and staff_id:
                    cur.execute('UPDATE ta_users SET active=1, updated_at=CURRENT_TIMESTAMP WHERE id=%s AND company_id=%s AND active=0', (staff_id, company_id))
                    conn.commit()
                    if cur.rowcount == 0:
                        return response(404, {'message': 'Active staff member not found'})
                    return response(200, {'message': 'Staff member deactivated', 'id': int(staff_id)})

                return response(405, {'message': 'Method not allowed'})
    except ValueError as exc:
        return response(400, {'message': str(exc)})
    except Exception:
        print('Staff API request failed', {'method': method, 'staff_id': staff_id})
        return response(500, {'message': 'Unable to process staff request'})
