from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from auth.auth import decode_access_token

security = HTTPBearer()


def require_auth(
	credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
	token = credentials.credentials
	payload = decode_access_token(token)
	if not payload:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Invalid or expired token",
		)
	return payload
