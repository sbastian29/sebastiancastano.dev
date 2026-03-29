"""
api/app.py
Flask API — formulario de contacto del portfolio.

Desarrollo local:
    cd api && pip install -r requirements.txt && python app.py

Producción (Render):
    Las credenciales se leen de variables de entorno del dashboard de Render.
    Start command: gunicorn app:app
"""

import os
import re
import json
import urllib.request
import urllib.error
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


# ── Cargar credenciales ───────────────────────────────────────────────────────
# Prioridad:
#   1. Variables de entorno (producción en Render)
#   2. config/credentials.py (solo desarrollo local — NUNCA se sube a Git)

def _load_credentials():
    resend_key = os.environ.get("RESEND_API_KEY")
    sender     = os.environ.get("EMAIL_SENDER")
    receiver   = os.environ.get("EMAIL_RECEIVER")

    if not all([resend_key, sender, receiver]):
        try:
            from config.credentials import (
                RESEND_API_KEY as k, EMAIL_SENDER as s, EMAIL_RECEIVER as r,
            )
            return k, s, r
        except ImportError:
            raise RuntimeError(
                "No se encontraron credenciales.\n"
                "  - En local: crea api/config/credentials.py\n"
                "  - En Render: configura RESEND_API_KEY, EMAIL_SENDER, EMAIL_RECEIVER"
            )

    return resend_key, sender, receiver


RESEND_API_KEY, EMAIL_SENDER, EMAIL_RECEIVER = _load_credentials()


# ── App ───────────────────────────────────────────────────────────────────────

app = Flask(__name__)

CORS(app, origins=[
    "https://sebastiancastano.dev",
    "https://www.sebastiancastano.dev",
    "https://sebastiancastano.vercel.app",
    "https://sebastiancastanodev.vercel.app",
    "https://sebastiancastano-dev.vercel.app/",
    "https://sebastiancastano-qg0oi0t7b.vercel.app/",  # URL de preview actual en Vercel
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8080",
])

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=[],        # Sin límite global; solo donde se decore
    storage_uri="memory://",  # En producción puedes cambiar a Redis
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def is_valid_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))


def build_email_to_sebastian(data: dict):
    nombre  = data["nombre"]
    email   = data["email"]
    empresa = data.get("empresa") or "—"
    mensaje = data["mensaje"]
    fecha   = datetime.now().strftime("%d/%m/%Y %H:%M")

    subject = f"Nueva solicitud de contacto — {nombre}"
    html = f"""
    <html><body style="font-family:Inter,Arial,sans-serif;background:#f8fafb;padding:0;margin:0;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;
                  box-shadow:0 4px 24px rgba(26,30,46,.10);overflow:hidden;">
        <div style="background:#1a1e2e;padding:32px 40px;">
          <h1 style="color:#fff;margin:0;font-size:1.4rem;font-weight:600;">Nueva solicitud de contacto</h1>
          <p style="color:#9aa0b8;margin:8px 0 0;font-size:.9rem;">{fecha}</p>
        </div>
        <div style="padding:40px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #f0f4f7;color:#8a9ab0;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;width:120px;">Nombre</td>
              <td style="padding:12px 0;border-bottom:1px solid #f0f4f7;color:#1a1e2e;font-weight:500;">{nombre}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #f0f4f7;color:#8a9ab0;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;">Email</td>
              <td style="padding:12px 0;border-bottom:1px solid #f0f4f7;">
                <a href="mailto:{email}" style="color:#5B7FA6;text-decoration:none;font-weight:500;">{email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #f0f4f7;color:#8a9ab0;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;">Empresa</td>
              <td style="padding:12px 0;border-bottom:1px solid #f0f4f7;color:#1a1e2e;">{empresa}</td>
            </tr>
            <tr>
              <td style="padding:16px 0 0;color:#8a9ab0;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;vertical-align:top;">Mensaje</td>
              <td style="padding:16px 0 0;color:#1a1e2e;line-height:1.7;">{mensaje.replace(chr(10), "<br>")}</td>
            </tr>
          </table>
          <div style="margin-top:32px;">
            <a href="mailto:{email}?subject=Re: Tu mensaje en mi portfolio"
               style="display:inline-block;padding:12px 24px;background:#5B7FA6;color:#fff;
                      border-radius:9999px;text-decoration:none;font-size:.875rem;font-weight:500;">
              Responder a {nombre}
            </a>
          </div>
        </div>
        <div style="padding:24px 40px;background:#f8fafb;border-top:1px solid #f0f4f7;">
          <p style="margin:0;color:#c0ccd8;font-size:.8rem;">Generado automáticamente desde sebastiancastano.dev</p>
        </div>
      </div>
    </body></html>
    """
    return subject, html


