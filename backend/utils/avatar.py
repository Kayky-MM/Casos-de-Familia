from pathlib import Path
from typing import Optional
from fastapi import status
from fastapi.exceptions import HTTPException
import os

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_AVATAR_SIZE = 2 * 1024 * 1024
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg"}
ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg"}

def build_avatar_url(person_id: int) -> Optional[str]:
    for ext in (".png", ".jpg", ".jpeg"):
        file_path = UPLOAD_DIR / f"person_{person_id}{ext}"
        if file_path.exists():
            return f"/uploads/person_{person_id}{ext}"
    return None

def add_avatar_url(person):
    if not person:
        return person
    person_data = {
            **person.__dict__,
            "avatar_url": build_avatar_url(person.id)
        }
    person_data.pop("_sa_instance_state", None)
        
    return person_data

async def verify_file(file):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Arquivo de imagem não informado.")

    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Formato inválido. Envie um arquivo PNG ou JPEG.")

    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de arquivo inválido. A imagem deve ser PNG ou JPEG.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Arquivo vazio.")
    if len(content) > MAX_AVATAR_SIZE:
        raise HTTPException(status_code=413, detail="Arquivo muito grande. O limite é de 2MB.")

    if file_extension == ".png" and len(content) >= 8 and content[:8] != b"\x89PNG\r\n\x1a\n":
        raise HTTPException(status_code=400, detail="Conteúdo PNG inválido.")

    if file_extension in {".jpg", ".jpeg"}:
        if len(content) < 3 or content[:2] != b"\xff\xd8":
            raise HTTPException(status_code=400, detail="Conteúdo JPEG inválido.")

    return (file_extension, content)

def delete_file(id):
    for ext in ALLOWED_EXTENSIONS:
        file_path = UPLOAD_DIR / f"person_{id}{ext}"
        if file_path.exists():
            try:
                os.remove(file_path)
                break
            except OSError as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Erro ao remover o arquivo de imagem do servidor: {str(e)}"
                )

def save_file(file_extension, content, id):
    for ext in ALLOWED_EXTENSIONS: 
        file_path = UPLOAD_DIR / f"person_{id}{ext}"
        if file_path.exists():
            try: 
                os.remove(file_path)
            except OSError as e:
                continue
    
    avatar_name = f"person_{id}{file_extension}"
    avatar_path = UPLOAD_DIR / avatar_name
    avatar_path.write_bytes(content)

    return avatar_name