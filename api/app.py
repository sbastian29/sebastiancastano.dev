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
import smtplib
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS


# ── Cargar credenciales ───────────────────────────────────────────────────────
# Prioridad:
#   1. Variables de entorno (producción en Render)
#   2. config/credentials.py (solo desarrollo local — NUNCA se sube a Git)

def _load_credentials():
    sender   = os.environ.get("EMAIL_SENDER")
    password = os.environ.get("EMAIL_PASSWORD")
    receiver = os.environ.get("EMAIL_RECEIVER")
    host     = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    port     = int(os.environ.get("SMTP_PORT", "587"))

    if not all([sender, password, receiver]):
        # Fallback local: intenta importar credentials.py
        try:
            from config.credentials import (
                EMAIL_SENDER as s, EMAIL_PASSWORD as p,
                EMAIL_RECEIVER as r, SMTP_HOST as h, SMTP_PORT as po,
            )
            return s, p, r, h, int(po)
        except ImportError:
            raise RuntimeError(
                "No se encontraron credenciales.\n"
                "  - En local: crea api/config/credentials.py\n"
                "  - En Render: configura las variables de entorno en el dashboard"
            )

    return sender, password, receiver, host, port


EMAIL_SENDER, EMAIL_PASSWORD, EMAIL_RECEIVER, SMTP_HOST, SMTP_PORT = _load_credentials()


# ── App ───────────────────────────────────────────────────────────────────────

app = Flask(__name__)

CORS(app, origins=[
    "https://sebastiancastano.dev",
    "https://www.sebastiancastano.dev",
    "https://sebastiancastanodev.vercel.app/",
    "https://sebastiancastano.vercel.app",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8080",
])


# ── Helpers ───────────────────────────────────────────────────────────────────

def is_valid_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))


def build_email_to_sebastian(data: dict) -> MIMEMultipart:
    nombre  = data["nombre"]
    email   = data["email"]
    empresa = data.get("empresa") or "—"
    mensaje = data["mensaje"]
    fecha   = datetime.now().strftime("%d/%m/%Y %H:%M")

    msg = MIMEMultipart("alternative")
    msg["Subject"]  = f"📩 Nueva solicitud de contacto — {nombre}"
    msg["From"]     = EMAIL_SENDER
    msg["To"]       = EMAIL_RECEIVER
    msg["Reply-To"] = email

    html = f"""
    <html><body style="font-family:Inter,Arial,sans-serif;background:#f8fafb;padding:0;margin:0;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;
                  box-shadow:0 4px 24px rgba(26,30,46,.10);overflow:hidden;">
        <div style="background:#1a1e2e;padding:32px 40px;">
          <h1 style="color:#fff;margin:0;font-size:1.4rem;font-weight:600;">
            Nueva solicitud de contacto
          </h1>
          <p style="color:#9aa0b8;margin:8px 0 0;font-size:.9rem;">{fecha}</p>
        </div>
        <div style="padding:40px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #f0f4f7;color:#8a9ab0;
                         font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;width:120px;">Nombre</td>
              <td style="padding:12px 0;border-bottom:1px solid #f0f4f7;color:#1a1e2e;font-weight:500;">{nombre}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #f0f4f7;color:#8a9ab0;
                         font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;">Email</td>
              <td style="padding:12px 0;border-bottom:1px solid #f0f4f7;">
                <a href="mailto:{email}" style="color:#5B7FA6;text-decoration:none;font-weight:500;">{email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #f0f4f7;color:#8a9ab0;
                         font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;">Empresa</td>
              <td style="padding:12px 0;border-bottom:1px solid #f0f4f7;color:#1a1e2e;">{empresa}</td>
            </tr>
            <tr>
              <td style="padding:16px 0 0;color:#8a9ab0;font-size:.8rem;text-transform:uppercase;
                         letter-spacing:.06em;vertical-align:top;">Mensaje</td>
              <td style="padding:16px 0 0;color:#1a1e2e;line-height:1.7;">
                {mensaje.replace(chr(10), "<br>")}
              </td>
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
          <p style="margin:0;color:#c0ccd8;font-size:.8rem;">
            Generado automáticamente desde sebastiancastano.dev
          </p>
        </div>
      </div>
    </body></html>
    """
    msg.attach(MIMEText(html, "html", "utf-8"))
    return msg


