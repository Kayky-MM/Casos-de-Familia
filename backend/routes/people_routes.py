from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from database.models import Pessoa, Parentesco, get_db, Usuario
from sqlalchemy import or_, and_
from schemas.schemas import RelativesResponse, UpdatePersonRequest, PessoaSearchResponse, CreatePersonRequest, UpdatePersonResponse, UpdateFileResponse, PessoaBase
from typing import List, Optional
from utils.avatar import add_avatar_url, verify_file, save_file, delete_file

router = APIRouter(prefix="/people", tags=["People"])

@router.get("/{id}", response_model=PessoaBase) # checked
def get_person(id: int, db: Session = Depends(get_db)):
    person = db.query(Pessoa).filter(Pessoa.id == id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada")
    
    return add_avatar_url(person)

@router.get("/{id}/relatives", response_model=RelativesResponse) # checked
def get_relatives(id: int, db: Session = Depends(get_db)):
    # 1. Busca a pessoa principal (Retorna 404 se não achar, boa prática HTTP)
    person = db.query(Pessoa).filter(Pessoa.id == id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada")

    # 2. Busca "Parentes Superiores" (Onde a pessoa atual é a origem: id_pessoa)
    # Fazemos um JOIN com Pessoa para já trazer os dados do parente
    relacoes_superiores = db.query(Parentesco, Pessoa).join(
        Pessoa, Parentesco.id_pessoa_origem == Pessoa.id
    ).filter(Parentesco.id_pessoa_destino == id).all()

    # 3. Busca "Parentes Inferiores" (Onde a pessoa atual é o destino: id_parente)
    relacoes_inferiores = db.query(Parentesco, Pessoa).join(
        Pessoa, Parentesco.id_pessoa_destino == Pessoa.id
    ).filter(Parentesco.id_pessoa_origem == id).all()

    # Estruturas iniciais
    parents = {"mother": None, "father": None, "married": False}
    conjuge = None
    children = []

    # 4. Classifica os parentes superiores (Pais e possível Cônjuge)
    for relacao, parente_obj in relacoes_superiores:
        if relacao.parentesco == 'PAI':
            parents["father"] = parente_obj
        elif relacao.parentesco == 'MAE':
            parents["mother"] = parente_obj
        elif relacao.parentesco == 'CONJUGE':
            conjuge = parente_obj

    # 5. Classifica os parentes inferiores (Filhos e possível Cônjuge)
    for relacao, pessoa_obj in relacoes_inferiores:
        if relacao.parentesco == 'PAI' or relacao.parentesco == 'MAE':
            children.append(pessoa_obj)
        elif relacao.parentesco == 'CONJUGE' and not conjuge:
            conjuge = pessoa_obj

    # 6. Verifica se os pais são casados (Equivalente ao seu findFirst com OR)
    if parents["father"] and parents["mother"]:
        id_pai = parents["father"].id
        id_mae = parents["mother"].id
        
        casamento = db.query(Parentesco).filter(
            Parentesco.parentesco == 'CONJUGE',
            or_(
                and_(Parentesco.id_pessoa_destino == id_pai, Parentesco.id_pessoa_origem == id_mae),
                and_(Parentesco.id_pessoa_destino == id_mae, Parentesco.id_pessoa_origem == id_pai)
            )
        ).first()
        
        if casamento:
            parents["married"] = True

    parents["father"] = add_avatar_url(parents["father"])
    parents["mother"] = add_avatar_url(parents["mother"])
    conjuge = add_avatar_url(conjuge)

    for child in children:
        child = add_avatar_url(child)

    return {
        "person": add_avatar_url(person),
        "parents": parents,
        "conjuge": conjuge,
        "children": children
    }

@router.patch("/{id}", response_model=UpdatePersonResponse) # checked
def update_person(id: int, info: UpdatePersonRequest, db: Session = Depends(get_db)):
    person = db.query(Pessoa).filter(Pessoa.id == id).first()

    if not person:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada.")

        # 1.1 Validação Básica
    if info.nome and not info.nome.strip():
        raise HTTPException(status_code=400, detail="O nome não pode ser vazio.")
    if (info.data_nascimento and info.data_falecimento) and (info.data_nascimento > info.data_falecimento):
        raise HTTPException(status_code=400, detail="Data de nascimento deve ser menor que a data de falecimento")
    if info.data_falecimento:
        user = db.query(Usuario).filter(Usuario.id_pessoa == id).first()
        if user:
            raise HTTPException(status_code=400, detail="Uma pessoa vinculada a um usuário não pode ter data de falecimento.")
    
    update_data = info.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado válido foi enviado.")

    # ==========================================
    # 1. SEPARAÇÃO E EXTRAÇÃO DOS RELACIONAMENTOS
    # ==========================================
    rel_updates = {}
    if "father_id" in update_data: rel_updates["PAI"] = update_data.pop("father_id")
    if "mother_id" in update_data: rel_updates["MAE"] = update_data.pop("mother_id")
    if "conjuge_id" in update_data: rel_updates["CONJUGE"] = update_data.pop("conjuge_id")

    active_rels = [v for v in rel_updates.values() if v is not None]

    if active_rels:
        # REGRA 1: Não pode ser parente de si mesmo
        if id in active_rels:
            raise HTTPException(status_code=400, detail="A pessoa não pode ser parente de si mesma.")

        # REGRA 2: Os parentes devem ser diferentes entre si
        if len(active_rels) != len(set(active_rels)):
            raise HTTPException(status_code=400, detail="Os IDs de pai, mãe e cônjuge devem ser diferentes entre si.")

        # REGRA 3: Verificar se os IDs existem no banco de dados
        existing_count = db.query(Pessoa).filter(Pessoa.id.in_(active_rels)).count()
        if existing_count != len(set(active_rels)):
            raise HTTPException(status_code=404, detail="Um ou mais parentes informados não existem.")

    # REGRA 4: Verificar poligamia/conflito de cônjuge
    conjuge_id = rel_updates.get("CONJUGE")
    if conjuge_id is not None:
        existing_spouse = db.query(Parentesco).filter(
            Parentesco.parentesco == 'CONJUGE',
            or_(
                Parentesco.id_pessoa_destino == conjuge_id,
                Parentesco.id_pessoa_origem == conjuge_id,
            ),
        ).first()
        if existing_spouse:
            spouse_id = (
                existing_spouse.id_pessoa_origem
                if existing_spouse.id_pessoa_destino == conjuge_id
                else existing_spouse.id_pessoa_destino
            )
            if spouse_id != id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A pessoa selecionada como cônjuge já possui um casamento com outra pessoa.",
                )

    # ==========================================
    # 2. ATUALIZA OS DADOS BÁSICOS (NOME, DATA, ETC)
    # ==========================================
    for key, value in update_data.items():
        setattr(person, key, value)

    # ==========================================
    # 3. ATUALIZA AS RELAÇÕES NA TABELA PARENTESCO
    # ==========================================
    removed_father_id, removed_mother_id, removed_conjuge_id = None, None, None

    for tipo, rel_id in rel_updates.items():
        existing_rel = db.query(Parentesco).filter_by(
            id_pessoa_destino=id,
            parentesco=tipo,
        ).first()

        if tipo == 'CONJUGE' and (existing_rel is None):
            existing_rel = db.query(Parentesco).filter_by(
                id_pessoa_origem=id,
                parentesco=tipo,
            ).first()


        # Cenário A: Frontend mandou null (Quer deletar a relação)
        if rel_id is None:
            if existing_rel:
                if tipo == 'CONJUGE':
        # A relacao de conjuge e gravada em duas direcoes. Portanto, a linha
        # encontrada pode ter a pessoa editada no destino ou na origem.
                    old_conjuge_id = (
                                    existing_rel.id_pessoa_origem
                                    if existing_rel.id_pessoa_destino == id
                                    else existing_rel.id_pessoa_destino
                                )
                    # Remove as duas direcoes, inclusive quando a busca acima
                    # encontrou primeiro a linha invertida.
                    marriage_rows = db.query(Parentesco).filter(
                        Parentesco.parentesco == 'CONJUGE',
                        or_(
                            and_(
                                Parentesco.id_pessoa_destino == id,
                                Parentesco.id_pessoa_origem == old_conjuge_id,
                            ),
                            and_(
                                Parentesco.id_pessoa_destino == old_conjuge_id,
                                Parentesco.id_pessoa_origem == id,
                            ),
                        ),
                    ).all()
                    for marriage_row in marriage_rows:
                        db.delete(marriage_row)
                    removed_conjuge_id = old_conjuge_id
                else:
                    db.delete(existing_rel)

                if tipo == 'PAI':
                    removed_father_id = existing_rel.id_pessoa_origem
                elif tipo == 'MAE':
                    removed_mother_id = existing_rel.id_pessoa_origem

        # Cenário B: Frontend mandou um ID novo
        else:

            if existing_rel:
                if tipo == 'CONJUGE':
                    old_conjuge_id = (
                        existing_rel.id_pessoa_origem
                        if existing_rel.id_pessoa_destino == id
                        else existing_rel.id_pessoa_destino
                    )
                    if old_conjuge_id != rel_id:
                        # Substitui o casal inteiro. Alterar apenas a linha
                        # encontrada deixaria a outra direcao inconsistente.
                        old_marriage_rows = db.query(Parentesco).filter(
                            Parentesco.parentesco == 'CONJUGE',
                            or_(
                                and_(
                                    Parentesco.id_pessoa_destino == id,
                                    Parentesco.id_pessoa_origem == old_conjuge_id,
                                ),
                                and_(
                                    Parentesco.id_pessoa_destino == old_conjuge_id,
                                    Parentesco.id_pessoa_origem == id,
                                ),
                            ),
                        ).all()
                        for marriage_row in old_marriage_rows:
                            db.delete(marriage_row)

                        db.add(Parentesco(
                            id_pessoa_destino=id,
                            id_pessoa_origem=rel_id,
                            parentesco='CONJUGE',
                        ))
                        db.add(Parentesco(
                            id_pessoa_destino=rel_id,
                            id_pessoa_origem=id,
                            parentesco='CONJUGE',
                        ))
                    removed_conjuge_id = old_conjuge_id
                else:
                    old_parente_id = existing_rel.id_pessoa_origem
                    existing_rel.id_pessoa_origem = rel_id
                    if tipo == 'PAI':
                        removed_father_id = old_parente_id
                    else:
                        removed_mother_id = old_parente_id
                
            else:
                # Cenário C: Não existia relação, criar nova
                if rel_id is not None:

                    new_rel = Parentesco(id_pessoa_destino=id, id_pessoa_origem=rel_id, parentesco=tipo)
                    db.add(new_rel)
                
                    if tipo == 'CONJUGE':
                        new_rev = Parentesco(id_pessoa_destino=rel_id, id_pessoa_origem=id, parentesco='CONJUGE')
                        db.add(new_rev)

    # ==========================================
    # 4. SALVA TUDO NO BANCO (TRANSAÇÃO SEGURA)
    # ==========================================
    try:
        db.commit()
        db.refresh(person)
    except SQLAlchemyError:
        db.rollback() 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno ao tentar atualizar o banco de dados."
        )

    # ==========================================
    # 5. BUSCA OS DADOS ATUALIZADOS PARA O RETORNO
    # ==========================================
    relacoes_superiores = db.query(Parentesco, Pessoa).join(
        Pessoa, Parentesco.id_pessoa_origem == Pessoa.id
    ).filter(Parentesco.id_pessoa_destino == id).all()

    relacoes_inferiores = db.query(Parentesco, Pessoa).join(
        Pessoa, Parentesco.id_pessoa_destino == Pessoa.id
    ).filter(Parentesco.id_pessoa_origem == id).all()

    parents = {"mother": None, "father": None, "married": False}
    conjuge = None
    children = []

    for relacao, parente_obj in relacoes_superiores:
        if relacao.parentesco == 'PAI':
            parents["father"] = parente_obj
        elif relacao.parentesco == 'MAE':
            parents["mother"] = parente_obj
        elif relacao.parentesco == 'CONJUGE':
            conjuge = parente_obj

    for relacao, pessoa_obj in relacoes_inferiores:
        if relacao.parentesco in ['PAI', 'MAE']:
            children.append(pessoa_obj)
        elif relacao.parentesco == 'CONJUGE' and not conjuge:
            conjuge = pessoa_obj

    if parents["father"] and parents["mother"]:
        id_pai = parents["father"].id
        id_mae = parents["mother"].id
        
        casamento = db.query(Parentesco).filter(
            Parentesco.parentesco == 'CONJUGE',
            or_(
                and_(Parentesco.id_pessoa_destino == id_pai, Parentesco.id_pessoa_origem == id_mae),
                and_(Parentesco.id_pessoa_destino == id_mae, Parentesco.id_pessoa_origem == id_pai)
            )
        ).first()
        
        if casamento:
            parents["married"] = True

    parents["father"] = add_avatar_url(parents["father"])
    parents["mother"] = add_avatar_url(parents["mother"])
    conjuge = add_avatar_url(conjuge)

    children = [add_avatar_url(child) for child in children]

    return {
        "person": add_avatar_url(person),
        "parents": parents,
        "conjuge": conjuge,
        "children": children,
        "removed_father_id": removed_father_id,
        "removed_mother_id": removed_mother_id,
        "removed_conjuge_id": removed_conjuge_id
    }

