import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_news_image(file):
    """
    Salva uma imagem de notícia e retorna a URL
    """
    if not file or not allowed_file(file.filename):
        return None
        
    # Verificar tamanho do arquivo
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    
    if file_size > MAX_IMAGE_SIZE:
        return None
        
    # Gerar nome de arquivo seguro e único
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    
    # Garantir que o diretório existe
    upload_folder = os.path.join(current_app.static_folder, 'uploads', 'news')
    os.makedirs(upload_folder, exist_ok=True)
    
    # Salvar o arquivo
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)
    
    # Retornar URL relativa para o arquivo
    return f"/static/uploads/news/{unique_filename}"
