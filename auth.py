from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import secrets

# Assuming models are in src.models.models
from src.models.models import db, User, Session as UserSession # Renamed to avoid conflict with flask.session
from src.decorators import login_required # Assuming you have this decorator

auth_bp = Blueprint("auth_bp", __name__)

SESSION_DURATION_HOURS = 24

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "Missing username, email, or password"}), 400

    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        return jsonify({"error": "User already exists"}), 409

    new_user = User(username=username, email=email)
    new_user.set_password(password) # Uses the method from the User model
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User registered successfully", "user_id": new_user.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email") # Or username, depending on login preference
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    # Create a session token
    session_token = secrets.token_hex(32)
    expires_at = datetime.utcnow() + timedelta(hours=SESSION_DURATION_HOURS)
    ip_address = request.remote_addr
    user_agent = request.user_agent.string

    new_session = UserSession(
        user_id=user.id,
        token=session_token,
        expires_at=expires_at,
        ip_address=ip_address,
        user_agent=user_agent
    )
    try:
        db.session.add(new_session)
        db.session.commit()
        
        session["user_id"] = user.id
        session["session_token"] = session_token

        return jsonify({
            "message": "Login successful", 
            "session_token": session_token, 
            "user_id": user.id,
            "username": user.username,
            "role": user.role
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout(current_user_id):
    session_token = request.headers.get("Authorization")
    if session_token:
        session_token = session_token.replace("Bearer ", "", 1)
        user_session = UserSession.query.filter_by(token=session_token, user_id=current_user_id).first()
        if user_session:
            try:
                db.session.delete(user_session)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"Error deleting session from DB: {e}")
    
    session.pop("user_id", None)
    session.pop("session_token", None)
    return jsonify({"message": "Logout successful"}), 200

@auth_bp.route("/check_session", methods=["GET"])
def check_session():
    session_token = request.headers.get("Authorization")
    if not session_token:
        return jsonify({"authenticated": False, "error": "No session token provided"}), 401
    
    session_token = session_token.replace("Bearer ", "", 1)
    
    user_session = UserSession.query.filter_by(token=session_token).first()
    
    if user_session and user_session.expires_at > datetime.utcnow():
        user = User.query.get(user_session.user_id)
        if user:
            return jsonify({
                "authenticated": True, 
                "user_id": user.id, 
                "username": user.username,
                "role": user.role,
                "profile_picture_url": user.profile_picture_url
            }), 200
    
    return jsonify({"authenticated": False, "error": "Invalid or expired session"}), 401

@auth_bp.route("/change-password", methods=["POST"])
@login_required
def change_password(current_user_id):
    data = request.get_json()
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    confirm_new_password = data.get("confirm_new_password")

    if not current_password or not new_password or not confirm_new_password:
        return jsonify({"error": "Todos os campos são obrigatórios."}), 400

    if new_password != confirm_new_password:
        return jsonify({"error": "A nova senha e a confirmação não coincidem."}), 400
    
    if len(new_password) < 8:
        return jsonify({"error": "A nova senha deve ter pelo menos 8 caracteres."}), 400

    user = User.query.get(current_user_id)
    if not user:
        # This case should ideally not happen if @login_required works correctly
        return jsonify({"error": "Utilizador não encontrado."}), 404

    if not user.check_password(current_password):
        return jsonify({"error": "A senha atual está incorreta."}), 403

    user.set_password(new_password)
    try:
        db.session.commit()
        return jsonify({"message": "Senha alterada com sucesso."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao alterar a senha: {str(e)}"}), 500

