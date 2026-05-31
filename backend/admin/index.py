"""
Админ-панель казино: управление балансом, удачей и правами игроков.
Lavrov1yList — суперадмин (может выдавать/забирать права).
Обычные админы (is_admin=true) — управляют фишками и удачей, но не правами.
"""
import json
import os
import psycopg2

SCHEMA = "t_p89119388_casino_simulator_pro"
SUPER_ADMIN = "Lavrov1yList"

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

def u_to_dict(r):
    return {"id": r[0], "username": r[1], "balance": r[2], "luck_multiplier": float(r[3]), "is_admin": bool(r[4])}

def get_caller(cur, token: str):
    """Возвращает (user_id, username, is_super_admin) или None если нет доступа."""
    cur.execute(
        f"SELECT u.id, u.username, u.is_admin FROM {SCHEMA}.users u "
        f"JOIN {SCHEMA}.sessions s ON s.user_id = u.id "
        f"WHERE s.token = '{token}'"
    )
    row = cur.fetchone()
    if not row:
        return None
    user_id, username, is_admin = row
    is_super = username == SUPER_ADMIN
    if not is_super and not is_admin:
        return None
    return (user_id, username, is_super)

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
    caller = get_caller(cur, token)
    if not caller:
        conn.close()
        return err("Доступ запрещён", 403)

    caller_id, caller_name, is_super = caller

    # Получить список всех игроков
    if action == "list_users":
        cur.execute(
            f"SELECT id, username, balance, luck_multiplier, is_admin FROM {SCHEMA}.users ORDER BY username"
        )
        rows = cur.fetchall()
        conn.close()
        return ok({"users": [u_to_dict(r) for r in rows], "is_super": is_super})

    # Выдать или забрать фишки
    if action == "set_balance":
        target_username = (body.get("username") or "").strip()
        amount = body.get("amount")
        mode = body.get("mode") or "set"
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
            f"RETURNING id, username, balance, luck_multiplier, is_admin"
        )
        updated = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({"user": u_to_dict(updated)})

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
            f"RETURNING id, username, balance, luck_multiplier, is_admin"
        )
        updated = cur.fetchone()
        conn.commit()
        conn.close()
        if not updated:
            return err("Пользователь не найден")
        return ok({"user": u_to_dict(updated)})

    # Выдать или забрать права админа — только суперадмин
    if action == "set_admin":
        if not is_super:
            conn.close()
            return err("Только суперадмин может управлять правами", 403)
        target_username = (body.get("username") or "").strip()
        grant = bool(body.get("grant", False))
        if not target_username:
            conn.close()
            return err("Укажите username")
        if target_username == SUPER_ADMIN:
            conn.close()
            return err("Нельзя изменить права суперадмина")
        cur.execute(
            f"UPDATE {SCHEMA}.users SET is_admin = {grant} WHERE username = '{target_username}' "
            f"RETURNING id, username, balance, luck_multiplier, is_admin"
        )
        updated = cur.fetchone()
        conn.commit()
        conn.close()
        if not updated:
            return err("Пользователь не найден")
        return ok({"user": u_to_dict(updated)})

    conn.close()
    return err("Неизвестное действие", 400)
