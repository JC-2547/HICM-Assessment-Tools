import base64
import hashlib
import hmac
import json
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any


SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


def _base64url_encode(data: bytes) -> str:
	return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data: str) -> bytes:
	padding = "=" * (-len(data) % 4)
	return base64.urlsafe_b64decode(data + padding)


def hash_password(password: str) -> str:
	salt = secrets.token_bytes(16)
	dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
	return f"{_base64url_encode(salt)}.{_base64url_encode(dk)}"


def verify_password(password: str, hashed: str) -> bool:
	try:
		hashed = hashed.strip()
		salt_b64, hash_b64 = hashed.split(".", 1)
		hash_b64 = hash_b64.lstrip("$")
		salt = _base64url_decode(salt_b64)
		expected = _base64url_decode(hash_b64)
		dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
		if hmac.compare_digest(dk, expected):
			return True

		return hmac.compare_digest(_base64url_encode(dk), hash_b64)
	except Exception:
		return False


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
	header = {"alg": "HS256", "typ": "JWT"}
	expire = datetime.now(tz=timezone.utc) + (
		expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
	)
	payload = {**data, "exp": int(expire.timestamp())}

	header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
	payload_b64 = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
	signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
	signature = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
	signature_b64 = _base64url_encode(signature)

	return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> dict[str, Any] | None:
	try:
		header_b64, payload_b64, signature_b64 = token.split(".", 2)
		signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
		expected_sig = hmac.new(
			SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256
		).digest()
		if not hmac.compare_digest(_base64url_encode(expected_sig), signature_b64):
			return None

		payload = json.loads(_base64url_decode(payload_b64).decode("utf-8"))
		exp = payload.get("exp")
		if exp is not None and datetime.now(tz=timezone.utc).timestamp() > exp:
			return None
		return payload
	except Exception:
		return None
