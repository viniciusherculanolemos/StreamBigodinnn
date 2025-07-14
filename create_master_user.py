# backend/src/create_master_user.py
import os
import sys
from datetime import datetime

# Adjust sys.path to include the 'backend' directory, so 'src' is a package
# __file__ is backend/src/create_master_user.py
# os.path.dirname(__file__) is backend/src/
# os.path.join(os.path.dirname(__file__), "..") is backend/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.main import app, db # Import app and db from src.main
from src.models.models import User # Import User model from src.models.models
from src.generate_password import generate_secure_password # Import from src.generate_password

MASTER_USERNAME = "BigodiNNN"
MASTER_EMAIL = "vinicius.herculano.lemos@gmail.com"
MASTER_ROLE = "admin" # Using the existing 'admin' role for master permissions

def create_master_user_if_not_exists():
    """Creates the master user if they don't already exist."""
    # app and db are imported from src.main where db.init_app(app) is called.
    # The app_context is essential for database operations outside of a Flask request.
    with app.app_context():
        # Check if the user already exists by username
        existing_user_by_username = User.query.filter_by(username=MASTER_USERNAME).first()
        
        # Check if the user already exists by email
        existing_user_by_email = User.query.filter_by(email=MASTER_EMAIL).first()

        if existing_user_by_username:
            print(f"Utilizador \'{MASTER_USERNAME}\' já existe. Nenhuma ação foi tomada.")
            if existing_user_by_username.email != MASTER_EMAIL:
                print(f"AVISO: O utilizador \'{MASTER_USERNAME}\' existe com um email diferente ({existing_user_by_username.email}).")
            if existing_user_by_username.role != MASTER_ROLE:
                print(f"AVISO: O utilizador \'{MASTER_USERNAME}\' existe com um papel diferente (\'{existing_user_by_username.role}\'). A atualizar para \'{MASTER_ROLE}\'.")
                existing_user_by_username.role = MASTER_ROLE
                db.session.commit()
                print(f"Papel do utilizador \'{MASTER_USERNAME}\' atualizado para \'{MASTER_ROLE}\'.")
            return None # Do not return password if user already exists

        if existing_user_by_email and not existing_user_by_username:
            # This case means the email is taken by someone else, but the target username is free.
            # We should not create the user if the email is already in use by a different account.
            print(f"Email \'{MASTER_EMAIL}\' já está em uso por outro utilizador (\'{existing_user_by_email.username}\'). Nenhuma ação foi tomada para criar \'{MASTER_USERNAME}\'.")
            return None
        
        # Generate a secure password
        password = generate_secure_password()

        # Create the new user object
        master_user = User(
            username=MASTER_USERNAME,
            email=MASTER_EMAIL,
            role=MASTER_ROLE,
            associated_since=datetime.utcnow() # Or None, depending on if master is also an associate
        )
        master_user.set_password(password) # Hash the password

        try:
            db.session.add(master_user)
            db.session.commit()
            print(f"Utilizador Master \'{MASTER_USERNAME}\' criado com sucesso com o papel \'{MASTER_ROLE}\'.")
            print(f"Email: {MASTER_EMAIL}")
            return password
        except Exception as e:
            db.session.rollback()
            print(f"Erro ao criar o Utilizador Master: {e}")
            return None

if __name__ == "__main__":
    # This script is intended to be run from the command line in the backend/src directory.
    # Example: python create_master_user.py
    generated_password = create_master_user_if_not_exists()
    if generated_password:
        print(f"IMPORTANTE: A senha gerada para o utilizador \'{MASTER_USERNAME}\' é: {generated_password}")
        print("Por favor, guarde esta senha num local seguro e envie-a para o streamer.")
    else:
        print("Não foi gerada uma nova senha (o utilizador pode já existir ou ocorreu um erro na criação).")

