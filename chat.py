from flask import Blueprint, request, jsonify
from datetime import datetime

from src.models.models import db, ChatMessage, User # Assuming ChatMessage model is defined
from src.routes.profile import get_current_user # Re-use helper to get current user

chat_bp = Blueprint("chat_bp", __name__)

# Post a new chat message
@chat_bp.route("/send", methods=["POST"])
def send_chat_message():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    content = data.get("content")

    if not content:
        return jsonify({"error": "Message content cannot be empty"}), 400
    
    if len(content) > 500: # Example limit
        return jsonify({"error": "Message content is too long (max 500 characters)"}), 400

    new_message = ChatMessage(
        user_id=current_user.id,
        content=content
    )

    try:
        db.session.add(new_message)
        db.session.commit()
        # For a real-time chat, you would typically broadcast this message via WebSockets.
        # For a simple polled chat, returning the message is fine.
        return jsonify({"message": "Message sent successfully", "chat_message": new_message.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Get chat messages (e.g., latest N messages or paginated)
@chat_bp.route("/messages", methods=["GET"])
def get_chat_messages():
    # For simplicity, let's get the last 50 messages. 
    # In a real app, you might have rooms, pagination, or messages after a certain timestamp.
    limit = request.args.get("limit", 50, type=int)
    if limit > 200: # Max limit
        limit = 200

    messages = ChatMessage.query.order_by(ChatMessage.created_at.desc()).limit(limit).all()
    # Messages are fetched in descending order (newest first), reverse for chronological display
    messages_data = [message.to_dict() for message in reversed(messages)] 
    
    return jsonify({"messages": messages_data}), 200

# Potentially, a route to get messages after a certain ID or timestamp for polling updates
@chat_bp.route("/messages/since/<int:last_message_id>", methods=["GET"])
def get_chat_messages_since(last_message_id):
    messages = ChatMessage.query.filter(ChatMessage.id > last_message_id).order_by(ChatMessage.created_at.asc()).all()
    messages_data = [message.to_dict() for message in messages]
    return jsonify({"messages": messages_data}), 200

