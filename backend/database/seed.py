from datetime import date
from database.models import Pessoa, Usuario, Parentesco, SessionLocal
from utils.security import get_password_hash

def main():
    # Inicia a sessão com o banco
    db = SessionLocal()
    
    try:
        print("Limpando o banco de dados...")
        db.query(Parentesco).delete()
        db.query(Usuario).delete()
        db.query(Pessoa).delete()
        db.commit()

        print("Plantando a árvore genealógica expandida...")

        # ==========================================
        # 1. CRIANDO AS PESSOAS
        # ==========================================

        # --- LADO DO USUÁRIO (JOÃO) ---
        avo_paterno_joao = Pessoa(nome='José (Avô Paterno João)', sexo='M', data_nasc=date(1945, 5, 10), data_fal=date(2018, 12, 5))
        avo_paterna_joao = Pessoa(nome='Maria (Avó Paterna João)', sexo='F', data_nasc=date(1948, 8, 20))
        avo_materno_joao = Pessoa(nome='Antônio (Avô Materno João)', sexo='M', data_nasc=date(1943, 11, 1), data_fal=date(2021, 3, 14))
        avo_materna_joao = Pessoa(nome='Marta (Avó Materna João)', sexo='F', data_nasc=date(1950, 2, 15))
        
        pai_joao = Pessoa(nome='Carlos (Pai João)', sexo='M', data_nasc=date(1972, 4, 12))
        mae_joao = Pessoa(nome='Ana (Mãe João)', sexo='F', data_nasc=date(1975, 9, 30))
        irmao_joao = Pessoa(nome='Pedro (Irmão João)', sexo='M', data_nasc=date(2003, 7, 19))
        usuario_pessoa = Pessoa(nome='João (Usuário)', sexo='M', data_nasc=date(2000, 1, 1))

        # --- LADO DO CÔNJUGE (BEATRIZ) ---
        avo_paterno_beatriz = Pessoa(nome='Francisco (Avô Pat. Beatriz)', sexo='M', data_nasc=date(1944, 3, 22), data_fal=date(2015, 9, 10))
        avo_paterna_beatriz = Pessoa(nome='Francisca (Avó Pat. Beatriz)', sexo='F', data_nasc=date(1947, 7, 11), data_fal=date(2023, 1, 20))
        avo_materno_beatriz = Pessoa(nome='Raimundo (Avô Mat. Beatriz)', sexo='M', data_nasc=date(1946, 12, 5))
        avo_materna_beatriz = Pessoa(nome='Julia (Avó Mat. Beatriz)', sexo='F', data_nasc=date(1952, 5, 18))
        
        sogro = Pessoa(nome='Roberto (Sogro)', sexo='M', data_nasc=date(1974, 10, 8))
        sogra = Pessoa(nome='Helena (Sogra)', sexo='F', data_nasc=date(1977, 1, 14))
        conjuge = Pessoa(nome='Beatriz (Cônjuge)', sexo='F', data_nasc=date(2002, 6, 25))
        cunhado1 = Pessoa(nome='Gabriel (Cunhado)', sexo='M', data_nasc=date(1998, 11, 3))
        cunhada2 = Pessoa(nome='Larissa (Cunhada)', sexo='F', data_nasc=date(2005, 4, 17))

        # --- FILHOS DE JOÃO E BEATRIZ ---
        filho1 = Pessoa(nome='Lucas (Filho 1)', sexo='M', data_nasc=date(2023, 10, 10))
        filho2 = Pessoa(nome='Mariana (Filha 2)', sexo='F', data_nasc=date(2025, 2, 12))
        filho3 = Pessoa(nome='Mateus (Filho 3)', sexo='M', data_nasc=date(2026, 5, 1))

        # Adicionamos todas as pessoas à sessão
        pessoas = [
            avo_paterno_joao, avo_paterna_joao, avo_materno_joao, avo_materna_joao,
            pai_joao, mae_joao, irmao_joao, usuario_pessoa,
            avo_paterno_beatriz, avo_paterna_beatriz, avo_materno_beatriz, avo_materna_beatriz,
            sogro, sogra, conjuge, cunhado1, cunhada2,
            filho1, filho2, filho3
        ]
        db.add_all(pessoas)
        
        # O flush envia os dados para o banco e preenche os IDs dos objetos, 
        # mas ainda não salva definitivamente (commit)
        db.flush() 

        # ==========================================
        # 2. CRIANDO O USUÁRIO DO SISTEMA
        # ==========================================
        senha_hash = get_password_hash('exemplo_de_senha')
        usuario = Usuario(nome='admin_teste', senha=senha_hash, id_pessoa=usuario_pessoa.id)
        db.add(usuario)
        print(f"Usuário id: {usuario_pessoa.id}")

        # ==========================================
        # 3. ESTABELECENDO OS PARENTESCOS
        # ==========================================
        relacoes = [
            # --- RELAÇÕES DE JOÃO ---
            # Avós Paternos são PAI e MÃE do Pai de João
            Parentesco(id_pessoa_destino=pai_joao.id, id_pessoa_origem=avo_paterno_joao.id, parentesco='PAI'),
            Parentesco(id_pessoa_destino=pai_joao.id, id_pessoa_origem=avo_paterna_joao.id, parentesco='MAE'),
            Parentesco(id_pessoa_destino=avo_paterno_joao.id, id_pessoa_origem=avo_paterna_joao.id, parentesco='CONJUGE'),
            Parentesco(id_pessoa_destino=avo_paterna_joao.id, id_pessoa_origem=avo_paterno_joao.id, parentesco='CONJUGE'),

            # Avós Maternos são PAI e MÃE da Mãe de João
            Parentesco(id_pessoa_destino=mae_joao.id, id_pessoa_origem=avo_materno_joao.id, parentesco='PAI'),
            Parentesco(id_pessoa_destino=mae_joao.id, id_pessoa_origem=avo_materna_joao.id, parentesco='MAE'),
            Parentesco(id_pessoa_destino=avo_materno_joao.id, id_pessoa_origem=avo_materna_joao.id, parentesco='CONJUGE'),
            Parentesco(id_pessoa_destino=avo_materna_joao.id, id_pessoa_origem=avo_materno_joao.id, parentesco='CONJUGE'),

            # Pai e Mãe de João
            Parentesco(id_pessoa_destino=usuario_pessoa.id, id_pessoa_origem=pai_joao.id, parentesco='PAI'),
            Parentesco(id_pessoa_destino=usuario_pessoa.id, id_pessoa_origem=mae_joao.id, parentesco='MAE'),
            Parentesco(id_pessoa_destino=irmao_joao.id, id_pessoa_origem=pai_joao.id, parentesco='PAI'),
            Parentesco(id_pessoa_destino=irmao_joao.id, id_pessoa_origem=mae_joao.id, parentesco='MAE'),
            Parentesco(id_pessoa_destino=pai_joao.id, id_pessoa_origem=mae_joao.id, parentesco='CONJUGE'),
            Parentesco(id_pessoa_destino=mae_joao.id, id_pessoa_origem=pai_joao.id, parentesco='CONJUGE'),

            # --- RELAÇÕES DE BEATRIZ ---
            # Avós Paternos de Beatriz são PAI e MÃE do Sogro (Roberto)
            Parentesco(id_pessoa_destino=sogro.id, id_pessoa_origem=avo_paterno_beatriz.id, parentesco='PAI'),
            Parentesco(id_pessoa_destino=sogro.id, id_pessoa_origem=avo_paterna_beatriz.id, parentesco='MAE'),
            Parentesco(id_pessoa_destino=avo_paterno_beatriz.id, id_pessoa_origem=avo_paterna_beatriz.id, parentesco='CONJUGE'),
            Parentesco(id_pessoa_destino=avo_paterna_beatriz.id, id_pessoa_origem=avo_paterno_beatriz.id, parentesco='CONJUGE'),

            # Avós Maternos de Beatriz são PAI e MÃE da Sogra (Helena)
            Parentesco(id_pessoa_destino=sogra.id, id_pessoa_origem=avo_materno_beatriz.id, parentesco='PAI'),
            Parentesco(id_pessoa_destino=sogra.id, id_pessoa_origem=avo_materna_beatriz.id, parentesco='MAE'),
            Parentesco(id_pessoa_destino=avo_materno_beatriz.id, id_pessoa_origem=avo_materna_beatriz.id, parentesco='CONJUGE'),
            Parentesco(id_pessoa_destino=avo_materna_beatriz.id, id_pessoa_origem=avo_materno_beatriz.id, parentesco='CONJUGE'),

            # Sogro e Sogra são PAI e MÃE de Beatriz e dos Cunhados
            Parentesco(id_pessoa_destino=conjuge.id, id_pessoa_origem=sogro.id, parentesco='PAI'),
            Parentesco(id_pessoa_destino=conjuge.id, id_pessoa_origem=sogra.id, parentesco='MAE'),
            Parentesco(id_pessoa_destino=cunhado1.id, id_pessoa_origem=sogro.id, parentesco='PAI'),
            Parentesco(id_pessoa_destino=cunhado1.id, id_pessoa_origem=sogra.id, parentesco='MAE'),
            Parentesco(id_pessoa_destino=cunhada2.id, id_pessoa_origem=sogro.id, parentesco='PAI'),
            Parentesco(id_pessoa_destino=cunhada2.id, id_pessoa_origem=sogra.id, parentesco='MAE'),
            Parentesco(id_pessoa_destino=sogro.id, id_pessoa_origem=sogra.id, parentesco='CONJUGE'),
            Parentesco(id_pessoa_destino=sogra.id, id_pessoa_origem=sogro.id, parentesco='CONJUGE'),

            # --- CASAMENTO (JOÃO E BEATRIZ) ---
            Parentesco(id_pessoa_destino=usuario_pessoa.id, id_pessoa_origem=conjuge.id, parentesco='CONJUGE'),
            Parentesco(id_pessoa_destino=conjuge.id, id_pessoa_origem=usuario_pessoa.id, parentesco='CONJUGE'),
            
            # --- FILHOS DO CASAL ---
            # João (Pai) e Beatriz (Mãe)
            Parentesco(id_pessoa_destino=filho1.id, id_pessoa_origem=usuario_pessoa.id, parentesco='PAI'),
            Parentesco(id_pessoa_destino=filho1.id, id_pessoa_origem=conjuge.id, parentesco='MAE'),
            
            Parentesco(id_pessoa_destino=filho2.id, id_pessoa_origem=usuario_pessoa.id, parentesco='PAI'),
            Parentesco(id_pessoa_destino=filho2.id, id_pessoa_origem=conjuge.id, parentesco='MAE'),
            
            Parentesco(id_pessoa_destino=filho3.id, id_pessoa_origem=usuario_pessoa.id, parentesco='PAI'),
            Parentesco(id_pessoa_destino=filho3.id, id_pessoa_origem=conjuge.id, parentesco='MAE'),
        ]
        
        db.add_all(relacoes)
        # Salva tudo definitivamente no banco
        db.commit()
        print('Seed expandido concluído com sucesso!')

    except Exception as e:
        print(f"Ocorreu um erro: {e}")
        db.rollback() # Desfaz as alterações em caso de erro
    finally:
        db.close()

if __name__ == "__main__":
    main()