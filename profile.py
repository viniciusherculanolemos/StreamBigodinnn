from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import secrets
import os
from flask_mail import Message # Import Message

# Import db and mail instance from the main app module or where they are initialized
# Assuming mail is initialized in main.py and can be imported
from src.main import mail # Import mail instance
from src.models.models import db, User, UserProfile, PasswordResetToken

profile_bp = Blueprint("profile_bp", __name__)

# Helper function to get current logged-in user from session token
def get_current_user():
    session_token = request.headers.get("Authorization")
    if not session_token:
        return None
    session_token = session_token.replace("Bearer ", "", 1)
    
    from src.models.models import Session as UserSession 
    user_session = UserSession.query.filter_by(token=session_token).first()
    
    if user_session and user_session.expires_at > datetime.utcnow():
        return User.query.get(user_session.user_id)
    return None

@profile_bp.route("/me", methods=["GET"])
def get_my_profile():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
    
    return jsonify(current_user.to_dict(include_profile=True, include_association=True)), 200

@profile_bp.route("/update", methods=["PUT"])
def update_my_profile():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if "username" in data and data["username"] != current_user.username:
        if User.query.filter_by(username=data["username"]).first():
            return jsonify({"error": "Username already taken"}), 409
        current_user.username = data["username"]
    
    # Email change is typically more complex, often requiring verification. For now, allow if not taken.
    if "email" in data and data["email"] != current_user.email:
        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"error": "Email already taken"}), 409
        current_user.email = data["email"]

    user_profile = current_user.profile
    if not user_profile:
        user_profile = UserProfile(user_id=current_user.id)
        db.session.add(user_profile)

    user_profile.display_name = data.get("display_name", user_profile.display_name)
    user_profile.bio = data.get("bio", user_profile.bio)
    # Add other UserProfile fields as needed
    
    current_user.updated_at = datetime.utcnow()

    try:
        db.session.commit()
        return jsonify({"message": "Profile updated successfully", "user": current_user.to_dict(include_profile=True)}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating profile: {str(e)}")
        return jsonify({"error": "Failed to update profile"}), 500

@profile_bp.route("/change_password", methods=["POST"])
def change_password():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    old_password = data.get("current_password") # Frontend sends current_password
    new_password = data.get("new_password")

    if not old_password or not new_password:
        return jsonify({"error": "Old and new passwords are required"}), 400

    if not current_user.check_password(old_password):
        return jsonify({"error": "Invalid old password"}), 403
    
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters long"}), 400

    current_user.set_password(new_password)
    current_user.updated_at = datetime.utcnow()

    try:
        db.session.commit()
        return jsonify({"message": "Password changed successfully"}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error changing password: {str(e)}")
        return jsonify({"error": "Failed to change password"}), 500

@profile_bp.route("/forgot_password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        # Still return a generic success message to prevent user enumeration
        return jsonify({"message": "If your email is registered, you will receive a password reset link."}), 200

    token_value = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1) # Token valid for 1 hour
    
    PasswordResetToken.query.filter_by(user_id=user.id, used=False).update({"used": True})

    new_token = PasswordResetToken(user_id=user.id, token=token_value, expires_at=expires_at)
    db.session.add(new_token)
    try:
        db.session.commit()
        
        # Construct the reset URL
        # Ensure FRONTEND_BASE_URL is configured in app.config (e.g., from environment variable)
        frontend_base_url = current_app.config.get("FRONTEND_BASE_URL", "http://localhost:8000") # Default if not set
        reset_url = f"{frontend_base_url}/reset-password.html?token={token_value}"
        
        # Send email
        msg_title = "Redefinição de Senha - BigodiNNN1"
        sender = current_app.config.get("MAIL_DEFAULT_SENDER", "noreply@example.com")
        msg = Message(msg_title, sender=sender, recipients=[email])
        msg.body = f"Olá {user.username},\n\nPara redefinir a sua senha, clique no link abaixo:\n{reset_url}\n\nSe você não solicitou uma redefinição de senha, por favor, ignore este email.\nEste link expirará em 1 hora.\n\nObrigado,\nA Equipa BigodiNNN1"
        
        mail.send(msg)
        current_app.logger.info(f"Password reset email sent to {email} (token: {token_value})")
        return jsonify({"message": "If your email is registered, you will receive a password reset link."}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in forgot_password for {email}: {str(e)}")
        # Still return a generic message to the user for security, but log the error
        return jsonify({"message": "If your email is registered, you will receive a password reset link (error occurred internally)."}), 200

@profile_bp.route("/reset_password", methods=["POST"])
def reset_password():
    data = request.get_json()
    token_value = data.get("token")
    new_password = data.get("new_password")

    if not token_value or not new_password:
        return jsonify({"error": "Token and new password are required"}), 400

    token_entry = PasswordResetToken.query.filter_by(token=token_value, used=False).first()

    if not token_entry or token_entry.expires_at < datetime.utcnow():
        # Invalidate the token if it's found but expired, to prevent reuse attempts
        if token_entry:
            token_entry.used = True
            db.session.commit()
        return jsonify({"error": "Invalid or expired token"}), 400

    user = User.query.get(token_entry.user_id)
    if not user:
        # This case should ideally not be reached if DB is consistent
        token_entry.used = True # Invalidate token anyway
        db.session.commit()
        return jsonify({"error": "User not found for this token"}), 404 

    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters long"}), 400

    user.set_password(new_password)
    user.updated_at = datetime.utcnow()
    token_entry.used = True

    try:
        db.session.commit()
        return jsonify({"message": "Password reset successfully"}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error resetting password for token {token_value}: {str(e)}")
        return jsonify({"error": "Failed to reset password"}), 500

UPLOAD_FOLDER_REL = os.path.join("static_uploads", "profile_pics")
UPLOAD_FOLDER_ABS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", UPLOAD_FOLDER_REL)
os.makedirs(UPLOAD_FOLDER_ABS, exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@profile_bp.route("/upload_profile_picture", methods=["POST"])
def upload_profile_picture():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401

    if "profile_picture" not in request.files: # Match the key used in perfil.js
        return jsonify({"error": "No file part"}), 400
    file = request.files["profile_picture"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        # Sanitize filename if necessary, or use a generated one
        filename = secrets.token_hex(8) + "_" + os.path.basename(file.filename) 
        filepath = os.path.join(UPLOAD_FOLDER_ABS, filename)
        try:
            file.save(filepath)
            # The URL should be relative to the static path served by Flask or a CDN path
            profile_picture_url = f"/{UPLOAD_FOLDER_REL}/{filename}" 
            
            user_profile = current_user.profile
            if not user_profile:
                user_profile = UserProfile(user_id=current_user.id)
                db.session.add(user_profile)
            user_profile.profile_picture_url = profile_picture_url
            current_user.updated_at = datetime.utcnow()
            
            db.session.commit()
            return jsonify({"message": "Profile picture uploaded successfully", "file_url": profile_picture_url}), 200
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error uploading profile picture: {str(e)}")
            return jsonify({"error": "Failed to upload profile picture"}), 500
    else:
        return jsonify({"error": "File type not allowed"}), 400

