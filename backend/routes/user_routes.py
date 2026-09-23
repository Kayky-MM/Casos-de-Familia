from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from database.models import Usuario, Pessoa, Parentesco, get_db 
from schemas.schemas import GetUserResponse, UserLoginRequest, SetupRequest, SetupResponse, UsersExistsResponse
from utils.security import SESSION_COOKIE_NAME, verify_password, get_password_hash, generate_session_token, set_session_cookie, hash_token

router = APIRouter(prefix='/user', tags=['User'])

@router.get("/any", response_model=UsersExistsResponse, status_code=status.HTTP_200_OK)
def check_users_exist(db: Session = Depends(get_db)):
    user_count = db.query(Usuario).first() is not None
    return {"exists": user_count}


@router.post("/login", status_code=status.HTTP_200_OK, response_model=GetUserResponse)
def login_user(req: UserLoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.nome == req.username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos."
        )
    
    if not verify_password(req.password, user.senha):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos."
        )

    token = generate_session_token()
    user.token_hash = hash_token(token)
    db.add(user)
    db.commit()
    db.refresh(user)

    set_session_cookie(response, token)
    return {"user": {"id_pessoa": user.id_pessoa, "id": user.id, "nome": user.nome}}


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout_user(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    # 1. Obter o token da sessão atual através do cookie do request
    session_token = request.cookies.get(SESSION_COOKIE_NAME)

    if session_token:
        # 2. Gerar o hash do token recebido para buscar O USUÁRIO CERTO
        token_hash = hash_token(session_token) # Substitua pela sua função de hash

        # 3. Buscar e invalidar especificamente o usuário desta sessão
        user = db.query(Usuario).filter(Usuario.token_hash == token_hash).first()
        if user:
            user.token_hash = None
            db.commit()

    # 4. Remover o cookie do navegador
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="strict",
        secure=False 
    )

    return {"detail": "Sessão encerrada com sucesso."}


@router.post("/setup", status_code=status.HTTP_201_CREATED, response_model=SetupResponse)
def setup_account(req: SetupRequest, response: Response, db: Session = Depends(get_db)):
    if db.query(Usuario).count() > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="O sistema já possui um usuário cadastrado. Só é permitido um usuário por instância."
        )

    if db.query(Usuario).filter(Usuario.nome == req.username).first():
        raise HTTPException(status_code=400, detail="Este nome de usuário já está cadastrado.")

    if db.query(Pessoa).filter(Pessoa.nome == req.person.nome).first():
        raise HTTPException(status_code=400, detail="Já existe uma pessoa cadastrada com o nome principal informado.")

    father = None
    mother = None

    try:
        main_person = Pessoa(
            nome=req.person.nome,
            sexo=req.person.sexo,
            bio=req.person.biografia,
            data_nasc=req.person.data_nascimento,
            data_fal=req.person.data_falecimento
        )
        db.add(main_person)
        db.flush()

        if req.person.father_name:
            if db.query(Pessoa).filter(Pessoa.nome == req.person.father_name).first():
                raise HTTPException(status_code=400, detail="O nome do pai já está em uso no sistema.")
            father = Pessoa(nome=req.person.father_name, sexo='M')
            db.add(father)
            db.flush()
            db.add(Parentesco(id_pessoa_destino=main_person.id, id_pessoa_origem=father.id, parentesco='PAI'))

        if req.person.mother_name:
            if db.query(Pessoa).filter(Pessoa.nome == req.person.mother_name).first():
                raise HTTPException(status_code=400, detail="O nome da mãe já está em uso no sistema.")
            mother = Pessoa(nome=req.person.mother_name, sexo='F')
            db.add(mother)
            db.flush()
            db.add(Parentesco(id_pessoa_destino=main_person.id, id_pessoa_origem=mother.id, parentesco='MAE'))

        if req.person.married and father and mother:
            db.add(Parentesco(id_pessoa_destino=father.id, id_pessoa_origem=mother.id, parentesco='CONJUGE'))
            db.add(Parentesco(id_pessoa_destino=mother.id, id_pessoa_origem=father.id, parentesco='CONJUGE'))

        if req.person.conjuge_name:
            if db.query(Pessoa).filter(Pessoa.nome == req.person.conjuge_name).first():
                raise HTTPException(status_code=400, detail="O nome do cônjuge já está em uso no sistema.")

            conj_sex = 'F' if req.person.sexo == 'M' else 'M'
            conjuge = Pessoa(nome=req.person.conjuge_name, sexo=conj_sex)
            db.add(conjuge)
            db.flush()
            db.add(Parentesco(id_pessoa_destino=main_person.id, id_pessoa_origem=conjuge.id, parentesco='CONJUGE'))
            db.add(Parentesco(id_pessoa_destino=conjuge.id, id_pessoa_origem=main_person.id, parentesco='CONJUGE'))

        hashed_password = get_password_hash(req.password)
        novo_usuario = Usuario(
            nome=req.username,
            senha=hashed_password,
            id_pessoa=main_person.id
        )
        token = generate_session_token()
        novo_usuario.token_hash = hash_token(token)
        db.add(novo_usuario)

        db.commit()
        db.refresh(novo_usuario)

        set_session_cookie(response, token)
        return {
            "user_id": novo_usuario.id,
            "username": novo_usuario.nome,
            "id_pessoa": novo_usuario.id_pessoa
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conflito de dados: Algum dos nomes informados já está registrado no sistema."
        )
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno ao criar as configurações da conta."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno ao criar as configurações da conta."
        )