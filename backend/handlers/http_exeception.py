from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse
import logging
import traceback

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

def configure_http_exeception_handler(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        # Imprime no terminal a rota, o status code e a mensagem que você escreveu em detail=""
        logger.error(
            f"[ERRO TRATADO {exc.status_code}] no path '{request.url.path}': {exc.detail}"
        )

        logger.error(traceback.format_exc())
        
        # Devolve a resposta estruturada para o Frontend
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )