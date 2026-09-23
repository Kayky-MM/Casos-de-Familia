from sqlalchemy import create_engine, Column, String, Integer, Date, ForeignKey, Enum, event
from sqlalchemy.orm import declarative_base, sessionmaker
from pathlib import Path

DATABASE_PATH = Path(__file__).resolve().parent / "family_tree.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"

db = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

@event.listens_for(db, "connect")
def enable_sqlite_foreign_keys(connection, connection_record):
    connection.execute("PRAGMA foreign_keys=ON")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db)

def get_db():
    db = SessionLocal()
    try:
        yield db  
    finally:
        db.close()

Base = declarative_base()

class Usuario(Base):
    __tablename__ = "usuario"
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    nome = Column("nome", String(50), nullable=False, unique=True)
    senha = Column("senha", String(128), nullable=False, unique=True)
    id_pessoa = Column("id_pessoa", ForeignKey("pessoa.id", ondelete='CASCADE'), unique=True)
    token_hash = Column("token_hash", String(128), nullable=True, unique=True)

    def __init__(self, nome, senha, id_pessoa=None):
        self.nome = nome
        self.senha = senha
        self.id_pessoa = id_pessoa
        self.token_hash = None


class Pessoa(Base):
    __tablename__ = "pessoa"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    nome = Column("nome", String(50), nullable=False, unique=True)
    sexo = Column("sexo", Enum('M', 'F'), nullable=False)
    data_nascimento = Column("data_nascimento", Date, nullable=True)
    data_falecimento = Column("data_falecimento", Date, nullable=True) 
    biografia = Column("biografia", String(255), nullable=True)

    def __init__(self, nome, sexo, data_nasc=None, data_fal=None, bio=None):
        self.nome = nome
        self.biografia = bio
        self.data_falecimento = data_fal
        self.data_nascimento = data_nasc
        self.sexo = sexo



class Parentesco(Base):
    __tablename__ = "parentesco"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    id_pessoa_destino = Column("id_pessoa_destino", ForeignKey("pessoa.id", ondelete='CASCADE'), nullable=False)
    id_pessoa_origem = Column("id_parente_origem", ForeignKey("pessoa.id", ondelete='CASCADE'), nullable=False)
    parentesco = Column("parentesco", Enum('PAI', 'MAE', 'CONJUGE'), nullable=False)

    def __init__(self, id_pessoa_destino, id_pessoa_origem, parentesco):
        self.id_pessoa_origem = id_pessoa_origem
        self.id_pessoa_destino = id_pessoa_destino
        self.parentesco = parentesco