@router.get("", response_model=List[PessoaSearchResponse])
def search_people(
    search: Optional[str] = None, # O FastAPI transforma isso no ?search=nome
    sexo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # 1. Monta a query pedindo APENAS as colunas id e nome
    # Isso é muito mais rápido do que db.query(Pessoa)
    query = db.query(Pessoa.id, Pessoa.nome, Pessoa.sexo)
    
    # 2. Aplica o filtro de busca se o usuário digitou algo
    if search:
        cleaned_search = (
            search.replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_")
        )
        query = query.filter(Pessoa.nome.ilike(f"%{cleaned_search}%", escape='\\'))
    if sexo:
        query = query.filter(Pessoa.sexo == sexo)
    # 3. Executa a query limitando a 20 resultados
    # Limitar é essencial para barras de pesquisa para não travar o frontend
    resultados = query.limit(20).all()
    # O Pydantic transforma automaticamente o resultado do SQLAlchemy no formato correto
    return resultados

@router.post("", status_code=status.HTTP_201_CREATED) # checked
def create_person(req: CreatePersonRequest, db: Session = Depends(get_db)):
    
    # 1.1 Validação Básica
    if not req.nome or not req.nome.strip():
        raise HTTPException(status_code=400, detail="O nome é obrigatório.")
    if req.sexo not in ['M', 'F']:
        raise HTTPException(status_code=400, detail="O sexo deve ser 'M' ou 'F'.")
    if (req.data_nascimento and req.data_falecimento) and (req.data_nascimento > req.data_falecimento):
        raise HTTPException(status_code=400, detail="Data de nascimento deve ser menor que a data de falecimento")

    # Verifica UniqueConstraint do nome da pessoa principal
    if db.query(Pessoa).filter(Pessoa.nome == req.nome).first():
        raise HTTPException(status_code=400, detail="Já existe uma pessoa cadastrada com este nome.")

    father = None
    mother = None
    spouse = None
    already_married = False
    
    try:
        if req.relationships:
            rel = req.relationships
            
            # 1.5 Verificar se os IDs fornecidos são diferentes entre si
            active_ids = [id_ for id_ in [rel.father_id, rel.mother_id, rel.conjuge_id] if id_ is not None]
            if len(active_ids) != len(set(active_ids)):
                raise HTTPException(status_code=400, detail="Os IDs informados para pai, mãe e cônjuge devem ser diferentes.")

            # ==========================================
            # VALIDAÇÃO E CRIAÇÃO DO PAI
            # ==========================================
            if rel.father_id:
                father = db.query(Pessoa).filter(Pessoa.id == rel.father_id).first()
                if not father:
                    raise HTTPException(status_code=400, detail="Pai informado não existe no banco de dados.")
                if father.sexo != 'M':
                    raise HTTPException(status_code=400, detail="O pai deve ser do sexo masculino.")
            elif rel.father_data and rel.father_data.nome and rel.father_data.nome.strip():
                # 1.3 Criação de novo registro
                father = Pessoa(nome=rel.father_data.nome, sexo='M')
                db.add(father)

            # ==========================================
            # VALIDAÇÃO E CRIAÇÃO DA MÃE
            # ==========================================
            if rel.mother_id:
                mother = db.query(Pessoa).filter(Pessoa.id == rel.mother_id).first()
                if not mother:
                    raise HTTPException(status_code=400, detail="Mãe informada não existe no banco de dados.")
                if mother.sexo != 'F':
                    raise HTTPException(status_code=400, detail="A mãe deve ser do sexo feminino.")
            elif rel.mother_data and rel.mother_data.nome and rel.mother_data.nome.strip():
                # 1.3 Criação de novo registro
                mother = Pessoa(nome=rel.mother_data.nome, sexo='F')
                db.add(mother)

            # ==========================================
            # VALIDAÇÃO E CRIAÇÃO DO CÔNJUGE
            # ==========================================
            expected_spouse_sex = 'F' if req.sexo == 'M' else 'M'
            
            if rel.conjuge_id:
                spouse = db.query(Pessoa).filter(Pessoa.id == rel.conjuge_id).first()
                if not spouse:
                    raise HTTPException(status_code=400, detail="Cônjuge informado não existe no banco de dados.")
                
                # 1.4 Verifica se o cônjuge já é casado com outra pessoa
                existing_marriage = db.query(Parentesco).filter(
                    Parentesco.parentesco == 'CONJUGE',
                    or_(Parentesco.id_pessoa_destino == spouse.id, Parentesco.id_pessoa_origem == spouse.id)
                ).first()
                if existing_marriage:
                    raise HTTPException(status_code=400, detail="O cônjuge informado já está em um relacionamento.")
                    
            elif rel.conjuge_data and rel.conjuge_data.nome and rel.conjuge_data.nome.strip():
                # 1.3 Criação de novo registro
                spouse = Pessoa(nome=rel.conjuge_data.nome, sexo=expected_spouse_sex)
                db.add(spouse)
            
            if req.married and father and mother:
                if father.id and mother.id:
                    parents_marriage = db.query(Parentesco).filter(
                        Parentesco.parentesco == 'CONJUGE',
                        or_(
                            and_(
                                Parentesco.id_pessoa_destino == father.id,
                                Parentesco.id_pessoa_origem == mother.id,
                            ),
                            and_(
                                Parentesco.id_pessoa_destino == mother.id,
                                Parentesco.id_pessoa_origem == father.id,
                            ),
                        ),
                    ).first()

                    if parents_marriage:
                        already_married = True
                    else:
                        father_spouse = db.query(Parentesco).filter(
                            Parentesco.parentesco == 'CONJUGE',
                            or_(
                                Parentesco.id_pessoa_destino == father.id,
                                Parentesco.id_pessoa_origem == father.id,
                            ),
                        ).first()
                        if father_spouse:
                            raise HTTPException(
                                status_code=400,
                                detail="A flag 'married' deve ser false: o pai já possui outro cônjuge no sistema.",
                            )

                        mother_spouse = db.query(Parentesco).filter(
                            Parentesco.parentesco == 'CONJUGE',
                            or_(
                                Parentesco.id_pessoa_destino == mother.id,
                                Parentesco.id_pessoa_origem == mother.id,
                            ),
                        ).first()
                        if mother_spouse:
                            raise HTTPException(
                                status_code=400,
                                detail="A flag 'married' deve ser false: a mãe já possui outro cônjuge no sistema.",
                            )

        # ==========================================
        # 2.1 CRIAÇÃO DA PESSOA PRINCIPAL
        # ==========================================
        main_person = Pessoa(
            nome=req.nome,
            sexo=req.sexo,
            bio= req.biografia,
            data_nasc=req.data_nascimento,
            data_fal=req.data_falecimento
        )
        db.add(main_person)
        
        # O flush processa os db.add() pendentes para gerar os IDs reais no banco (mas sem commitar)
        db.flush()

        # ==========================================
        # 2.2 ASSOCIAÇÃO DOS PARENTESCOS
        # ==========================================
        if father:
            db.add(Parentesco(id_pessoa_destino=main_person.id, id_pessoa_origem=father.id, parentesco='PAI'))
        if mother:
            db.add(Parentesco(id_pessoa_destino=main_person.id, id_pessoa_origem=mother.id, parentesco='MAE'))
        
        if spouse:
            # Relação bidirecional
            db.add(Parentesco(id_pessoa_destino=main_person.id, id_pessoa_origem=spouse.id, parentesco='CONJUGE'))
            db.add(Parentesco(id_pessoa_destino=spouse.id, id_pessoa_origem=main_person.id, parentesco='CONJUGE'))

        # Se a flag "married" foi enviada como verdadeira e ambos os pais existem (Casamento dos Pais)
        if req.married and father and mother and not already_married:
            db.add(Parentesco(id_pessoa_destino=father.id, id_pessoa_origem=mother.id, parentesco='CONJUGE'))
            db.add(Parentesco(id_pessoa_destino=mother.id, id_pessoa_origem=father.id, parentesco='CONJUGE'))

        # 3. Confirma a transação
        db.commit()
        db.refresh(main_person)

    except IntegrityError as e:
        # Se você tentar criar um pai/mãe/cônjuge novo (sem ID) mas o nome já existir, 
        # o banco lançará um IntegrityError devido à UniqueConstraint.
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Conflito de dados: Um dos nomes informados para os parentes já existe no sistema."
        )
    except HTTPException:
        # Repassa as exceções customizadas que nós mesmos lançamos acima
        db.rollback()
        raise
    except Exception as e:
        # 3.2 Rollback de segurança para erros genéricos
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail=f"Erro interno detalhado: {str(e)}"
        )

    # 3.1 Resposta de Sucesso
    return {
        "person": {
            "id": main_person.id,
            "nome": main_person.nome,
            "sexo": main_person.sexo
        },
        "parents" : {
            "father": add_avatar_url(father),
            "mother": add_avatar_url(mother)
        },
        "conjuge": add_avatar_url(spouse)
    }

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT) # checked
def delete_person(id: int, db: Session = Depends(get_db)):
    # 1. Validação de existência
    person = db.query(Pessoa).filter(Pessoa.id == id).first()
    
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Pessoa não encontrada."
        )

    user = db.query(Usuario).filter(Usuario.id_pessoa == id).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uma pessoa vinculada a um usuário não pode ser deletada"
        )
    # 2. Executa a exclusão (o CASCADE do banco limpa os parentescos automaticamente)
    try:
        db.delete(person)
        db.commit()
        delete_file(id)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno ao tentar deletar a pessoa do banco de dados."
        )
    except OSError:
        # Se falhar ao apagar o arquivo físico, apenas ignora para não quebrar o fluxo
        # Opcional: registrar em log um aviso (logger.warning)
        return None
    # 3. Retorna vazio com status 204 (padrão REST para deleções bem-sucedidas)
    return None

@router.put("/{id}/avatar", response_model=UpdateFileResponse) # checked
async def upload_avatar(id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    person = db.query(Pessoa).filter(Pessoa.id == id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada.")
    
    file_extension, content = await verify_file(file)

    avatar_name = save_file(file_extension, content, id)

    return {
        "message": "Avatar atualizado com sucesso.",
        "avatar_url": f"/uploads/{avatar_name}"
    }

@router.delete("/{id}/avatar", status_code=status.HTTP_204_NO_CONTENT) # checked
def delete_avatar(id: int, db: Session = Depends(get_db)):
    person = db.query(Pessoa).filter(Pessoa.id == id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada.")

    delete_file(id)

    return None