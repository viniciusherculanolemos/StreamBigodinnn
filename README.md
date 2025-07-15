O BigodiNNN1 é uma plataforma web completa desenvolvida para o streamer BigodiNNN1, oferecendo uma experiência integrada para a comunidade com sistema de usuários, streaming ao vivo, notícias, clipes, sorteios e muito mais.

🌟 Destaques

•
🔐 Autenticação Avançada: Login tradicional + OAuth (Google, Discord)

•
📺 Integração Twitch: Status de stream em tempo real

•
📰 Sistema de Notícias: CMS completo para gerenciamento de conteúdo

•
🎬 Galeria de Clipes: Upload e organização de momentos marcantes

•
🎁 Sistema de Sorteios: Ferramenta para engajamento da comunidade

•
👥 Gestão de Associados: Sistema de membros com diferentes níveis

•
💰 Doações: Integração para apoio financeiro

•
🛡️ Segurança Robusta: Headers de segurança, rate limiting, validação

•
⚡ Performance Otimizada: Cache Redis, lazy loading, compressão

✨ Funcionalidades

🔐 Sistema de Autenticação

•
Login Tradicional: Email/senha com validação segura

•
OAuth Integrado: Login com Google e Discord

•
Recuperação de Senha: Sistema de reset via email

•
Sessões Seguras: Tokens JWT com expiração automática

•
Níveis de Acesso: Usuário, Moderador, Admin

📺 Streaming & Twitch

•
Status em Tempo Real: Indicador de stream online/offline

•
Contador de Viewers: Visualização de audiência atual

•
Chat Integrado: Sistema de chat da comunidade

•
Notificações: Alertas de início de stream

📰 Sistema de Notícias

•
Editor Rich Text: Interface amigável para criação

•
Categorização: Organização por tags e categorias

•
Agendamento: Publicação programada

•
Moderação: Sistema de aprovação de conteúdo

•
SEO Otimizado: Meta tags e URLs amigáveis

🎬 Galeria de Clipes

•
Upload Múltiplo: Envio de vários arquivos simultaneamente

•
Processamento: Otimização automática de vídeos

•
Organização: Sistema de tags e categorias

•
Compartilhamento: Links diretos para redes sociais

🎁 Sistema de Sorteios

•
Criação Flexível: Múltiplos tipos de sorteios

•
Participação Automática: Integração com sistema de usuários

•
Histórico: Registro completo de sorteios anteriores

•
Transparência: Resultados públicos e verificáveis

👥 Gestão de Comunidade

•
Perfis de Usuário: Customização completa

•
Sistema de Associados: Diferentes níveis de membership

•
Moderação: Ferramentas para administração

•
Estatísticas: Métricas de engajamento

💰 Sistema de Doações

•
Múltiplas Opções: PIX, cartão, transferência

•
Metas: Objetivos de arrecadação

•
Transparência: Histórico público de doações

•
Agradecimentos: Sistema automático de reconhecimento

🏗️ Arquitetura

📁 Estrutura do Projeto

Plain Text


bigodinnn1/
├── 🔧 backend/                 # API Flask
│   ├── src/
│   │   ├── 🚀 main.py         # Aplicação principal
│   │   ├── 📊 models/         # Modelos de dados
│   │   ├── 🛣️ routes/         # Endpoints da API
│   │   └── 🔧 utils/          # Utilitários
│   ├── 📦 requirements.txt    # Dependências Python
│   └── 🗄️ database/          # Arquivos de banco
├── 🎨 frontend/               # Interface do usuário
│   ├── 📄 *.html             # Páginas HTML
│   ├── 🎨 assets/
│   │   ├── 🎨 css/           # Estilos
│   │   ├── ⚡ js/            # Scripts
│   │   └── 🖼️ images/        # Imagens
│   └── 🧩 components/        # Componentes reutilizáveis
├── 🗄️ migrations/            # Scripts de banco
├── 📚 docs/                  # Documentação
├── 🧪 tests/                 # Testes automatizados
└── 🐳 docker/               # Configuração Docker


🔧 Stack Tecnológica

Backend

•
🐍 Python 3.11+: Linguagem principal

•
🌶️ Flask 3.1.0: Framework web

•
🗄️ SQLAlchemy: ORM para banco de dados

•
🔐 Authlib: Autenticação OAuth

•
📧 Flask-Mail: Sistema de emails

•
🛡️ Flask-Talisman: Headers de segurança

•
⚡ Redis: Cache e sessões

•
🚀 Gunicorn: Servidor WSGI

Frontend

•
🌐 HTML5: Estrutura semântica

•
🎨 CSS3: Estilos modernos e responsivos

