"""
Авторизация казино: регистрация, вход, получение профиля, обновление баланса и удачи.
Действие передаётся в поле action тела запроса.
"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = "t_p89119388_casino_simulator_pro"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def make_token() -> str:
    return secrets.token_hex(32)

def ok(data: dict, status: int = 200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data)}

def err(msg: str, status: int = 400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def user_row_to_dict(row):
    return {"id": row[0], "username": row[1], "balance": row[2], "luck_multiplier": float(row[3])}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    params = event.get("queryStringParameters") or {}
    action = body.get("action") or params.get("action") or ""

    # Регистрация
    if action == "register":
        username = (body.get("username") or "").strip()
        password = body.get("password") or ""
        if not username or len(username) < 3:
            return err("Логин должен быть не менее 3 символов")
        if not password or len(password) < 4:
            return err("Пароль должен быть не менее 4 символов")
        pw_hash = hash_password(password)
        token = make_token()
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE username = '{username}'")
        if cur.fetchone():
            conn.close()
            return err("Логин уже занят")
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (username, password_hash) VALUES ('{username}', '{pw_hash}') RETURNING id, balance, luck_multiplier"
        )
        row = cur.fetchone()
        user_id, balance, luck = row
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES ({user_id}, '{token}')")
        conn.commit()
        conn.close()
        return ok({"token": token, "user": {"id": user_id, "username": username, "balance": balance, "luck_multiplier": float(luck)}}, 201)

    # Вход
    if action == "login":
        username = (body.get("username") or "").strip()
        password = body.get("password") or ""
        pw_hash = hash_password(password)
        token = make_token()
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id, balance, luck_multiplier FROM {SCHEMA}.users WHERE username = '{username}' AND password_hash = '{pw_hash}'")
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Неверный логин или пароль", 401)
        user_id, balance, luck = row
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES ({user_id}, '{token}')")
        conn.commit()
        conn.close()
        return ok({"token": token, "user": {"id": user_id, "username": username, "balance": balance, "luck_multiplier": float(luck)}})

    # Проверить токен / получить профиль
    if action == "me":
        token = body.get("token") or params.get("token") or ""
        if not token:
            return err("Не авторизован", 401)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT u.id, u.username, u.balance, u.luck_multiplier FROM {SCHEMA}.users u "
            f"JOIN {SCHEMA}.sessions s ON s.user_id = u.id "
            f"WHERE s.token = '{token}'"
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return err("Не авторизован", 401)
        return ok({"user": user_row_to_dict(row)})

    # Сохранить баланс (и сбросить удачу после спина)
    if action == "update_balance":
        token = body.get("token") or ""
        new_balance = body.get("balance")
        reset_luck = body.get("reset_luck", False)
        if not token:
            return err("Не авторизован", 401)
        if new_balance is None or int(new_balance) < 0:
            return err("Некорректный баланс")
        luck_sql = ", luck_multiplier = 1.0" if reset_luck else ""
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.users SET balance = {int(new_balance)}{luck_sql} "
            f"WHERE id = (SELECT user_id FROM {SCHEMA}.sessions WHERE token = '{token}' LIMIT 1) "
            f"RETURNING id, username, balance, luck_multiplier"
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        if not row:
            return err("Не авторизован", 401)
        return ok({"user": user_row_to_dict(row)})

    return err("Неизвестное действие", 400)
