from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")
def configure_validation_exeception_handler(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):

        logger.error("[ERRO 422 - VALIDAÇÃO PYDANTIC]")
        logger.error(f"Rota: {request.method} {request.url.path}")
        logger.error(f"Body recebido: {exc.body}")
        logger.error(f"Detalhes da falha: {exc.errors()}")


        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": exc.errors(),
                "body_recebido": exc.body
            },
        )