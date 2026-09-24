# Casos de Família

Aplicativo web para criar, visualizar e gerenciar uma árvore genealógica de forma interativa.

## Visão geral

O projeto é composto por:

- Backend em Python com FastAPI
- Banco de dados SQLite com SQLAlchemy
- Frontend em React + TypeScript + Vite
- Interface gráfica interativa com React Flow
- Containerização com Docker e Docker Compose

## Funcionalidades

- Cadastro inicial de usuário e árvore familiar
- Criação e edição de pessoas
- Definição de relações como pai, mãe e cônjuge
- Visualização gráfica da família em árvore/grafo
- Busca de pessoas na árvore
- Upload de avatar/foto
- Autenticação por sessão via cookie
- Estrutura de dados para manter parentesco e histórico familiar

## Estrutura do projeto

```bash
Casos-de-Familia/
├── backend/
│   ├── database/
│   ├── handlers/
│   ├── middlewares/
│   ├── routes/
│   ├── schemas/
│   ├── uploads/
│   ├── utils/
│   ├── Dockerfile
│   ├── main.py
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── public/
│   ├── src/
│   ├── dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── docker-compose.yml
├── README.md
└── .env
```

## Pré-requisitos

Antes de rodar o projeto, certifique-se de ter instalado:

- Docker
- Docker Compose

## Configuração do ambiente

Crie um arquivo `.env` na raiz do projeto com as variáveis necessárias:

```env
DATABASE_NAME=family_tree.db
VITE_API_URL=http://localhost:8000
```

> O backend usa a variável `DATABASE_NAME` para identificar o arquivo SQLite. O frontend usa `VITE_API_URL` para se conectar à API.

## Executando com Docker Compose

Na raiz do projeto:

```bash
docker compose up --build
```

A aplicação ficará disponível em:

- Frontend: http://localhost
- Backend API: http://localhost:8000

## Executando localmente sem Docker

### 1) Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O frontend normalmente fica em:

- http://localhost:5173

## Primeiro uso

Ao iniciar a aplicação, o primeiro acesso deve passar pela tela de configuração/registro, onde será criado:

- usuário principal
- pessoa inicial da árvore
- relações com pai, mãe e/ou cônjuge, se informados

## Observações importantes

- O banco do projeto é SQLite, então o arquivo do banco fica dentro de `backend/database/` por padrão.
- A pasta `backend/uploads` é usada para armazenar imagens e avatares.
- O projeto foi pensado para uma instância por ambiente, com um único usuário principal cadastrado.

## Contribuição

Contribuições são bem-vindas. Para colaborar:

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Faça commit das alterações
4. Abra um pull request

## Autor

<a href="https://github.com/Kayky-MM" style="display: flex; gap: 10px">
  <img src="https://github.com/Kayky-MM.png" width="25px" height="25px" style="border-radius: 50%; display: inline" alt="Perfil GitHub">
  <span>Kayky-MM</span>
</a> 
