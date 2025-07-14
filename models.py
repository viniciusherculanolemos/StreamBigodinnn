from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    profile_picture_url = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(20), default='user', nullable=False) # Roles: 'user', 'moderator', 'fino', 'raiz', 'grosso', 'admin'
    associated_since = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_chat_muted = db.Column(db.Boolean, default=False, nullable=False)
    chat_mute_expires_at = db.Column(db.DateTime, nullable=True)
    is_chat_banned = db.Column(db.Boolean, default=False, nullable=False)

    profile = db.relationship('UserProfile', backref='user', uselist=False, cascade="all, delete-orphan")
    association = db.relationship('Associate', backref='user', uselist=False, cascade="all, delete-orphan")
    news_authored = db.relationship('News', backref='author', lazy='dynamic', foreign_keys='News.author_id')
    chat_messages_sent = db.relationship('ChatMessage', backref='sender', lazy='dynamic', foreign_keys='ChatMessage.user_id')
    clips_submitted = db.relationship('Clip', backref='submitter', lazy='dynamic', foreign_keys='Clip.submitted_by_user_id')
    sessions = db.relationship('Session', backref='user', lazy='dynamic', cascade="all, delete-orphan")
    password_reset_tokens = db.relationship('PasswordResetToken', backref='user', lazy='dynamic', cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self, include_profile=False, include_association=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'profile_picture_url': self.profile_picture_url,
            'role': self.role,
            'associated_since': self.associated_since.isoformat() if self.associated_since else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_chat_muted': self.is_chat_muted,
            'chat_mute_expires_at': self.chat_mute_expires_at.isoformat() if self.chat_mute_expires_at else None,
            'is_chat_banned': self.is_chat_banned
        }
        if include_profile and self.profile:
            data['profile'] = self.profile.to_dict()
        if include_association and self.association:
            data['association'] = self.association.to_dict()
        return data

class UserProfile(db.Model):
    __tablename__ = 'user_profiles'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    display_name = db.Column(db.String(100), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    twitch_username = db.Column(db.String(50), nullable=True)
    discord_username = db.Column(db.String(50), nullable=True)
    instagram_username = db.Column(db.String(50), nullable=True)
    is_public = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'display_name': self.display_name,
            'bio': self.bio,
            'twitch_username': self.twitch_username,
            'discord_username': self.discord_username,
            'instagram_username': self.instagram_username,
            'is_public': self.is_public,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class Associate(db.Model):
    __tablename__ = 'associates'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    tier = db.Column(db.String(20), nullable=False) # Tiers: 'fino', 'medio', 'grosso'
    subscription_date = db.Column(db.DateTime, default=datetime.utcnow)
    expiration_date = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'tier': self.tier,
            'subscription_date': self.subscription_date.isoformat() if self.subscription_date else None,
            'expiration_date': self.expiration_date.isoformat() if self.expiration_date else None,
            'is_active': self.is_active
        }

class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(255), nullable=False, unique=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)

class Session(db.Model):
    __tablename__ = 'sessions'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(255), nullable=False, unique=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class News(db.Model):
    __tablename__ = 'news'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = db.Column(db.String(20), default='pending_approval', nullable=False) # 'pending_approval', 'approved', 'rejected'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'author_id': self.author_id,
            'author_username': self.author.username if self.author else None,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'status': self.status
        }

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        user_associate_level = None
        if self.sender and self.sender.association and self.sender.association.is_active:
            user_associate_level = self.sender.association.tier
        elif self.sender and self.sender.role in ['fino', 'raiz', 'grosso']:
            user_associate_level = self.sender.role

        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.sender.username if self.sender else 'Utilizador Desconhecido',
            'message_text': self.content,
            'timestamp': self.created_at.isoformat(),
            'user_role': self.sender.role if self.sender else 'user',
            'user_associate_level': user_associate_level,
            'user_profile_picture_url': self.sender.profile_picture_url if self.sender else None
        }

class Clip(db.Model):
    __tablename__ = 'clips'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(200), nullable=False)
    clip_url = db.Column(db.String(255), nullable=False, unique=True)
    submitted_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    thumbnail_url = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='pending_approval', nullable=False) # 'pending_approval', 'approved', 'rejected'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'clip_url': self.clip_url,
            'submitted_by_user_id': self.submitted_by_user_id,
            'submitter_username': self.submitter.username if self.submitter else None,
            'thumbnail_url': self.thumbnail_url,
            'created_at': self.created_at.isoformat(),
            'status': self.status
        }

def init_app_models(app):
    with app.app_context():
        db.create_all()