def build_email_to_sender(data: dict) -> MIMEMultipart:
    nombre       = data.get("nombre", "")
    email        = data["email"]
    mensaje_html = data["mensaje"].replace("\n", "<br>")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "He recibido tu mensaje — Sebastián Castaño"
    msg["From"]    = f"Sebastián Castaño <{EMAIL_SENDER}>"
    msg["To"]      = email

    html = f"""
    <!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#fafafa;font-family:'Inter',-apple-system,sans-serif;">
      <div style="background:#fafafa;padding:50px 10px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
               style="max-width:600px;background:#fff;border:1px solid rgba(0,0,0,0.06);
                      border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.04);">
          <tr>
            <td style="padding:40px 40px 20px 40px;">
              <span style="font-weight:600;font-size:18px;letter-spacing:-0.02em;color:#1a1a1a;">
                Sebastián Castaño
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;">
              <h1 style="color:#1a1a1a;font-size:32px;font-weight:700;letter-spacing:-0.04em;
                         margin:0 0 20px 0;line-height:1.1;">¡Hola, {nombre}!</h1>
              <p style="color:#4a4a4a;font-size:16px;line-height:1.75;margin:0 0 24px 0;">
                Gracias por contactar conmigo. He recibido tu mensaje y me pondré
                en contacto contigo en las próximas
                <strong style="color:#1a1a1a;">24-48 horas</strong>.
              </p>
              <div style="background:#f8fafb;border:1px solid rgba(0,0,0,0.05);
                          border-radius:16px;padding:24px;margin-bottom:40px;">
                <p style="margin:0 0 12px 0;font-size:11px;font-weight:600;
                           text-transform:uppercase;letter-spacing:0.08em;color:#b0b0b0;">Tu mensaje:</p>
                <p style="margin:0;color:#4a4a4a;font-size:15px;line-height:1.6;font-style:italic;">
                  &ldquo;{mensaje_html}&rdquo;
                </p>
              </div>
              <a href="https://sebastiancastano.dev/portfolio.html"
                 style="background:#1a1a1a;color:#fff;padding:14px 28px;text-decoration:none;
                        border-radius:999px;font-weight:500;font-size:14px;display:inline-block;">
                Ver mis proyectos recientes
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;background:#fafafa;border-top:1px solid rgba(0,0,0,0.06);">
              <p style="margin:0;color:#1a1a1a;font-weight:600;font-size:14px;">Sebastián Castaño Suárez</p>
              <p style="margin:4px 0 16px 0;color:#8a8a8a;font-size:13px;">Data Engineer &amp; AI Developer · Madrid</p>
              <a href="https://www.linkedin.com/in/sebastiancastano"
                 style="color:#3b82f6;text-decoration:none;font-size:13px;font-weight:500;margin-right:16px;">LinkedIn</a>
              <a href="https://github.com/sbastian29"
                 style="color:#8b5cf6;text-decoration:none;font-size:13px;font-weight:500;">GitHub</a>
            </td>
          </tr>
        </table>
        <p style="text-align:center;color:#b0b0b0;font-size:12px;margin-top:24px;">
          Enviado desde sebastiancastano.dev
        </p>
      </div>
    </body></html>
    """
    msg.attach(MIMEText(html, "html", "utf-8"))
    return msg


def send_email(msg: MIMEMultipart) -> None:
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.sendmail(msg["From"], msg["To"], msg.as_string())


# ── Rutas ─────────────────────────────────────────────────────────────────────

@app.route("/api/contact", methods=["POST"])
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
        send_email(build_email_to_sebastian(payload))
        send_email(build_email_to_sender(payload))
    except Exception as e:
        app.logger.error(f"Error sending email: {e}")
        return jsonify({
            "ok": False,
            "error": "No se pudo enviar el email. Inténtalo de nuevo más tarde."
        }), 500

    return jsonify({"ok": True, "message": "Mensaje enviado correctamente."}), 200


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)