def build_email_to_sender(data: dict):
    nombre       = data.get("nombre", "")
    mensaje_html = data["mensaje"].replace("\n", "<br>")

    subject = "He recibido tu mensaje — Sebastián Castaño"
    html = f"""
    <!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#fafafa;font-family:'Inter',-apple-system,sans-serif;">
      <div style="background:#fafafa;padding:50px 10px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
               style="max-width:600px;background:#fff;border:1px solid rgba(0,0,0,0.06);
                      border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.04);">
          <tr><td style="padding:40px 40px 20px 40px;">
            <span style="font-weight:600;font-size:18px;letter-spacing:-0.02em;color:#1a1a1a;">Sebastián Castaño</span>
          </td></tr>
          <tr><td style="padding:20px 40px;">
            <h1 style="color:#1a1a1a;font-size:32px;font-weight:700;letter-spacing:-0.04em;margin:0 0 20px 0;line-height:1.1;">¡Hola, {nombre}!</h1>
            <p style="color:#4a4a4a;font-size:16px;line-height:1.75;margin:0 0 24px 0;">
              Gracias por contactar conmigo. He recibido tu mensaje y me pondré en contacto contigo en las próximas
              <strong style="color:#1a1a1a;">24-48 horas</strong>.
            </p>
            <div style="background:#f8fafb;border:1px solid rgba(0,0,0,0.05);border-radius:16px;padding:24px;margin-bottom:40px;">
              <p style="margin:0 0 12px 0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#b0b0b0;">Tu mensaje:</p>
              <p style="margin:0;color:#4a4a4a;font-size:15px;line-height:1.6;font-style:italic;">&ldquo;{mensaje_html}&rdquo;</p>
            </div>
            <a href="https://sebastiancastano.dev/portfolio.html"
               style="background:#1a1a1a;color:#fff;padding:14px 28px;text-decoration:none;border-radius:999px;font-weight:500;font-size:14px;display:inline-block;">
              Ver mis proyectos recientes
            </a>
          </td></tr>
          <tr><td style="padding:40px;background:#fafafa;border-top:1px solid rgba(0,0,0,0.06);">
            <p style="margin:0;color:#1a1a1a;font-weight:600;font-size:14px;">Sebastián Castaño Suárez</p>
            <p style="margin:4px 0 16px 0;color:#8a8a8a;font-size:13px;">Data Engineer &amp; AI Developer · Madrid</p>
            <a href="https://www.linkedin.com/in/sebastiancastano" style="color:#3b82f6;text-decoration:none;font-size:13px;font-weight:500;margin-right:16px;">LinkedIn</a>
            <a href="https://github.com/sbastian29" style="color:#8b5cf6;text-decoration:none;font-size:13px;font-weight:500;">GitHub</a>
          </td></tr>
        </table>
        <p style="text-align:center;color:#b0b0b0;font-size:12px;margin-top:24px;">Enviado desde sebastiancastano.dev</p>
      </div>
    </body></html>
    """
    return subject, html

