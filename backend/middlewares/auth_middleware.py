from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from database.models import SessionLocal, Usuario
from utils.security import SESSION_COOKIE_NAME, hash_token


PUBLIC_PATHS = {"/", "/user/login", "/user/setup", "/user/any", "/docs", "/openapi.json", "/redoc"}


def configure_auth(app: FastAPI) -> None:
    @app.middleware("http")
    async def session_auth_middleware(request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        if request.url.path in PUBLIC_PATHS or request.url.path.startswith("/openapi") or request.url.path.startswith("/redoc"):
            return await call_next(request)

        token = request.cookies.get(SESSION_COOKIE_NAME)
        if not token:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Sessão inválida ou ausente."},
            )

        db = SessionLocal()
        try:
            user = db.query(Usuario).filter(Usuario.token_hash == hash_token(token)).first()
            if not user:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Sessão inválida ou expirou."},
                )
            request.state.user = user
            return await call_next(request)
        finally:
            db.close()