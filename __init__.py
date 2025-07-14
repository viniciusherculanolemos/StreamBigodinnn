import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app(config=None):
    app = Flask(__name__)
    
    # Configuração padrão
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Configuração do MySQL
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 
        'mysql+pymysql://u133320153_bigodinnn:SuaSenha@localhost/u133320153_bigodinnn_site')
    
    # Configuração de upload de arquivos
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads')
    
    # Sobrescrever com configurações personalizadas
    if config:
        app.config.update(config)
    
    # Inicializar extensões
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Garantir que os diretórios de upload existam
    with app.app_context():
        os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'news'), exist_ok=True)
    
    # Registrar blueprints
    from src.routes.news import news_bp
    app.register_blueprint(news_bp, url_prefix='/api/news')
    
    # Outros blueprints
    from src.routes.auth import auth_bp
    from src.routes.user import user_bp
    from src.routes.profile import profile_bp
    from src.routes.associates import associates_bp
    from src.routes.clips import clips_bp
    from src.routes.chat import chat_bp
    from src.routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(associates_bp, url_prefix='/api/associates')
    app.register_blueprint(clips_bp, url_prefix='/api/clips')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    return app
