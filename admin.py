# backend/src/routes/admin.py
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta

from src.models.models import db, User, News, Clip, ChatMessage
# Updated to import moderator_or_admin_required
from src.decorators import admin_required, moderator_or_admin_required 
from src.routes.profile import get_current_user

admin_bp = Blueprint("admin_bp", __name__)

# --- User Management (Admin Only) ---
@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    users_pagination = User.query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    users_data = [user.to_dict(include_association=True) for user in users_pagination.items]
    return jsonify({
        "users": users_data,
        "total_pages": users_pagination.pages,
        "current_page": users_pagination.page,
        "total_users": users_pagination.total
    }), 200

@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@admin_required
def get_user_details(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict(include_profile=True, include_association=True)), 200

@admin_bp.route("/users/<int:user_id>/update-role", methods=["PUT"])
@admin_required
def update_user_role(user_id):
    user_to_update = User.query.get(user_id)
    if not user_to_update:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    new_role = data.get("role")
    if not new_role or new_role not in ["user", "moderator", "fino", "raiz", "grosso", "admin"]:
        return jsonify({"error": "Invalid role specified. Valid roles are: user, moderator, fino, raiz, grosso, admin"}), 400
    
    current_admin_user = get_current_user()
    if current_admin_user.id == user_to_update.id and user_to_update.role == "admin" and new_role != "admin":
        admins_count = User.query.filter_by(role="admin").count()
        if admins_count <= 1:
            return jsonify({"error": "Cannot remove the last administrator role"}), 403
            
    user_to_update.role = new_role
    user_to_update.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "User role updated successfully", "user": user_to_update.to_dict()}), 200

# --- Chat Moderation (Admin and Moderator) ---
@admin_bp.route("/chat/users/<int:user_id>/mute", methods=["POST"])
@moderator_or_admin_required
def mute_chat_user(user_id):
    user_to_mute = User.query.get(user_id)
    if not user_to_mute:
        return jsonify({"error": "User not found"}), 404
    
    acting_user = get_current_user()
    # Prevent muting admins, or moderators muting other moderators/admins
    if user_to_mute.role == "admin":
        return jsonify({"error": "Administrators cannot be muted"}), 403
    if acting_user.role == "moderator" and user_to_mute.role == "moderator":
        return jsonify({"error": "Moderators cannot mute other moderators"}), 403

    data = request.get_json()
    duration_minutes = data.get("duration_minutes", 60) 
    
    user_to_mute.is_chat_muted = True
    user_to_mute.chat_mute_expires_at = datetime.utcnow() + timedelta(minutes=duration_minutes)
    db.session.commit()
    return jsonify({"message": f"User {user_to_mute.username} muted for {duration_minutes} minutes."}), 200

@admin_bp.route("/chat/users/<int:user_id>/unmute", methods=["POST"])
@moderator_or_admin_required
def unmute_chat_user(user_id):
    user_to_unmute = User.query.get(user_id)
    if not user_to_unmute:
        return jsonify({"error": "User not found"}), 404
    
    user_to_unmute.is_chat_muted = False
    user_to_unmute.chat_mute_expires_at = None
    db.session.commit()
    return jsonify({"message": f"User {user_to_unmute.username} unmuted."}), 200

@admin_bp.route("/chat/users/<int:user_id>/ban", methods=["POST"])
@moderator_or_admin_required
def ban_chat_user(user_id):
    user_to_ban = User.query.get(user_id)
    if not user_to_ban:
        return jsonify({"error": "User not found"}), 404

    acting_user = get_current_user()
    if user_to_ban.role == "admin":
        return jsonify({"error": "Administrators cannot be banned"}), 403
    if acting_user.role == "moderator" and user_to_ban.role == "moderator":
        return jsonify({"error": "Moderators cannot ban other moderators"}), 403
        
    user_to_ban.is_chat_banned = True
    db.session.commit()
    return jsonify({"message": f"User {user_to_ban.username} has been banned from chat."}), 200

@admin_bp.route("/chat/users/<int:user_id>/unban", methods=["POST"])
@moderator_or_admin_required
def unban_chat_user(user_id):
    user_to_unban = User.query.get(user_id)
    if not user_to_unban:
        return jsonify({"error": "User not found"}), 404
    
    user_to_unban.is_chat_banned = False
    db.session.commit()
    return jsonify({"message": f"User {user_to_unban.username} has been unbanned from chat."}), 200

@admin_bp.route("/chat/messages/<int:message_id>/delete", methods=["DELETE"])
@moderator_or_admin_required
def delete_chat_message(message_id):
    message_to_delete = ChatMessage.query.get(message_id)
    if not message_to_delete:
        return jsonify({"error": "Message not found"}), 404
    
    db.session.delete(message_to_delete)
    db.session.commit()
    return jsonify({"message": "Chat message deleted successfully."}), 200

# --- Content Approval (News - Admin and Moderator) ---
@admin_bp.route("/news/pending", methods=["GET"])
@moderator_or_admin_required
def list_pending_news():
    pending_news = News.query.filter_by(status="pending_approval").order_by(News.created_at.desc()).all()
    return jsonify([news.to_dict() for news in pending_news]), 200

@admin_bp.route("/news/<int:news_id>/approve", methods=["POST"])
@moderator_or_admin_required
def approve_news_article(news_id):
    news_article = News.query.get(news_id)
    if not news_article:
        return jsonify({"error": "News article not found"}), 404
    news_article.status = "approved"
    news_article.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "News article approved.", "article": news_article.to_dict()}), 200

@admin_bp.route("/news/<int:news_id>/reject", methods=["POST"])
@moderator_or_admin_required
def reject_news_article(news_id):
    news_article = News.query.get(news_id)
    if not news_article:
        return jsonify({"error": "News article not found"}), 404
    news_article.status = "rejected"
    news_article.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "News article rejected.", "article": news_article.to_dict()}), 200

# --- Content Approval (Clips - Admin and Moderator) ---
@admin_bp.route("/clips/pending", methods=["GET"])
@moderator_or_admin_required
def list_pending_clips():
    pending_clips = Clip.query.filter_by(status="pending_approval").order_by(Clip.created_at.desc()).all()
    return jsonify([clip.to_dict() for clip in pending_clips]), 200

@admin_bp.route("/clips/<int:clip_id>/approve", methods=["POST"])
@moderator_or_admin_required
def approve_clip(clip_id):
    clip = Clip.query.get(clip_id)
    if not clip:
        return jsonify({"error": "Clip not found"}), 404
    clip.status = "approved"
    db.session.commit()
    return jsonify({"message": "Clip approved.", "clip": clip.to_dict()}), 200

@admin_bp.route("/clips/<int:clip_id>/reject", methods=["POST"])
@moderator_or_admin_required
def reject_clip(clip_id):
    clip = Clip.query.get(clip_id)
    if not clip:
        return jsonify({"error": "Clip not found"}), 404
    clip.status = "rejected"
    db.session.commit()
    return jsonify({"message": "Clip rejected.", "clip": clip.to_dict()}), 200

