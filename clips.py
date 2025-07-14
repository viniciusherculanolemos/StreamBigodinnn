from flask import Blueprint, request, jsonify
from datetime import datetime

from src.models.models import db, Clip, User # Assuming Clip model is defined
from src.routes.profile import get_current_user # Re-use helper to get current user

clips_bp = Blueprint("clips_bp", __name__)

# Submit a new Clip
@clips_bp.route("/submit", methods=["POST"])
def submit_clip():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    title = data.get("title")
    clip_url = data.get("clip_url")
    thumbnail_url = data.get("thumbnail_url") # Optional

    if not title or not clip_url:
        return jsonify({"error": "Title and clip URL are required"}), 400
    
    # Basic validation for clip_url (e.g., check if it's a valid URL format)
    if not clip_url.startswith("http://") and not clip_url.startswith("https://"):
        return jsonify({"error": "Invalid clip URL format"}), 400

    # Check if clip_url already exists to prevent duplicates
    if Clip.query.filter_by(clip_url=clip_url).first():
        return jsonify({"error": "This clip URL has already been submitted"}), 409

    new_clip = Clip(
        title=title,
        clip_url=clip_url,
        submitted_by_user_id=current_user.id,
        thumbnail_url=thumbnail_url
    )

    try:
        db.session.add(new_clip)
        db.session.commit()
        return jsonify({"message": "Clip submitted successfully", "clip": new_clip.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Get All Clips (Paginated)
@clips_bp.route("/", methods=["GET"])
@clips_bp.route("/list", methods=["GET"])
def get_all_clips():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    
    # Order by creation date, newest first
    clips_pagination = Clip.query.order_by(Clip.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    clips = [clip.to_dict() for clip in clips_pagination.items]
    
    return jsonify({
        "clips": clips,
        "total_pages": clips_pagination.pages,
        "current_page": clips_pagination.page,
        "total_clips": clips_pagination.total
    }), 200

# Get Single Clip by ID
@clips_bp.route("/<int:clip_id>", methods=["GET"])
def get_clip(clip_id):
    clip = Clip.query.get(clip_id)
    if not clip:
        return jsonify({"error": "Clip not found"}), 404
    return jsonify(clip.to_dict()), 200

# Delete Clip (e.g., by submitter or admin)
@clips_bp.route("/<int:clip_id>/delete", methods=["DELETE"])
def delete_clip(clip_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401

    clip = Clip.query.get(clip_id)
    if not clip:
        return jsonify({"error": "Clip not found"}), 404

    # Authorization: Only submitter or admin can delete
    if clip.submitted_by_user_id != current_user.id and current_user.role != "admin":
        return jsonify({"error": "Forbidden: You do not have permission to delete this clip"}), 403

    try:
        db.session.delete(clip)
        db.session.commit()
        return jsonify({"message": "Clip deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Update Clip (e.g., title or thumbnail by submitter or admin)
@clips_bp.route("/<int:clip_id>/update", methods=["PUT"])
def update_clip(clip_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401

    clip = Clip.query.get(clip_id)
    if not clip:
        return jsonify({"error": "Clip not found"}), 404

    # Authorization: Only submitter or admin can update
    if clip.submitted_by_user_id != current_user.id and current_user.role != "admin":
        return jsonify({"error": "Forbidden: You do not have permission to update this clip"}), 403

    data = request.get_json()
    clip.title = data.get("title", clip.title)
    clip.thumbnail_url = data.get("thumbnail_url", clip.thumbnail_url)
    # clip_url is usually not updatable as it defines the clip itself

    try:
        db.session.commit()
        return jsonify({"message": "Clip updated successfully", "clip": clip.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

