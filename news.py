from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from werkzeug.utils import secure_filename

from src.models.models import db, News, User
from src.routes.profile import get_current_user
from src.utils.file_handler import save_news_image

news_bp = Blueprint("news_bp", __name__)

# Função para verificar se o usuário é associado
def is_associate(user):
    """
    Verifica se o usuário é um associado ativo
    """
    if not user:
        return False
        
    # Verificar se o usuário tem role de associado
    if user.role in ['fino', 'raiz', 'grosso', 'admin']:
        return True
        
    # Verificar se o usuário tem uma associação ativa
    if hasattr(user, 'association') and user.association:
        return user.association.is_active
        
    return False

# Create News Article
@news_bp.route("/create", methods=["POST"])
def create_news_article():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Verificar se é uma requisição multipart/form-data ou JSON
    if request.content_type and 'multipart/form-data' in request.content_type:
        # Processar formulário multipart
        title = request.form.get("title")
        content = request.form.get("content")
        category = request.form.get("category", "Geral")
        
        # Processar imagem apenas se o usuário for associado
        image_url = None
        if 'image' in request.files and is_associate(current_user):
            image_file = request.files['image']
            image_url = save_news_image(image_file)
        elif 'image' in request.files:
            # Usuário comum tentando enviar imagem
            return jsonify({"error": "Apenas associados podem enviar notícias com imagens"}), 403
    else:
        # Processar JSON
        data = request.get_json()
        title = data.get("title")
        content = data.get("content")
        category = data.get("category", "Geral")
        image_url = data.get("image_url") if is_associate(current_user) else None
        
        if data.get("image_url") and not is_associate(current_user):
            return jsonify({"error": "Apenas associados podem enviar notícias com imagens"}), 403

    if not title or not content:
        return jsonify({"error": "Título e conteúdo são obrigatórios"}), 400

    new_article = News(
        title=title,
        content=content,
        author_id=current_user.id,
        image_url=image_url,
        status="pending_approval"  # Todas as notícias começam como pendentes
    )

    try:
        db.session.add(new_article)
        db.session.commit()
        return jsonify({
            "message": "Notícia criada com sucesso e aguardando aprovação", 
            "article": new_article.to_dict(),
            "success": True
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "success": False}), 500

