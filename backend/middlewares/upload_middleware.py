from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from utils.avatar import UPLOAD_DIR

def configure_uploads(app: FastAPI) -> None:
    app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")