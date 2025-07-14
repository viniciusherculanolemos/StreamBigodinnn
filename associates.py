from flask import Blueprint, request, jsonify
from datetime import datetime

from src.models.models import db, User, Associate # Assuming Associate model is defined
from src.routes.profile import get_current_user # Re-use helper to get current user

associates_bp = Blueprint("associates_bp", __name__)

@associates_bp.route("/status", methods=["GET"])
def get_association_status():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401

    association = current_user.association
    if association and association.is_active:
        return jsonify({
            "is_associated": True,
            "tier": association.tier,
            "subscription_date": association.subscription_date.isoformat() if association.subscription_date else None,
            "expiration_date": association.expiration_date.isoformat() if association.expiration_date else None
        }), 200
    else:
        return jsonify({"is_associated": False}), 200

# Admin route to manage associations (example)
@associates_bp.route("/<int:user_id>/update", methods=["POST"])
def update_user_association(user_id):
    admin_user = get_current_user()
    # Simple role check - in a real app, this would be more robust
    if not admin_user or admin_user.role != "admin":
        return jsonify({"error": "Forbidden: Admin access required"}), 403

    user_to_update = User.query.get(user_id)
    if not user_to_update:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    tier = data.get("tier") # e.g., "fino", "medio", "grosso"
    is_active = data.get("is_active", True)
    # expiration_date_str = data.get("expiration_date") # e.g., "YYYY-MM-DD HH:MM:SS"

    if not tier:
        return jsonify({"error": "Tier is required"}), 400

    association = user_to_update.association
    if not association:
        association = Associate(user_id=user_to_update.id)
        db.session.add(association)
    
    association.tier = tier
    association.is_active = is_active
    # if expiration_date_str:
    #     association.expiration_date = datetime.strptime(expiration_date_str, "%Y-%m-%d %H:%M:%S")
    # else:
    #     association.expiration_date = None # Or set a default
    if is_active and not association.subscription_date:
        association.subscription_date = datetime.utcnow()
    if not is_active:
        user_to_update.associated_since = None # Clear if no longer active
    elif not user_to_update.associated_since: # Set if becoming active and not set
        user_to_update.associated_since = datetime.utcnow()

    try:
        db.session.commit()
        return jsonify({"message": f"User {user_to_update.username}\\'s association updated successfully."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Route to get user badge information (based on role/association)
@associates_bp.route("/<int:user_id>/badge", methods=["GET"])
def get_user_badge(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    badge_info = {"name": "common", "color": "#888888"} # Default badge

    if user.role == "admin":
        badge_info = {"name": "Admin", "icon": "fas fa-shield-alt", "color": "#FFD700"} # Gold-like for admin
    elif user.association and user.association.is_active:
        tier = user.association.tier.lower()
        if tier == "fino":
            badge_info = {"name": "Fino", "icon": "fas fa-gem", "color": "#ADD8E6"} # Light Blue
        elif tier == "raiz":
            badge_info = {"name": "Raiz", "icon": "fas fa-leaf", "color": "#90EE90"} # Light Green
        elif tier == "grosso":
            badge_info = {"name": "Grosso", "icon": "fas fa-star", "color": "#FFB6C1"} # Light Pink
        # Add more tiers if needed, colors should match the logo as requested
    
    return jsonify(badge_info), 200

