from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel
from typing import List, Optional
from datetime import date

class CamelBaseModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,      # Converte automaticamente snake_case <-> camelCase
        populate_by_name=True,         # Permite que o Python ainda aceite o nome original se necessário
        from_attributes=True           # Antigo class Config: from_attributes = True (essencial para SQLAlchemy)
    )
# Modelo base para reaproveitar os campos da Pessoa
class PessoaBase(CamelBaseModel):
    id: int
    nome: str
    sexo: str
    biografia: Optional[str] = None
    data_nascimento: Optional[date] = None
    data_falecimento: Optional[date] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True # Permite ler objetos do SQLAlchemy diretamente

# Modelo para o objeto "parents"
class ParentsInfo(CamelBaseModel):
    mother: Optional[PessoaBase] = None
    father: Optional[PessoaBase] = None
    married: bool = False

# Modelo final da rota, que herda os dados da pessoa e adiciona os parentes
class RelativesResponse(CamelBaseModel):
    person: PessoaBase
    parents: ParentsInfo
    conjuge: Optional[PessoaBase] = None
    children: List[PessoaBase] = []

class UpdatePersonResponse(RelativesResponse):
    removed_father_id: Optional[int] = None
    removed_mother_id: Optional[int] = None
    removed_conjuge_id: Optional[int] = None

class UpdatePersonRequest(CamelBaseModel):
    nome: Optional[str] = None
    biografia: Optional[str] = None
    data_nascimento: Optional[date] = None
    data_falecimento: Optional[date] = None
    father_id: Optional[int] = None
    mother_id: Optional[int] = None
    conjuge_id: Optional[int] = None

class PessoaSearchResponse(CamelBaseModel): 
    id: int
    nome: str

    class Config:
        from_attributes = True

class RelatedPersonData(CamelBaseModel):
    nome: Optional[str] = None

class RelationshipsPayload(CamelBaseModel):
    father_id: Optional[int] = None
    mother_id: Optional[int] = None
    conjuge_id: Optional[int] = None
    father_data: Optional[RelatedPersonData] = None
    mother_data: Optional[RelatedPersonData] = None
    conjuge_data: Optional[RelatedPersonData] = None

class CreatePersonRequest(CamelBaseModel):
    nome: str
    sexo: str
    biografia: Optional[str] = None
    data_nascimento: Optional[date] = None
    data_falecimento: Optional[date] = None
    married: bool = True
    relationships: Optional[RelationshipsPayload] = None

class UserResponse(CamelBaseModel):
    id: int
    nome: str
    id_pessoa: Optional[int] = Field(default=None)

class GetUserResponse(CamelBaseModel):
    user: Optional[UserResponse] = Field(default=None)

class UserLoginRequest(CamelBaseModel):
    username: str
    password: str

class SetupPersonRequest(CamelBaseModel):
    nome: str
    sexo: str
    biografia: Optional[str] = None
    data_nascimento: Optional[date] = None
    data_falecimento: Optional[date] = None
    married: bool
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    conjuge_name: Optional[str] = None
    @field_validator('data_nascimento', 'data_falecimento', mode='before')
    @classmethod
    def blank_string_to_none(cls, value):
        value = value.strip()
        if value == "":
            return None
        return value

class SetupRequest(CamelBaseModel):
    username: str
    password: str
    person: SetupPersonRequest

class SetupResponse(CamelBaseModel):
    user_id: int
    username: str
    id_pessoa: int

class UsersExistsResponse(CamelBaseModel):
    exists: bool

    class Config:
        from_attributes = True

class UpdateFileResponse(CamelBaseModel):
    message: str
    avatar_url: str