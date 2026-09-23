from fastapi import FastAPI

from routes.router import router as api_router
from middlewares.cors_middleware import configure_cors
from middlewares.auth_middleware import configure_auth
from middlewares.upload_middleware import configure_uploads
from handlers.http_exeception import configure_http_exeception_handler
from handlers.validation_execption import configure_validation_exeception_handler

app = FastAPI()
configure_cors(app)
configure_uploads(app)
configure_auth(app)

app.include_router(api_router)

configure_http_exeception_handler(app)
configure_validation_exeception_handler(app)