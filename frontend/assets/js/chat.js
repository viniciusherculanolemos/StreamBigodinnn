// JavaScript para o sistema de chat exclusivo com integração ao backend

const API_BASE_URL = "http://localhost:5000/api";
const CHAT_REFRESH_INTERVAL = 5000; // Intervalo de atualização do chat em ms
const MAX_MESSAGES_DISPLAY = 50; // Número máximo de mensagens a manter na exibição

let currentUser = null;
let lastMessageTimestamp = null;

document.addEventListener("DOMContentLoaded", function() {
    loadCurrentUser();
    initChatSystem();
    setupEventListeners();
    addChatStyles(); // Adicionar estilos específicos do chat
});

function loadCurrentUser() {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    }
}

async function initChatSystem() {
    if (!currentUser) {
        const chatInput = document.getElementById("chat-input");
        const sendButton = document.getElementById("chat-send-btn");
        if (chatInput) chatInput.placeholder = "Faça login para enviar mensagens";
        if (chatInput) chatInput.disabled = true;
        if (sendButton) sendButton.disabled = true;
    }
    await fetchAndDisplayMessages(true); // Fetch inicial
    setInterval(fetchAndDisplayMessages, CHAT_REFRESH_INTERVAL);
    initEmojiPicker();
}

async function fetchAndDisplayMessages(isInitialLoad = false) {
    try {
        let url = `${API_BASE_URL}/chat/messages`;
        if (!isInitialLoad && lastMessageTimestamp) {
            url += `?since=${lastMessageTimestamp}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Erro ao buscar mensagens do chat:", response.statusText);
            return;
        }
        const messages = await response.json();
        if (messages.length > 0) {
            const chatMessagesElement = document.getElementById("chat-messages");
            if (isInitialLoad && chatMessagesElement) {
                 // Limpar mensagens de boas-vindas apenas no carregamento inicial se houver mensagens reais
                const welcomeMessage = chatMessagesElement.querySelector(".system-message");
                const botMessage = chatMessagesElement.querySelector(".bot-message");
                chatMessagesElement.innerHTML = ""; // Limpa tudo
                if(welcomeMessage) chatMessagesElement.appendChild(welcomeMessage); // Readiciona se necessário
                if(botMessage) chatMessagesElement.appendChild(botMessage); // Readiciona se necessário
            }
            messages.forEach(msg => addMessageToDOM(msg, chatMessagesElement));
            if (chatMessagesElement) {
                chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
                // Limitar o número de mensagens no DOM
                while (chatMessagesElement.children.length > MAX_MESSAGES_DISPLAY + 2) { // +2 para system/bot messages
                    if (!chatMessagesElement.firstChild.classList.contains("system-message") && !chatMessagesElement.firstChild.classList.contains("bot-message")){
                         chatMessagesElement.removeChild(chatMessagesElement.firstChild);
                    }
                   
                }
            }
            // Atualiza o timestamp da última mensagem recebida para polling incremental
            lastMessageTimestamp = messages[messages.length - 1].timestamp;
        }
    } catch (error) {
        console.error("Erro ao conectar ao servidor de chat:", error);
    }
}

function addMessageToDOM(msg, container) {
    if (!container) container = document.getElementById("chat-messages");
    if (!container) return;

    const messageElement = document.createElement("div");
    messageElement.className = "chat-message";
    if (msg.user_id === currentUser?.id) {
        messageElement.classList.add("current-user");
    }

    let badgeHTML = "";
    if (msg.user_role === "admin") {
        badgeHTML = `<span class="chat-message-badge admin">ADMIN</span>`;
    } else if (msg.user_role === "moderator") { // Adicionado para o papel de moderador
        badgeHTML = `<span class="chat-message-badge moderator-badge">MOD</span>`;
    } else if (msg.user_associate_level) {
        let badgeClass = "associate-" + msg.user_associate_level;
        badgeHTML = `<span class="chat-message-badge ${badgeClass}">${msg.user_associate_level.toUpperCase()}</span>`;
    }

    const profilePicUrl = msg.user_profile_picture_url 
        ? (msg.user_profile_picture_url.startsWith("http") ? msg.user_profile_picture_url : `${API_BASE_URL.replace("/api","")}${msg.user_profile_picture_url}`)
        : "assets/images/default-avatar.png";

    messageElement.innerHTML = `
        <img src="${profilePicUrl}" alt="${msg.username}" class="chat-message-avatar">
        <div class="chat-message-content">
            <div class="chat-message-header">
                <span class="chat-message-username" style="color: ${getUserColor(msg.username)};">${msg.username}</span>
                ${badgeHTML}
                <span class="chat-message-time">${new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div class="chat-message-text"></div>
        </div>
    `;
    messageElement.querySelector(".chat-message-text").textContent = msg.message_text; // Set textContent to prevent XSS

    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
    const messageInput = document.getElementById("chat-input");
    if (!messageInput || !currentUser) return;

    const messageText = messageInput.value.trim();
    if (!messageText) return;

    const token = localStorage.getItem("session_token") || sessionStorage.getItem("session_token");
    if (!token) {
        showNotification("Sessão expirada. Faça login novamente para enviar mensagens.", "danger");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/chat/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ message_text: messageText })
        });
        if (response.ok) {
            messageInput.value = "";
            // A mensagem será exibida na próxima atualização do fetchAndDisplayMessages
            // ou podemos adicionar localmente para feedback imediato e depois reconciliar
            // addMessageToDOM({ username: currentUser.username, message_text: messageText, timestamp: new Date().toISOString(), user_id: currentUser.id, user_role: currentUser.role, user_associate_level: currentUser.associate_level, user_profile_picture_url: currentUser.profile_picture_url });
            await fetchAndDisplayMessages(); // Força atualização imediata
        } else {
            const errorData = await response.json();
            showNotification(errorData.error || "Erro ao enviar mensagem.", "danger");
        }
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        showNotification("Erro de conexão ao enviar mensagem.", "danger");
    }
}

function initEmojiPicker() {
    const emojiButton = document.getElementById("chat-emoji-btn");
    const emojiPickerElement = document.getElementById("chat-emoji-picker");
    const emojiGrid = document.getElementById("chat-emoji-grid");
    const messageInput = document.getElementById("chat-input");

    if (!emojiButton || !emojiPickerElement || !emojiGrid || !messageInput) return;

    const popularEmojis = [
        "😀", "😂", "😍", "🤔", "😎", "👍", "👏", "🎮", "🔥", "❤️",
        "😭", "🤣", "😊", "🙌", "👀", "💪", "🎯", "🏆", "💯", "🤩",
        "🎉", "🥳", "🌟", "✨", "🎈", "🎁", "🤞", "🙏", "👋", "👌"
    ];

    popularEmojis.forEach(emoji => {
        const emojiItem = document.createElement("span");
        emojiItem.className = "chat-emoji-item";
        emojiItem.textContent = emoji;
        emojiItem.addEventListener("click", () => {
            messageInput.value += emoji;
            messageInput.focus();
            emojiPickerElement.style.display = "none";
        });
        emojiGrid.appendChild(emojiItem);
    });

    emojiButton.addEventListener("click", (event) => {
        event.stopPropagation();
        emojiPickerElement.style.display = emojiPickerElement.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (event) => {
        if (!emojiPickerElement.contains(event.target) && event.target !== emojiButton && !emojiButton.contains(event.target)) {
            emojiPickerElement.style.display = "none";
        }
    });
}

function setupEventListeners() {
    const sendButton = document.getElementById("chat-send-btn");
    if (sendButton) {
        sendButton.addEventListener("click", sendChatMessage);
    }

    const messageInput = document.getElementById("chat-input");
    if (messageInput) {
        messageInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
    
    const chatRefreshBtn = document.getElementById("chat-refresh-btn");
    if(chatRefreshBtn){
        chatRefreshBtn.addEventListener("click", () => fetchAndDisplayMessages(true));
    }
}

// Função para gerar cores consistentes para nomes de utilizador (simples hash)
function getUserColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - color.length) + color;
}

// Reutilizar showNotification de login.js ou perfil.js se estiver global
// Se não, definir aqui ou garantir que um dos scripts seja carregado primeiro.
// Assumindo que showNotification está disponível globalmente (ex: de login.js)

function addChatStyles() {
    const styleId = "chat-specific-styles";
    if (document.getElementById(styleId)) return;

    const styleSheet = document.createElement("style");
    styleSheet.id = styleId;
    styleSheet.textContent = `
        .chat-message.current-user .chat-message-content {
            background-color: #3a3a3a; /* Cor de fundo para mensagens do utilizador atual */
            align-self: flex-end;
        }
        .chat-message.current-user {
            display: flex;
            justify-content: flex-end;
        }
        .chat-message-avatar {
            width: 30px; height: 30px; border-radius: 50%; margin-right: 8px; margin-left: 5px;
        }
        .chat-message.current-user .chat-message-avatar {
            order: 2; margin-right: 0; margin-left: 8px;
        }
        .chat-message.current-user .chat-message-header {
            text-align: right;
        }
        .chat-message-badge.admin { background-color: #dc3545; color: white; padding: 2px 5px; border-radius: 3px; font-size: 0.7em; margin-left: 5px; }
        .chat-message-badge.moderator-badge { background-color: #007bff; color: white; padding: 2px 5px; border-radius: 3px; font-size: 0.7em; margin-left: 5px; } /* Estilo para moderador */
        .chat-message-badge.associate-fino { background-color: #0dcaf0; color: black; padding: 2px 5px; border-radius: 3px; font-size: 0.7em; margin-left: 5px; }
        .chat-message-badge.associate-raiz { background-color: #198754; color: white; padding: 2px 5px; border-radius: 3px; font-size: 0.7em; margin-left: 5px; }
        .chat-message-badge.associate-grosso { background-color: #ffc107; color: black; padding: 2px 5px; border-radius: 3px; font-size: 0.7em; margin-left: 5px; }
        .chat-emoji-picker { display: none; position: absolute; bottom: 50px; right: 10px; background: #2c2c2c; border: 1px solid #444; border-radius: 5px; padding: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.5); z-index:100; }
        .chat-emoji-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; }
        .chat-emoji-item { cursor: pointer; padding: 5px; text-align: center; font-size: 1.2em; border-radius: 3px; }
        .chat-emoji-item:hover { background-color: #444; }
    `;
    document.head.appendChild(styleSheet);
}


