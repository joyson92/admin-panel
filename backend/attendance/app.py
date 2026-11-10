import json, os
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo
from decimal import Decimal
import boto3, pymysql
from pymysql.cursors import DictCursor

_sm = boto3.client("secretsmanager")
_secret = None

s3_client = boto3.client("s3", region_name="us-east-1")

S3_BUCKET = os.environ["ATTENDANCE_IMAGE_BUCKET"]

def _response(status, data):
    def default(v):
        if isinstance(v, (datetime, date)): return v.isoformat()
        if isinstance(v, Decimal): return float(v)
        raise TypeError(type(v).__name__)
    return {"statusCode": status, "headers": {"content-type":"application/json","cache-control":"no-store"}, "body": json.dumps(data, default=default)}

def _admin(event):
    claims = event.get("requestContext",{}).get("authorizer",{}).get("jwt",{}).get("claims",{})
    raw = claims.get("cognito:groups", [])
    if isinstance(raw, str):
        try: raw = json.loads(raw)
        except json.JSONDecodeError: raw = raw.strip("[] ").replace('"',"").replace("'","").split(",")
    return isinstance(raw, list) and any(str(x).strip().strip(" []'\\\"").upper() == "ADMIN" for x in raw)

def _connect():
    global _secret
    if _secret is None:
        _secret = json.loads(_sm.get_secret_value(SecretId=os.environ["ATTENDANCE_DB_SECRET_ARN"])["SecretString"])
    c = _secret
    return pymysql.connect(host=c["host"],port=int(c.get("port",3306)),user=c["username"],password=c["password"],database=c["database"],connect_timeout=5,read_timeout=15,write_timeout=15,cursorclass=DictCursor,autocommit=True,ssl={} if c.get("ssl",False) else None)

def _date(v, default):
    try: return date.fromisoformat(v) if v else default
    except ValueError: raise ValueError("Invalid date; use YYYY-MM-DD")

