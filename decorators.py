from functools import wraps
from flask import jsonify, request
from datetime import datetime

from src.models.models import Session, User # Adicionado User para verificar o papel
from src.routes.profile import get_current_user 

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # get_current_user() já deve estar a lidar com a validação do token de sessão
        # e a devolver o objeto User ou None.
        current_user_obj = get_current_user() 
        if not current_user_obj or current_user_obj.role != "admin": 
            return jsonify({"error": "Forbidden: Administrator access required"}), 403
        return f(*args, **kwargs)
    return decorated_function

def moderator_or_admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_obj = get_current_user()
        if not current_user_obj or current_user_obj.role not in ["admin", "moderator"]:
            return jsonify({"error": "Forbidden: Administrator or Moderator access required"}), 403
        return f(*args, **kwargs)
    return decorated_function

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization token is missing"}), 401
        
        parts = auth_header.split()

        if parts[0].lower() != "bearer" or len(parts) == 1 or len(parts) > 2:
            return jsonify({"error": "Invalid token format. Expected 'Bearer <token>'"}), 401
        
        token = parts[1]
        
        user_session = Session.query.filter_by(token=token).first()
        
        if not user_session:
            return jsonify({"error": "Invalid session token"}), 401
            
        if user_session.expires_at < datetime.utcnow():
            # Opcional: remover sessão expirada do DB
            # from src.models.models import db
            # db.session.delete(user_session)
            # db.session.commit()
            return jsonify({"error": "Session token has expired"}), 401
        
        # Passar o user_id para a função decorada
        # A função get_current_user() dentro das rotas protegidas por login_required
        # irá então buscar o User object com base neste user_id se necessário.
        return f(user_session.user_id, *args, **kwargs) 
    return decorated_function