# Get All News Articles (Paginated)
@news_bp.route("/", methods=["GET"])
@news_bp.route("/list", methods=["GET"])
def get_all_news_articles():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    category = request.args.get("category")
    
    query = News.query.filter_by(status="approved")
    
    if category:
        query = query.filter_by(category=category)
    
    articles_pagination = query.order_by(News.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    articles = [article.to_dict() for article in articles_pagination.items]
    
    return jsonify({
        "articles": articles,
        "total_pages": articles_pagination.pages,
        "current_page": articles_pagination.page,
        "total_articles": articles_pagination.total
    }), 200

# Get Single News Article by ID
@news_bp.route("/<int:article_id>", methods=["GET"])
def get_news_article(article_id):
    article = News.query.get(article_id)
    if not article:
        return jsonify({"error": "Article not found"}), 404
    
    # Verificar se o artigo está aprovado ou se o usuário é o autor ou admin
    current_user = get_current_user()
    if article.status != "approved" and (not current_user or (current_user.id != article.author_id and current_user.role != "admin")):
        return jsonify({"error": "Article not available"}), 403
        
    return jsonify(article.to_dict()), 200

# Update News Article
@news_bp.route("/<int:article_id>/update", methods=["PUT"])
def update_news_article(article_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401

    article = News.query.get(article_id)
    if not article:
        return jsonify({"error": "Article not found"}), 404

    # Authorization: Only author or admin can update
    if article.author_id != current_user.id and current_user.role != "admin":
        return jsonify({"error": "Forbidden: You do not have permission to update this article"}), 403

    # Verificar se é uma requisição multipart/form-data ou JSON
    if request.content_type and 'multipart/form-data' in request.content_type:
        # Processar formulário multipart
        title = request.form.get("title", article.title)
        content = request.form.get("content", article.content)
        category = request.form.get("category", article.category if hasattr(article, 'category') else "Geral")
        
        # Processar imagem apenas se o usuário for associado
        if 'image' in request.files and is_associate(current_user):
            image_file = request.files['image']
            image_url = save_news_image(image_file)
            if image_url:
                article.image_url = image_url
        elif 'image' in request.files:
            # Usuário comum tentando enviar imagem
            return jsonify({"error": "Apenas associados podem enviar notícias com imagens"}), 403
    else:
        # Processar JSON
        data = request.get_json()
        title = data.get("title", article.title)
        content = data.get("content", article.content)
        category = data.get("category", article.category if hasattr(article, 'category') else "Geral")
        
        if data.get("image_url") and not is_associate(current_user):
            return jsonify({"error": "Apenas associados podem enviar notícias com imagens"}), 403
        elif data.get("image_url"):
            article.image_url = data.get("image_url")

    article.title = title
    article.content = content
    if hasattr(article, 'category'):
        article.category = category
    article.updated_at = datetime.utcnow()
    article.status = "pending_approval"  # Volta para aprovação após edição

    try:
        db.session.commit()
        return jsonify({
            "message": "Notícia atualizada com sucesso e aguardando aprovação", 
            "article": article.to_dict(),
            "success": True
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "success": False}), 500

# Delete News Article
@news_bp.route("/<int:article_id>/delete", methods=["DELETE"])
def delete_news_article(article_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401

    article = News.query.get(article_id)
    if not article:
        return jsonify({"error": "Article not found"}), 404

    # Authorization: Only author or admin can delete
    if article.author_id != current_user.id and current_user.role != "admin":
        return jsonify({"error": "Forbidden: You do not have permission to delete this article"}), 403

    try:
        db.session.delete(article)
        db.session.commit()
        return jsonify({"message": "Article deleted successfully", "success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "success": False}), 500

# Admin: Get Pending News Articles
@news_bp.route("/admin/pending", methods=["GET"])
def get_pending_news_articles():
    current_user = get_current_user()
    if not current_user or current_user.role != "admin":
        return jsonify({"error": "Forbidden: Admin access required"}), 403
        
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    
    articles_pagination = News.query.filter_by(status="pending_approval").order_by(News.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    articles = [article.to_dict() for article in articles_pagination.items]
    
    return jsonify({
        "articles": articles,
        "total_pages": articles_pagination.pages,
        "current_page": articles_pagination.page,
        "total_articles": articles_pagination.total
    }), 200

# Admin: Approve News Article
@news_bp.route("/admin/<int:article_id>/approve", methods=["PUT"])
def approve_news_article(article_id):
    current_user = get_current_user()
    if not current_user or current_user.role != "admin":
        return jsonify({"error": "Forbidden: Admin access required"}), 403
        
    article = News.query.get(article_id)
    if not article:
        return jsonify({"error": "Article not found"}), 404
        
    article.status = "approved"
    
    try:
        db.session.commit()
        return jsonify({
            "message": "Notícia aprovada com sucesso", 
            "article": article.to_dict(),
            "success": True
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "success": False}), 500

# Admin: Reject News Article
@news_bp.route("/admin/<int:article_id>/reject", methods=["PUT"])
def reject_news_article(article_id):
    current_user = get_current_user()
    if not current_user or current_user.role != "admin":
        return jsonify({"error": "Forbidden: Admin access required"}), 403
        
    article = News.query.get(article_id)
    if not article:
        return jsonify({"error": "Article not found"}), 404
        
    article.status = "rejected"
    
    try:
        db.session.commit()
        return jsonify({
            "message": "Notícia rejeitada", 
            "article": article.to_dict(),
            "success": True
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "success": False}), 500

# Get User's News Articles
@news_bp.route("/my-news", methods=["GET"])
def get_user_news_articles():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Unauthorized"}), 401
        
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    
    articles_pagination = News.query.filter_by(author_id=current_user.id).order_by(News.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    articles = [article.to_dict() for article in articles_pagination.items]
    
    return jsonify({
        "articles": articles,
        "total_pages": articles_pagination.pages,
        "current_page": articles_pagination.page,
        "total_articles": articles_pagination.total
    }), 200
