# backend/src/routes/twitch_status.py
import os
import requests
from flask import Blueprint, jsonify, current_app

twitch_status_bp = Blueprint("twitch_status_bp", __name__)

# É ALTAMENTE RECOMENDADO que estas credenciais sejam geridas através de variáveis de ambiente em produção.
# Por agora, vamos usá-las diretamente, mas isto DEVE ser alterado antes de ir para produção.
TWITCH_CLIENT_ID = "s4zt9em5esm8226kacu1a8vc2irh87" # Fornecido pelo utilizador
TWITCH_CLIENT_SECRET = "m3u7hfx0hi8qz7zsqvmqi23mdpxw72" # Fornecido pelo utilizador
TWITCH_CHANNEL_LOGIN = "bigodinnn1"

# Variável para armazenar o token de acesso e o seu tempo de expiração
# Em produção, considere um mecanismo de cache mais robusto (ex: Redis)
app_access_token = None

def get_twitch_access_token():
    """Obtém um token de acesso da Twitch usando Client Credentials Grant Flow."""
    global app_access_token
    # Se já tivermos um token válido, podemos reutilizá-lo (a API da Twitch não fornece tempo de expiração para este fluxo diretamente na resposta, mas os tokens são de longa duração)
    # Para simplificar, vamos obter um novo token a cada vez, mas em produção, deve-se armazenar e reutilizar até expirar.

    token_url = "https://id.twitch.tv/oauth2/token"
    payload = {
        "client_id": TWITCH_CLIENT_ID,
        "client_secret": TWITCH_CLIENT_SECRET,
        "grant_type": "client_credentials"
    }
    try:
        response = requests.post(token_url, data=payload)
        response.raise_for_status() # Levanta um erro para respostas HTTP 4xx/5xx
        token_data = response.json()
        app_access_token = token_data.get("access_token")
        if not app_access_token:
            current_app.logger.error("Falha ao obter o access_token da Twitch: 'access_token' não encontrado na resposta.")
            return None
        current_app.logger.info("Token de acesso da Twitch obtido com sucesso.")
        return app_access_token
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Erro ao solicitar token de acesso da Twitch: {e}")
        if hasattr(e, 'response') and e.response is not None:
            current_app.logger.error(f"Resposta da Twitch: {e.response.status_code} - {e.response.text}")
        return None

@twitch_status_bp.route("/api/twitch/status")
def get_stream_status():
    """Endpoint para verificar o estado da transmissão de um canal da Twitch."""
    global app_access_token

    if not app_access_token:
        app_access_token = get_twitch_access_token()
        if not app_access_token:
            return jsonify({"error": "Falha ao autenticar com a Twitch"}), 500

    stream_url = f"https://api.twitch.tv/helix/streams?user_login={TWITCH_CHANNEL_LOGIN}"
    headers = {
        "Client-ID": TWITCH_CLIENT_ID,
        "Authorization": f"Bearer {app_access_token}"
    }

    try:
        response = requests.get(stream_url, headers=headers)
        response.raise_for_status()
        stream_data = response.json()

        if stream_data.get("data") and len(stream_data["data"]) > 0:
            # Stream está online
            stream_info = stream_data["data"][0]
            return jsonify({
                "is_live": True,
                "viewer_count": stream_info.get("viewer_count"),
                "title": stream_info.get("title"),
                "game_name": stream_info.get("game_name"),
                "started_at": stream_info.get("started_at")
            })
        else:
            # Stream está offline
            return jsonify({"is_live": False})

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401: # Token expirado ou inválido
            current_app.logger.warning("Token de acesso da Twitch expirado ou inválido. A obter um novo token.")
            app_access_token = get_twitch_access_token() # Tenta obter um novo token
            if not app_access_token:
                 return jsonify({"error": "Falha ao reautenticar com a Twitch"}), 500
            # Tenta novamente a chamada original com o novo token
            return get_stream_status() 
        current_app.logger.error(f"Erro HTTP ao verificar o estado da stream: {e}")
        current_app.logger.error(f"Resposta da Twitch: {e.response.status_code} - {e.response.text}")
        return jsonify({"error": f"Erro ao comunicar com a API da Twitch: {e.response.status_code}"}), e.response.status_code
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Erro de rede ao verificar o estado da stream: {e}")
        return jsonify({"error": "Erro de rede ao comunicar com a API da Twitch"}), 500
    except Exception as e:
        current_app.logger.error(f"Erro inesperado ao verificar o estado da stream: {e}")
        return jsonify({"error": "Erro inesperado no servidor"}), 500

