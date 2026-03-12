from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


def _normalize_for_bcrypt(password: str) -> str:
    """
    bcrypt only supports up to 72 bytes.
    Truncate at byte-level so hash/verify remain consistent for long inputs.
    """
    password_bytes = password.encode('utf-8')
    safe_bytes = password_bytes[:72]
    return safe_bytes.decode('utf-8', errors='ignore')


def hash_password(password: str) -> str:
    return pwd_context.hash(_normalize_for_bcrypt(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(_normalize_for_bcrypt(plain_password), hashed_password)
