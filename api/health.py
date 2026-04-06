"""
api/health.py
Vercel Serverless Function — diagnóstico SMTP.
Visita: https://tu-dominio.vercel.app/api/health
"""

import os
import json
import smtplib
import traceback
from http.server import BaseHTTPRequestHandler

EMAIL_SENDER   = os.environ.get("EMAIL_SENDER", "")
EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD", "")
EMAIL_RECEIVER = os.environ.get("EMAIL_RECEIVER", "")
SMTP_HOST      = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT      = int(os.environ.get("SMTP_PORT", "587"))


class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        result = {"status": "ok", "steps": {}}

        # 1. Credenciales
        try:
            pw = EMAIL_PASSWORD or ""
            result["steps"]["1_credentials"] = {
                "ok": True,
                "EMAIL_SENDER":   str(EMAIL_SENDER),
                "EMAIL_RECEIVER": str(EMAIL_RECEIVER),
                "SMTP_HOST":      str(SMTP_HOST),
                "SMTP_PORT":      SMTP_PORT,
                "EMAIL_PASSWORD": ("*" * max(0, len(pw) - 4)) + pw[-4:] if pw else "NOT SET",
            }
        except Exception as e:
            result["steps"]["1_credentials"] = {"ok": False, "error": str(e)}
            result["status"] = "error"
            self._respond(500, result)
            return

        # 2. Conexión SMTP
        try:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
                s.ehlo()
                s.starttls()
                result["steps"]["2_smtp_connect"] = {"ok": True}
        except Exception as e:
            result["steps"]["2_smtp_connect"] = {"ok": False, "error": str(e), "traceback": traceback.format_exc()}
            result["status"] = "error"
            self._respond(500, result)
            return

        # 3. Login SMTP
        try:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
                s.ehlo()
                s.starttls()
                s.login(EMAIL_SENDER, EMAIL_PASSWORD)
                result["steps"]["3_smtp_login"] = {"ok": True}
        except Exception as e:
            result["steps"]["3_smtp_login"] = {"ok": False, "error": str(e), "traceback": traceback.format_exc()}
            result["status"] = "error"
            self._respond(500, result)
            return

        # 4. Envío real
        try:
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "✅ Vercel SMTP test — funcionando"
            msg["From"]    = EMAIL_SENDER
            msg["To"]      = EMAIL_RECEIVER
            msg.attach(MIMEText("<h2>Test OK</h2><p>Vercel puede enviar emails via SMTP.</p>", "html", "utf-8"))
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
                s.ehlo()
                s.starttls()
                s.login(EMAIL_SENDER, EMAIL_PASSWORD)
                s.sendmail(EMAIL_SENDER, EMAIL_RECEIVER, msg.as_string())
            result["steps"]["4_send_email"] = {"ok": True, "sent_to": EMAIL_RECEIVER}
        except Exception as e:
            result["steps"]["4_send_email"] = {"ok": False, "error": str(e), "traceback": traceback.format_exc()}
            result["status"] = "error"
            self._respond(500, result)
            return

        self._respond(200, result)

    def _respond(self, status, payload):
        body = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass
