from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
import os
import socket
from pydantic import EmailStr
from typing import List

def get_host_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "your_email@gmail.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "your_app_password").replace(" ", ""),
    MAIL_FROM=os.getenv("MAIL_FROM", "your_email@gmail.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "Nibiaa Manager"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_email(email: List[EmailStr], subject: str, body: str):
    message = MessageSchema(
        subject=subject,
        recipients=email,
        body=body,
        subtype=MessageType.html
    )
    fm = FastMail(conf)
    await fm.send_message(message)

async def send_activation_email(email: str, token: str):
    # frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8090")
    host_ip = get_host_ip()
    frontend_url = f"http://{host_ip}:8090"
    
    activation_link = f"{frontend_url}/activate?token={token}"
    body = f"""
    <h1>Welcome to Nibiaa Manager</h1>
    <p>You have been invited to join Nibiaa Manager.</p>
    <p>Please click the link below to activate your account and set your password:</p>
    <a href="{activation_link}">Activate Account</a>
    <p>If you did not request this, please ignore this email.</p>
    """
    await send_email([email], "Activate your Nibiaa Manager Account", body)

async def send_reset_password_email(email: str, token: str):
    # frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8090")
    host_ip = get_host_ip()
    frontend_url = f"http://{host_ip}:8090"
    
    reset_link = f"{frontend_url}/reset-password?token={token}"
    body = f"""
    <h1>Password Reset Request</h1>
    <p>We received a request to reset your password.</p>
    <p>Click the link below to reset it:</p>
    <a href="{reset_link}">Reset Password</a>
    <p>If you did not request this, please ignore this email.</p>
    """
    await send_email([email], "Reset Your Password", body)
