import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS # Import CORS
from flask_mail import Mail # Import Mail
import sqlite3
import pymysql # Importação para MySQL

# Carregando variáveis de ambiente (se disponível)
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("Variáveis de ambiente carregadas do arquivo .env")
except ImportError:
    print("python-dotenv não instalado. Variáveis de ambiente devem ser configuradas manualmente.")

# Assuming models are in src.models.models
from src.models.models import db # Import db from models.py

# Import Blueprints
from src.routes.auth import auth_bp
from src.routes.profile import profile_bp
from src.routes.associates import associates_bp
from src.routes.news import news_bp
from src.routes.clips import clips_bp
from src.routes.chat import chat_bp
from src.routes.twitch_status import twitch_status_bp
from src.routes.admin import admin_bp # Import the new admin blueprint

# Initialize Flask app
frontend_static_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "frontend")

app = Flask(__name__, static_folder=frontend_static_folder, static_url_path="")
app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY", "dev_secret_key_!@#$2024_bigodinnn")
if os.environ.get("FLASK_ENV") == "production":
    CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "https://www.bigodinnn1.com"}} )
else:
    CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "*"}})


# Configuração do banco de dados - MySQL para produção, SQLite para desenvolvimento
if os.environ.get("FLASK_ENV") == "production":
    # Configuração para MySQL em produção
    DB_USER = os.environ.get("DB_USER", "u133320153_vinicius")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "Bigodetricolor121")  # Substitua pela senha real
    DB_HOST = os.environ.get("DB_HOST", "localhost")
    DB_NAME = os.environ.get("DB_NAME", "u133320153_bigodinnn_site")
    
    # String de conexão MySQL
    app.config["SQLALCHEMY_DATABASE_URI"] = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
    print(f"Configurado para usar MySQL: {DB_NAME} em {DB_HOST}")
else:
    # Manter SQLite para desenvolvimento
    DATABASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "database", "site.db")
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DATABASE_PATH}"
    print(f"Configurado para usar SQLite: {DATABASE_PATH}")

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = os.path.join(app.root_path, "static_uploads", "profile_pics")
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# Flask-Mail configuration from environment variables
app.config["MAIL_SERVER"] = os.environ.get("MAIL_SERVER", "smtp.example.com")
app.config["MAIL_PORT"] = int(os.environ.get("MAIL_PORT", 587))
app.config["MAIL_USE_TLS"] = os.environ.get("MAIL_USE_TLS", "true").lower() in ["true", "1", "t"]
app.config["MAIL_USE_SSL"] = os.environ.get("MAIL_USE_SSL", "false").lower() in ["true", "1", "t"]
app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME", "your-email@example.com")
app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD", "your-email-password")
app.config["MAIL_DEFAULT_SENDER"] = os.environ.get("MAIL_DEFAULT_SENDER", ("BigodiNNN1 Site", "noreply@bigodinnn1.com"))
app.config["MAIL_SUPPRESS_SEND"] = os.environ.get("FLASK_ENV") == "development" # Suppress emails in dev if needed, or use a testing config

mail = Mail(app) # Initialize Mail

db.init_app(app)

