"""Password hashing and JWT helpers.

NOTE: This environment lacks the bcrypt backend (passlib installs but
``bcrypt`` native wheel is missing), so we fall back to a salted sha256
scheme. The fallback is detected at import time. The hash format is
prefixed with ``sha256$`` so stored hashes can be verified regardless of
which backend produced them. Bcrypt hashes (``$2b$`` prefix) would still
verify correctly if bcrypt becomes available later.
"""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional

from jose import jwt, JWTError

from app.core.config import settings

# Detect bcrypt availability. passlib imports fine, but the bcrypt backend
# is missing in this environment, so we probe it once.
_BCRYPT_AVAILABLE = False
try:
    from passlib.context import CryptContext

    _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    # Probe by hashing a short string; if backend missing, fall back.
    _pwd_context.hash("probe")
    _BCRYPT_AVAILABLE = True
except Exception:  # pragma: no cover - environment dependent
    _BCRYPT_AVAILABLE = False


def _hash_sha256(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return f"sha256${salt}${digest}"


def _verify_sha256(password: str, hashed: str) -> bool:
    try:
        _, salt, digest = hashed.split("$", 2)
    except ValueError:
        return False
    computed = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return secrets.compare_digest(computed, digest)


def hash_password(password: str) -> str:
    if _BCRYPT_AVAILABLE:
        return _pwd_context.hash(password)
    return _hash_sha256(password)


def verify_password(plain: str, hashed: str) -> bool:
    # Support both bcrypt ($2b$...) and our sha256$salt$digest fallback.
    if hashed.startswith("$2"):
        if _BCRYPT_AVAILABLE:
            return _pwd_context.verify(plain, hashed)
        return False
    if hashed.startswith("sha256$"):
        return _verify_sha256(plain, hashed)
    return False


def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    expire = datetime.utcnow() + timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload.get("sub")
    except JWTError:
        return None