def send_email_resend(to: str, subject: str, html: str, reply_to: str = None) -> None:
    """Envía email via Resend API (HTTP) — funciona en Render free tier."""
    payload = {
        "from": f"Sebastian Castano <{EMAIL_SENDER}>",
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if reply_to:
        payload["reply_to"] = reply_to

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=data,
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        if resp.status not in (200, 201):
            raise RuntimeError(f"Resend error {resp.status}: {resp.read().decode()}")


# ── Rutas ─────────────────────────────────────────────────────────────────────

@app.route("/api/contact", methods=["POST"])
@limiter.limit("5 per hour")        # Máximo 5 envíos por IP cada hora
@limiter.limit("1 per 30 seconds")  # Y no más de 1 cada 30 segundos
def contact():
    data    = request.get_json(silent=True) or {}
    nombre  = (data.get("nombre")  or "").strip()
    email   = (data.get("email")   or "").strip()
    mensaje = (data.get("mensaje") or "").strip()
    empresa = (data.get("empresa") or "").strip()

    errors = {}
    if not nombre:
        errors["nombre"] = "El nombre es obligatorio."
    if not email:
        errors["email"] = "El email es obligatorio."
    elif not is_valid_email(email):
        errors["email"] = "El email no tiene un formato válido."
    if not mensaje:
        errors["mensaje"] = "El mensaje es obligatorio."
    if len(mensaje) > 2000:
        errors["mensaje"] = "El mensaje no puede superar los 2000 caracteres."

    if errors:
        return jsonify({"ok": False, "errors": errors}), 422

    payload = {"nombre": nombre, "email": email,
               "empresa": empresa, "mensaje": mensaje}

    try:
        subject_seb, html_seb = build_email_to_sebastian(payload)
        send_email_resend(to=EMAIL_RECEIVER, subject=subject_seb, html=html_seb, reply_to=email)

        subject_usr, html_usr = build_email_to_sender(payload)
        send_email_resend(to=email, subject=subject_usr, html=html_usr)
    except Exception as e:
        app.logger.error(f"Error sending email: {e}")
        return jsonify({
            "ok": False,
            "error": "No se pudo enviar el email. Inténtalo de nuevo más tarde."
        }), 500

    return jsonify({"ok": True, "message": "Mensaje enviado correctamente."}), 200


@app.route("/api/health", methods=["GET"])
def health():
    import traceback, urllib.request as ur, urllib.error as ue
    result = {"status": "ok", "steps": {}}

    # 1. Credenciales
    try:
        result["steps"]["1_credentials"] = {
            "ok": True,
            "RESEND_API_KEY": ("*" * max(0, len(RESEND_API_KEY) - 6)) + RESEND_API_KEY[-6:] if RESEND_API_KEY else "NOT SET",
            "EMAIL_SENDER":   str(EMAIL_SENDER),
            "EMAIL_RECEIVER": str(EMAIL_RECEIVER),
        }
    except Exception as e:
        result["steps"]["1_credentials"] = {"ok": False, "error": str(e)}
        result["status"] = "error"
        return jsonify(result), 500

    # 2. Resend API accesible
    try:
        req = ur.Request("https://api.resend.com/emails",
            data=b'{}',
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            method="POST")
        try:
            ur.urlopen(req, timeout=10)
        except ue.HTTPError as he:
            # 422 = Resend rechaza payload vacio pero la conexion funciona
            if he.code in (400, 422):
                result["steps"]["2_resend_reachable"] = {"ok": True, "http_status": he.code}
            else:
                raise
    except Exception as e:
        result["steps"]["2_resend_reachable"] = {"ok": False, "error": str(e), "traceback": traceback.format_exc()}
        result["status"] = "error"
        return jsonify(result), 500

    # 3. Envio real
    try:
        send_email_resend(
            to=EMAIL_RECEIVER,
            subject="Health check — API funcionando",
            html="<h2>OK</h2><p>El health check ha enviado este email correctamente.</p>",
        )
        result["steps"]["3_send_email"] = {"ok": True, "sent_to": EMAIL_RECEIVER}
    except Exception as e:
        result["steps"]["3_send_email"] = {"ok": False, "error": str(e), "traceback": traceback.format_exc()}
        result["status"] = "error"
        return jsonify(result), 500

    return jsonify(result), 200


@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        "ok": False,
        "error": "Demasiadas solicitudes. Por favor, espera un momento antes de intentarlo de nuevo."
    }), 429


if __name__ == "__main__":
    app.run(debug=True, port=5000)