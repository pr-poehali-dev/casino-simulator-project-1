"""
Админ-панель казино: управление балансом и удачей игроков.
Доступно только для пользователя Lavrov1yList.
"""
import json
import os
import psycopg2

SCHEMA = "t_p89119388_casino_simulator_pro"
ADMIN_USERNAME = "Lavrov1yList"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data: dict):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data)}

def err(msg: str, status: int = 400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def get_admin_user_id(cur, token: str):
    cur.execute(
        f"SELECT u.id FROM {SCHEMA}.users u "
        f"JOIN {SCHEMA}.sessions s ON s.user_id = u.id "
        f"WHERE s.token = '{token}' AND u.username = '{ADMIN_USERNAME}'"
    )
    row = cur.fetchone()
    return row[0] if row else None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    token = body.get("token") or ""
    action = body.get("action") or ""

    if not token:
        return err("Не авторизован", 401)

    conn = get_conn()
    cur = conn.cursor()
    admin_id = get_admin_user_id(cur, token)
    if not admin_id:
        conn.close()
        return err("Доступ запрещён", 403)

    # Получить список всех игроков
    if action == "list_users":
        cur.execute(
            f"SELECT id, username, balance, luck_multiplier FROM {SCHEMA}.users ORDER BY username"
        )
        rows = cur.fetchall()
        conn.close()
        users = [{"id": r[0], "username": r[1], "balance": r[2], "luck_multiplier": float(r[3])} for r in rows]
        return ok({"users": users})

    # Выдать или забрать фишки
    if action == "set_balance":
        target_username = (body.get("username") or "").strip()
        amount = body.get("amount")
        mode = body.get("mode") or "set"  # set | add | subtract
        if not target_username or amount is None:
            conn.close()
            return err("Укажите username и amount")
        cur.execute(f"SELECT id, balance FROM {SCHEMA}.users WHERE username = '{target_username}'")
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Пользователь не найден")
        user_id, current_balance = row
        if mode == "add":
            new_balance = current_balance + int(amount)
        elif mode == "subtract":
            new_balance = max(0, current_balance - int(amount))
        else:
            new_balance = int(amount)
        cur.execute(
            f"UPDATE {SCHEMA}.users SET balance = {new_balance} WHERE id = {user_id} "
            f"RETURNING id, username, balance, luck_multiplier"
        )
        updated = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({"user": {"id": updated[0], "username": updated[1], "balance": updated[2], "luck_multiplier": float(updated[3])}})

    # Выдать удачу (или антиудачу)
    if action == "set_luck":
        target_username = (body.get("username") or "").strip()
        multiplier = body.get("multiplier")
        if not target_username or multiplier is None:
            conn.close()
            return err("Укажите username и multiplier")
        luck_val = float(multiplier)
        if luck_val <= 0:
            conn.close()
            return err("Множитель должен быть больше 0")
        cur.execute(
            f"UPDATE {SCHEMA}.users SET luck_multiplier = {luck_val} WHERE username = '{target_username}' "
            f"RETURNING id, username, balance, luck_multiplier"
        )
        updated = cur.fetchone()
        conn.commit()
        conn.close()
        if not updated:
            return err("Пользователь не найден")
        return ok({"user": {"id": updated[0], "username": updated[1], "balance": updated[2], "luck_multiplier": float(updated[3])}})

    conn.close()
    return err("Неизвестное действие", 400)