def handler(event, context):
    if not _admin(event): return _response(403,{"message":"ADMIN role required"})
    method=event.get("requestContext",{}).get("http",{}).get("method","GET").upper()
    path=event.get("rawPath","")
    q=event.get("queryStringParameters") or {}
    pp=event.get("pathParameters") or {}
    company=int(os.environ.get("ATTENDANCE_COMPANY_ID","1"))
    today=datetime.now(ZoneInfo("Asia/Kolkata")).date()
    try:
        with _connect() as conn:
            with conn.cursor() as cur:
                if method=="GET" and path=="/attendance/today":
                    day=_date(q.get("date"),today)
                    start_utc,end_utc=_ist_day_bounds(day)
                    cur.execute("""SELECT u.id user_id,u.name,u.email, (SELECT a1.id FROM ta_attendance a1 WHERE a1.users_id=u.id AND a1.check_in_time >= %s AND a1.check_in_time < %s ORDER BY a1.check_in_time ASC,a1.id ASC LIMIT 1) AS first_check_in_id, DATE_ADD(MIN(a.check_in_time), INTERVAL 330 MINUTE) first_check_in, CASE WHEN COUNT(a.id) > 1 THEN DATE_ADD(MAX(a.check_in_time), INTERVAL 330 MINUTE) ELSE '-' END AS last_check_in, COUNT(a.id) check_in_count, CASE WHEN COUNT(a.id)>0 THEN 'Present' ELSE 'Absent' END status FROM ta_users u LEFT JOIN ta_attendance a ON a.users_id=u.id AND a.check_in_time >= %s AND a.check_in_time < %s WHERE u.company_id=%s AND u.active=0 GROUP BY u.id,u.name,u.email ORDER BY u.name""",(start_utc,end_utc,start_utc,end_utc,company))
                    return _response(200,{"date":day.isoformat(),"items":cur.fetchall()})

                if method=="POST" and path=="/attendance/admin/punch":
                    data=_parse_body(event)
                    IST = ZoneInfo("Asia/Kolkata")
                    user_id=_positive_int(data.get("user_id"),"user_id")
                    # Parse incoming IST datetime and convert to UTC
                    punch_time = datetime.strptime(
                        data.get("check_in_time"),
                        "%Y-%m-%dT%H:%M"
                    ).replace(tzinfo=IST)

                    # Validate against current IST time
                    if punch_time > datetime.now(IST):
                        return _response(400, {
                            "message": "Future punch-in date and time are not allowed."
                        })
                    # Convert IST to UTC for database storage
                    check_in_utc = punch_time.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)
                    
                    cur.execute("SELECT id FROM ta_users WHERE id=%s AND company_id=%s AND active=0",(user_id,company))
                    if not cur.fetchone():
                        return _response(404,{"message":"Active employee not found"})
                    cur.execute("INSERT INTO ta_attendance (users_id, check_in_time) VALUES (%s,%s)",(user_id,check_in_utc))
                    conn.commit()
                    return _response(201,{"message":"Punch-in added successfully","id":cur.lastrowid})

                if method=="PUT" and path.startswith("/attendance/admin/punch/"):
                    attendance_id=_positive_int(pp.get("id") or path.rsplit("/",1)[-1],"attendance_id")
                    data=_parse_body(event)
                    check_in_utc=_parse_ist_datetime(data.get("check_in_time"))
                    cur.execute("""SELECT a.id FROM ta_attendance a JOIN ta_users u ON u.id=a.users_id WHERE a.id=%s AND u.company_id=%s AND u.active=0""",(attendance_id,company))
                    if not cur.fetchone():
                        return _response(404,{"message":"Attendance punch not found"})
                    cur.execute("UPDATE ta_attendance SET check_in_time=%s WHERE id=%s",(check_in_utc,attendance_id))
                    conn.commit()
                    return _response(200,{"message":"Punch-in updated successfully","id":attendance_id})
                if method=="GET" and path.startswith("/attendance/employees/"):
                    uid=pp.get("id") or path.rsplit("/",1)[-1]
                    start=_date(q.get("start_date"),today.replace(day=1)); end=_date(q.get("end_date"),today)
                    if start>end: return _response(400,{"message":"start_date must be on or before end_date"})
                    start_utc,end_utc=_ist_range_bounds(start,end)
                    cur.execute("""SELECT a.id,a.users_id user_id,u.name,u.email,a.check_in_time,a.source_image,a.confidence,a.location,a.created_at FROM ta_attendance a JOIN ta_users u ON u.id=a.users_id WHERE a.users_id=%s AND u.company_id=%s AND a.check_in_time >= %s AND a.check_in_time < %s ORDER BY a.check_in_time DESC""",(uid,company,start_utc,end_utc))
                    records = cur.fetchall()
                    for record in records:
                        record["source_image"] = generate_image_url(
                            record.get("source_image")
                        )
                    return _response(200,{"user_id":int(uid),"start_date":start.isoformat(),"end_date":end.isoformat(),"items":records})
                if method=="GET" and path=="/attendance/sheet":
                    mv=q.get("month",today.strftime("%Y-%m"))
                    try: first=date.fromisoformat(mv+"-01")
                    except ValueError: return _response(400,{"message":"month must use YYYY-MM format"})
                    nxt=date(first.year+(first.month==12),1 if first.month==12 else first.month+1,1)
                    start_utc,end_utc=_ist_range_bounds(first,nxt-timedelta(days=1))
                    cur.execute("""SELECT u.id user_id,u.name,u.email,DATE(DATE_ADD(a.check_in_time, INTERVAL 330 MINUTE)) attendance_date,COUNT(a.id) check_in_count,DATE_ADD(MIN(a.check_in_time), INTERVAL 330 MINUTE) first_check_in,DATE_ADD(MAX(a.check_in_time), INTERVAL 330 MINUTE) last_check_in FROM ta_users u LEFT JOIN ta_attendance a ON a.users_id=u.id AND a.check_in_time >= %s AND a.check_in_time < %s WHERE u.company_id=%s AND u.active=0 GROUP BY u.id,u.name,u.email,DATE(DATE_ADD(a.check_in_time, INTERVAL 330 MINUTE)) ORDER BY u.name,attendance_date""",(start_utc,end_utc,company))
                    people={}
                    for r in cur.fetchall():
                        p=people.setdefault(r["user_id"],{"user_id":r["user_id"],"name":r["name"],"email":r["email"],"days":{}})
                        if r["attendance_date"]:
                            p["days"][r["attendance_date"].isoformat()]={"status":"Present","check_in_count":r["check_in_count"],"first_check_in":r["first_check_in"],"last_check_in":r["last_check_in"]}
                    return _response(200,{"month":first.strftime("%Y-%m"),"days_in_month":(nxt-first).days,"items":list(people.values())})
                return _response(404,{"message":"Attendance endpoint not found"})
    except ValueError as e: return _response(400,{"message":str(e)})
    except Exception as e:
        print("Attendance API error",str(e))
        return _response(500,{"message":"Unable to process attendance request"})


def _parse_body(event):
    try:
        return json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        raise ValueError("Request body must be valid JSON")


def _positive_int(value, field):
    try:
        result=int(value)
        if result < 1:
            raise ValueError
        return result
    except (TypeError, ValueError):
        raise ValueError(f"{field} must be a positive integer")


def _parse_ist_datetime(value):
    if not value:
        raise ValueError("check_in_time is required")
    try:
        parsed=datetime.fromisoformat(str(value).replace("Z","+00:00"))
    except ValueError:
        raise ValueError("check_in_time must be a valid date and time")
    ist=ZoneInfo("Asia/Kolkata")
    if parsed.tzinfo is None:
        parsed=parsed.replace(tzinfo=ist)
    else:
        parsed=parsed.astimezone(ist)
    now=datetime.now(ist)
    if parsed > now:
        raise ValueError("Punch-in time cannot be in the future")
    return parsed.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)


def _ist_day_bounds(day):
    return _ist_range_bounds(day,day)


def _ist_range_bounds(start_day,end_day):
    ist=ZoneInfo("Asia/Kolkata")
    start=datetime.combine(start_day,time.min,tzinfo=ist)
    end=datetime.combine(end_day+timedelta(days=1),time.min,tzinfo=ist)
    utc=ZoneInfo("UTC")
    return start.astimezone(utc).replace(tzinfo=None),end.astimezone(utc).replace(tzinfo=None)


def generate_image_url(source_img):
    if not source_img:
        return None
    source_img = source_img.replace(S3_BUCKET + '/', '')
    try:
        return s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": source_img
            },
            ExpiresIn=3600
        )
    except Exception as e:
        print(f"Error generating image URL: {str(e)}")
        return None