def execute_sql_scripts(db_path, migrations_folder):
    # Função adaptada para funcionar com SQLite ou MySQL dependendo do ambiente
    if os.environ.get("FLASK_ENV") == "production":
        # Para MySQL, usamos a conexão via SQLAlchemy
        print(f"Executando scripts de migração MySQL de: {migrations_folder}")
        
        script_files = [
            "0001_initial.sql",
            "0002_create_news_table.sql",
            "0003_create_chat_messages_table.sql",
            "0005_add_profile_picture_url_to_users.sql",
            "0006_add_associated_since_to_users.sql",
            "0007_create_clips_table.sql",
            "0008_add_moderation_fields_to_user.sql", 
            "0009_add_status_to_news_clips.sql"
        ]
        
        # Usando SQLAlchemy para executar scripts SQL
        from sqlalchemy import text
        
        for script_file_name in script_files:
            script_file_path = os.path.join(migrations_folder, script_file_name)
            if os.path.exists(script_file_path):
                print(f"Executando: {script_file_name}")
                with open(script_file_path, "r") as f:
                    sql_script = f.read()
                    # Adaptar sintaxe SQLite para MySQL
                    sql_script = sql_script.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "INTEGER PRIMARY KEY AUTO_INCREMENT")
                    
                    # Dividir o script em comandos individuais
                    commands = sql_script.split(';')
                    
                    for command in commands:
                        if command.strip():
                            try:
                                db.session.execute(text(command))
                                db.session.commit()
                            except Exception as e:
                                print(f"Erro ao executar comando: {e}")
                                db.session.rollback()
                
                print(f"Script {script_file_name} processado.")
            else:
                print(f"Script de migração não encontrado: {script_file_path}")
    else:
        # Para SQLite, mantemos o código original
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        print(f"Executing SQL migration scripts from: {migrations_folder}")
        
        script_files = [
            "0001_initial.sql",
            "0002_create_news_table.sql",
            "0003_create_chat_messages_table.sql",
            "0005_add_profile_picture_url_to_users.sql",
            "0006_add_associated_since_to_users.sql",
            "0007_create_clips_table.sql",
            "0008_add_moderation_fields_to_user.sql", 
            "0009_add_status_to_news_clips.sql"
        ]
        
        for script_file_name in script_files:
            script_file_path = os.path.join(migrations_folder, script_file_name)
            if os.path.exists(script_file_path):
                print(f"Executing: {script_file_name}")
                with open(script_file_path, "r") as f:
                    sql_script = f.read()
                    try:
                        cursor.executescript(sql_script)
                        print(f"Successfully processed {script_file_name} (individual statements might have been skipped or errored if redundant).")
                    except sqlite3.Error as e:
                        print(f"Error processing {script_file_name}: {e}. Some statements might not have been applied.")
            else:
                print(f"Migration script not found (this is okay if it's an old or optional script): {script_file_path}")
                
        conn.commit()
        conn.close()
        print("Finished attempting to execute SQL migration scripts.")

with app.app_context():
    migrations_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "migrations_analysis", "migrations")
    
    if os.environ.get("FLASK_ENV") == "production":
        # Para MySQL, criamos as tabelas com SQLAlchemy
        print("Ambiente de produção detectado. Criando tabelas no MySQL...")
        try:
            db.create_all()
            print("Tabelas criadas com sucesso no MySQL.")
        except Exception as e:
            print(f"Erro ao criar tabelas no MySQL: {e}")
        
        # Executar scripts SQL adicionais
        print("Executando scripts SQL adicionais...")
        execute_sql_scripts(None, migrations_dir)
    else:
        # Para SQLite, mantemos o código original
        is_new_db = not os.path.exists(DATABASE_PATH) or os.path.getsize(DATABASE_PATH) == 0
        
        if is_new_db:
            print(f"Database not found or empty at {DATABASE_PATH}. Initializing schema with db.create_all()...")
            db.create_all()
            print("Schema created with db.create_all(). All tables and columns from models should now exist.")
        else:
            print(f"Database already exists at {DATABASE_PATH}.")
        
        print("Attempting to run SQL migration scripts for any additional changes or data seeding...")
        execute_sql_scripts(DATABASE_PATH, migrations_dir)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(profile_bp, url_prefix="/api/profile")
app.register_blueprint(associates_bp, url_prefix="/api/associates")
app.register_blueprint(news_bp, url_prefix="/api/news")
app.register_blueprint(clips_bp, url_prefix="/api/clips")
app.register_blueprint(chat_bp, url_prefix="/api/chat")
app.register_blueprint(twitch_status_bp) 
app.register_blueprint(admin_bp, url_prefix="/api/admin")

@app.route("/api/hello")
def hello():
    return jsonify(message="Hello from Flask Backend!")

@app.route("/static_uploads/profile_pics/<filename>")
def uploaded_profile_pic(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

if __name__ == "__main__":
    print(f"Serving static files from: {app.static_folder}")
    print(f"Database connection: {'MySQL' if os.environ.get('FLASK_ENV') == 'production' else 'SQLite'}")
    print(f"Profile pictures will be served from /static_uploads/profile_pics/ and stored in {app.config['UPLOAD_FOLDER']}")
    print("Flask-Mail Configuration:")
    print(f"  MAIL_SERVER: {app.config['MAIL_SERVER']}")
    print(f"  MAIL_PORT: {app.config['MAIL_PORT']}")
    print(f"  MAIL_USE_TLS: {app.config['MAIL_USE_TLS']}")
    print(f"  MAIL_USE_SSL: {app.config['MAIL_USE_SSL']}")
    print(f"  MAIL_USERNAME: {app.config['MAIL_USERNAME']}")
    print(f"  MAIL_DEFAULT_SENDER: {app.config['MAIL_DEFAULT_SENDER']}")
    app.run(host="0.0.0.0", port=5000, debug=os.environ.get("FLASK_ENV") != "production")
