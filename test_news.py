import pytest
import json
import os
from src import create_app
from src.models.models import db, User, Associate, News

@pytest.fixture
def app():
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SECRET_KEY': 'test-key'
    })
    
    with app.app_context():
        db.create_all()
        
        # Criar usuário comum para testes
        common_user = User(
            username='usuario_comum',
            email='comum@teste.com',
            role='user'
        )
        common_user.set_password('senha123')
        
        # Criar usuário associado para testes
        associate_user = User(
            username='usuario_associado',
            email='associado@teste.com',
            role='fino',
            associated_since='2023-01-01'
        )
        associate_user.set_password('senha123')
        
        # Criar associação
        association = Associate(
            user_id=2,  # ID do usuário associado
            tier='fino',
            is_active=True
        )
        
        db.session.add(common_user)
        db.session.add(associate_user)
        db.session.add(association)
        db.session.commit()
        
    yield app
    
    with app.app_context():
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def login_user(client, username, password):
    response = client.post('/api/auth/login', json={
        'username': username,
        'password': password
    })
    return json.loads(response.data)['token']

def test_common_user_create_news_without_image(client, app):
    # Login como usuário comum
    token = login_user(client, 'usuario_comum', 'senha123')
    
    # Criar notícia sem imagem
    response = client.post(
        '/api/news/create',
        json={
            'title': 'Notícia de Teste',
            'content': 'Conteúdo da notícia de teste',
            'category': 'Geral'
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['success'] == True
    assert data['article']['title'] == 'Notícia de Teste'
    assert data['article']['image_url'] is None
    
    # Verificar se a notícia foi salva no banco
    with app.app_context():
        news = News.query.filter_by(title='Notícia de Teste').first()
        assert news is not None
        assert news.status == 'pending_approval'

def test_common_user_cannot_create_news_with_image(client):
    # Login como usuário comum
    token = login_user(client, 'usuario_comum', 'senha123')
    
    # Tentar criar notícia com imagem
    response = client.post(
        '/api/news/create',
        json={
            'title': 'Notícia com Imagem',
            'content': 'Conteúdo da notícia com imagem',
            'category': 'Geral',
            'image_url': '/static/uploads/test.jpg'
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Apenas associados' in data['error']

def test_associate_user_create_news_with_image(client, app):
    # Login como usuário associado
    token = login_user(client, 'usuario_associado', 'senha123')
    
    # Criar notícia com imagem
    response = client.post(
        '/api/news/create',
        json={
            'title': 'Notícia de Associado',
            'content': 'Conteúdo da notícia de associado',
            'category': 'Eventos',
            'image_url': '/static/uploads/test.jpg'
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['success'] == True
    assert data['article']['title'] == 'Notícia de Associado'
    assert data['article']['image_url'] == '/static/uploads/test.jpg'
    
    # Verificar se a notícia foi salva no banco
    with app.app_context():
        news = News.query.filter_by(title='Notícia de Associado').first()
        assert news is not None
        assert news.status == 'pending_approval'
        assert news.image_url == '/static/uploads/test.jpg'

def test_get_news_list(client, app):
    # Adicionar algumas notícias aprovadas
    with app.app_context():
        news1 = News(
            title='Notícia Aprovada 1',
            content='Conteúdo da notícia 1',
            author_id=1,
            status='approved'
        )
        news2 = News(
            title='Notícia Aprovada 2',
            content='Conteúdo da notícia 2',
            author_id=2,
            status='approved'
        )
        news3 = News(
            title='Notícia Pendente',
            content='Conteúdo da notícia pendente',
            author_id=1,
            status='pending_approval'
        )
        
        db.session.add(news1)
        db.session.add(news2)
        db.session.add(news3)
        db.session.commit()
    
    # Obter lista de notícias (apenas aprovadas devem aparecer)
    response = client.get('/api/news/list')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['articles']) == 2
    assert data['total_articles'] == 2
    
    # Verificar se a notícia pendente não está na lista
    titles = [article['title'] for article in data['articles']]
    assert 'Notícia Aprovada 1' in titles
    assert 'Notícia Aprovada 2' in titles
    assert 'Notícia Pendente' not in titles

def test_admin_approve_news(client, app):
    # Adicionar notícia pendente
    with app.app_context():
        news = News(
            title='Notícia Para Aprovar',
            content='Conteúdo da notícia para aprovar',
            author_id=1,
            status='pending_approval'
        )
        
        # Criar usuário admin
        admin_user = User(
            username='admin',
            email='admin@teste.com',
            role='admin'
        )
        admin_user.set_password('admin123')
        
        db.session.add(news)
        db.session.add(admin_user)
        db.session.commit()
        
        news_id = news.id
    
    # Login como admin
    token = login_user(client, 'admin', 'admin123')
    
    # Aprovar notícia
    response = client.put(
        f'/api/news/admin/{news_id}/approve',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] == True
    assert data['article']['status'] == 'approved'
    
    # Verificar se a notícia foi aprovada no banco
    with app.app_context():
        news = News.query.get(news_id)
        assert news.status == 'approved'

def test_user_my_news(client, app):
    # Login como usuário comum
    token = login_user(client, 'usuario_comum', 'senha123')
    
    # Adicionar algumas notícias para o usuário
    with app.app_context():
        user = User.query.filter_by(username='usuario_comum').first()
        
        news1 = News(
            title='Minha Notícia 1',
            content='Conteúdo da minha notícia 1',
            author_id=user.id,
            status='approved'
        )
        news2 = News(
            title='Minha Notícia 2',
            content='Conteúdo da minha notícia 2',
            author_id=user.id,
            status='pending_approval'
        )
        
        db.session.add(news1)
        db.session.add(news2)
        db.session.commit()
    
    # Obter minhas notícias (deve incluir aprovadas e pendentes)
    response = client.get(
        '/api/news/my-news',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['articles']) == 2
    assert data['total_articles'] == 2
    
    # Verificar se ambas as notícias estão na lista
    titles = [article['title'] for article in data['articles']]
    assert 'Minha Notícia 1' in titles
    assert 'Minha Notícia 2' in titles