•
⚡ JavaScript ES6+: Interatividade

•
📱 Design Responsivo: Mobile-first

•
🎭 Componentes: Arquitetura modular

Banco de Dados

•
🗄️ MySQL 8.0+: Produção

•
📝 SQLite: Desenvolvimento

•
🔄 Migrações: Versionamento de schema

DevOps & Deploy

•
🐳 Docker: Containerização

•
🌐 Nginx: Proxy reverso

•
🔒 Let's Encrypt: Certificados SSL

•
📊 Logging: Sistema de logs estruturado

🚀 Instalação

📋 Pré-requisitos

•
🐍 Python 3.11+

•
🗄️ MySQL 8.0+ (produção) ou 📝 SQLite (desenvolvimento)

•
⚡ Redis 6.0+ (recomendado para cache)

•
📦 Git para clonagem do repositório

🔧 Instalação Local

1. Clone o Repositório

Bash


git clone https://github.com/seu-usuario/bigodinnn1.git
cd bigodinnn1


2. Crie o Ambiente Virtual

Bash


# Criar ambiente virtual
python3 -m venv venv

# Ativar ambiente virtual
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows


3. Instale as Dependências

Bash


pip install --upgrade pip
pip install -r backend/requirements_updated.txt


4. Configure as Variáveis de Ambiente

Bash


# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações
nano .env


5. Configure o Banco de Dados

Bash


# Para desenvolvimento (SQLite) - automático
# Para produção (MySQL)
mysql -u root -p
CREATE DATABASE bigodinnn1_db;
CREATE USER 'bigodinnn1_user'@'localhost' IDENTIFIED BY 'sua_senha';
GRANT ALL PRIVILEGES ON bigodinnn1_db.* TO 'bigodinnn1_user'@'localhost';
FLUSH PRIVILEGES;


6. Execute as Migrações

Bash


# Aplicar migrações SQL
mysql -u bigodinnn1_user -p bigodinnn1_db < migrations_analysis/migrations/0010_oauth_support.sql


7. Execute a Aplicação

Bash


cd backend/src
python main_improved.py


8. Acesse a Aplicação

Abra seu navegador e acesse: http://localhost:5000

🐳 Instalação com Docker

Bash


# Clonar repositório
git clone https://github.com/seu-usuario/bigodinnn1.git
cd bigodinnn1

# Construir e executar
docker-compose up --build

# Acessar em http://localhost:5000


🔧 Configuração

🔑 Variáveis de Ambiente

Crie um arquivo .env baseado no .env.example:

Plain Text


# Configuração do Flask
FLASK_ENV=development
FLASK_SECRET_KEY=sua_chave_secreta_super_segura
FLASK_DEBUG=True

# Banco de Dados
DB_HOST=localhost
DB_USER=bigodinnn1_user
DB_PASSWORD=sua_senha_db
DB_NAME=bigodinnn1_db

# Redis (Cache)
REDIS_URL=redis://localhost:6379/0

# Email (SMTP)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=seu_email@gmail.com
MAIL_PASSWORD=sua_senha_app
MAIL_DEFAULT_SENDER=noreply@bigodinnn1.com

# OAuth - Google
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret

# OAuth - Discord
DISCORD_CLIENT_ID=seu_discord_client_id
DISCORD_CLIENT_SECRET=seu_discord_client_secret

# Twitch API
TWITCH_CLIENT_ID=seu_twitch_client_id
TWITCH_CLIENT_SECRET=seu_twitch_client_secret
TWITCH_CHANNEL=bigodinnn1

# Configurações de Upload
MAX_CONTENT_LENGTH=16777216  # 16MB
UPLOAD_FOLDER=static_uploads


🔐 Configuração OAuth

Google OAuth

1.
Acesse Google Cloud Console

2.
Crie um projeto ou selecione existente

3.
Habilite a Google+ API

4.
Vá em Credenciais → Criar Credenciais → ID do cliente OAuth 2.0

5.
Configure:

•
Tipo: Aplicação da Web

•
URIs de redirecionamento: http://localhost:5000/api/auth/google/callback



6.
Copie Client ID e Client Secret para o .env

Discord OAuth

1.
Acesse Discord Developer Portal

2.
Clique em New Application

3.
Vá em OAuth2 → General

4.
Configure:

•
Redirects: http://localhost:5000/api/auth/discord/callback



5.
Copie Client ID e Client Secret para o .env

Twitch API

1.
Acesse Twitch Developers

2.
Registre uma nova aplicação

3.
Configure:

•
OAuth Redirect URLs: http://localhost:5000/api/auth/twitch/callback



4.
Copie Client ID e Client Secret para o .env

