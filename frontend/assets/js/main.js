// Configurações
const TWITCH_CHANNEL = 'bigodinnn1';
const CLIENT_ID = 'jzkbprff40iqj646a697cyrvl0zt2m'; // Client ID público da Twitch para testes
const DONATION_GOAL = 2500; // Meta de doação em R$
const DONATION_DEADLINE = new Date('2025-06-01'); // Prazo da meta

// Variáveis globais
let isLiveStreaming = false;
let streamData = null;
let currentUser = null;
let chatMessages = [];
let donationAmount = 0; // Valor atual de doações (simulado)

// Inicialização quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes
    initTwitchAPI();
    initDonationProgress();
    initChatSystem();
    
    // Adicionar listeners de eventos
    document.getElementById('send-message').addEventListener('click', sendChatMessage);
    document.getElementById('chat-message').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
});

// Inicializar API da Twitch
function initTwitchAPI() {
    // Verificar status da transmissão
    checkStreamStatus();
    
    // Verificar novamente a cada 60 segundos
    setInterval(checkStreamStatus, 60000);
}

// Verificar status da transmissão na Twitch
function checkStreamStatus() {
    // Simulação de verificação de status (em produção, usar a API real da Twitch)
    // Em um ambiente real, você usaria fetch para acessar a API da Twitch
    
    // Simulação para demonstração
    simulateStreamStatus();
}

// Simulação de status da transmissão (para demonstração)
function simulateStreamStatus() {
    // Em produção, substituir por chamada real à API da Twitch
    const statusElement = document.getElementById('stream-status');
    const twitchEmbedElement = document.getElementById('twitch-embed');
    const offlineVideoElement = document.getElementById('offline-video');
    
    // Verificar se o horário atual está dentro do horário de programação
    const now = new Date();
    const day = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    const hour = now.getHours();
    
    // Simular transmissão ao vivo com base no horário de programação
    let shouldBeLive = false;
    
    if (day >= 1 && day <= 5) { // Segunda a Sexta
        shouldBeLive = (hour >= 14 && hour < 18);
    } else if (day === 6) { // Sábado
        shouldBeLive = (hour >= 16 && hour < 22);
    } else if (day === 0) { // Domingo
        shouldBeLive = (hour >= 14 && hour < 20);
    }
    
    // Para fins de demonstração, alternar entre online e offline
    // Em produção, usar o resultado real da API da Twitch
    isLiveStreaming = shouldBeLive;
    
    if (isLiveStreaming) {
        // Stream está online
        statusElement.textContent = '🔴 AO VIVO';
        statusElement.style.color = '#ff3399';
        
        // Mostrar embed da Twitch
        twitchEmbedElement.style.display = 'block';
        offlineVideoElement.style.display = 'none';
        
        // Inicializar o embed da Twitch
        new Twitch.Embed("twitch-embed", {
            width: '100%',
            height: '100%',
            channel: TWITCH_CHANNEL,
            layout: 'video',
            autoplay: true,
            parent: ["localhost", "127.0.0.1"] // Adicionar domínios permitidos
        });
        
        document.getElementById('stream-title').textContent = 'BigodiNNN1 - AO VIVO';
    } else {
        // Stream está offline
        statusElement.textContent = '⚫ OFFLINE - Voltamos em breve!';
        statusElement.style.color = '#aaaaaa';
        
        // Mostrar vídeo offline
        twitchEmbedElement.style.display = 'none';
        offlineVideoElement.style.display = 'block';
        
        // Iniciar vídeo offline
        const introVideo = document.getElementById('intro-video');
        introVideo.play().catch(error => {
            console.log('Reprodução automática bloqueada pelo navegador. Clique no vídeo para iniciar.');
        });
        
        document.getElementById('stream-title').textContent = 'BigodiNNN1 - Offline';
    }
}

// Inicializar progresso de doação
function initDonationProgress() {
    // Simular valor atual de doações (em produção, buscar do banco de dados)
    donationAmount = Math.floor(Math.random() * 1500); // Valor entre 0 e 1500 para demonstração
    
    updateDonationProgress();
    
    // Atualizar a cada 5 minutos (simulando novas doações)
    setInterval(() => {
        // Simular novas doações aleatórias
        if (Math.random() > 0.7) { // 30% de chance de receber uma doação
            donationAmount += Math.floor(Math.random() * 50) + 10; // Doação entre 10 e 60
            updateDonationProgress();
            showNotification(`Nova doação recebida! Obrigado pelo apoio!`);
        }
    }, 300000); // 5 minutos
}

// Atualizar barra de progresso de doação
function updateDonationProgress() {
    const progressBar = document.getElementById('donation-progress');
    const percentage = Math.min(100, Math.floor((donationAmount / DONATION_GOAL) * 100));
    
    progressBar.style.width = `${percentage}%`;
    progressBar.textContent = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
}

// Inicializar sistema de chat
function initChatSystem() {
    // Em produção, conectar ao backend real de chat (Socket.io, Firebase, etc.)
    
    // Simular mensagens de chat para demonstração
    simulateChatMessages();
}

// Simular mensagens de chat (para demonstração)
function simulateChatMessages() {
    const users = [
        { name: 'GameMaster2000', isAssociate: true, isAdmin: false },
        { name: 'StreamFan123', isAssociate: false, isAdmin: false },
        { name: 'BigodiNNN', isAssociate: false, isAdmin: true },
        { name: 'ProGamer555', isAssociate: true, isAdmin: false },
        { name: 'CasualViewer42', isAssociate: false, isAdmin: false }
    ];
    
    const messages = [
        'Oi pessoal! Tudo bem?',
        'Quando começa a próxima live?',
        'Esse jogo está incrível!',
        'Alguém vai participar do próximo sorteio?',
        'Acabei de me tornar associado!',
        'Quem mais está assistindo do celular?',
        'Vamos chegar aos 2000 seguidores hoje!',
        'Qual será o próximo jogo da stream?',
        'Já deixei minha doação para ajudar a bater a meta!',
        'Bora compartilhar a live galera!'
    ];
    
    // Adicionar algumas mensagens iniciais
    for (let i = 0; i < 3; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        addChatMessage(randomUser.name, randomMessage, randomUser.isAssociate, randomUser.isAdmin);
    }
    
    // Continuar adicionando mensagens aleatórias
    setInterval(() => {
        if (chatMessages.length > 50) {
            // Limitar o número de mensagens para evitar sobrecarga
            chatMessages = chatMessages.slice(-50);
            updateChatDisplay();
        }
        
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        addChatMessage(randomUser.name, randomMessage, randomUser.isAssociate, randomUser.isAdmin);
    }, 8000); // Nova mensagem a cada 8 segundos
}

// Adicionar mensagem ao chat
function addChatMessage(username, message, isAssociate = false, isAdmin = false) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    chatMessages.push({
        username,
        message,
        timestamp,
        isAssociate,
        isAdmin
    });
    
    updateChatDisplay();
}

// Atualizar exibição do chat
function updateChatDisplay() {
    const chatMessagesElement = document.getElementById('chat-messages');
    
    // Limpar mensagens de boas-vindas se houver mensagens reais
    if (chatMessages.length > 0) {
        chatMessagesElement.innerHTML = '';
    }
    
    // Adicionar todas as mensagens
    chatMessages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${msg.isAssociate ? 'associate' : ''} ${msg.isAdmin ? 'admin' : ''}`;
        
        let badgeHTML = '';
        if (msg.isAdmin) {
            badgeHTML = '<span class="badge-admin">ADMIN</span>';
        } else if (msg.isAssociate) {
            badgeHTML = '<span class="badge-associate">ASSOCIADO</span>';
        }
        
        messageElement.innerHTML = `
            <span class="username">${msg.username}</span>${badgeHTML}:
            <span class="message-text">${msg.message}</span>
            <span class="timestamp">${msg.timestamp}</span>
        `;
        
        chatMessagesElement.appendChild(messageElement);
    });
    
    // Rolar para a mensagem mais recente
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
}

// Enviar mensagem de chat
function sendChatMessage() {
    const messageInput = document.getElementById('chat-message');
    const message = messageInput.value.trim();
    
    if (message && currentUser) {
        addChatMessage(currentUser.username, message, currentUser.isAssociate, currentUser.isAdmin);
        messageInput.value = '';
    } else {
        // Se não estiver logado, mostrar prompt de login
        showNotification('Faça login para participar do chat!');
    }
}

// Mostrar notificação
function showNotification(message) {
    // Verificar se já existe uma notificação
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        // Criar elemento de notificação
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Definir mensagem e mostrar
    notification.textContent = message;
    notification.classList.add('show');
    
    // Esconder após 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Função para simular login (para demonstração)
function simulateLogin(username, isAssociate = false, isAdmin = false) {
    currentUser = {
        username,
        isAssociate,
        isAdmin
    };
    
    // Habilitar input de chat
    document.getElementById('chat-message').disabled = false;
    document.getElementById('send-message').disabled = false;
    
    // Esconder prompt de login
    document.querySelector('.chat-login-prompt').style.display = 'none';
    
    showNotification(`Bem-vindo, ${username}!`);
}

// Função para simular logout (para demonstração)
function simulateLogout() {
    currentUser = null;
    
    // Desabilitar input de chat
    document.getElementById('chat-message').disabled = true;
    document.getElementById('send-message').disabled = true;
    
    // Mostrar prompt de login
    document.querySelector('.chat-login-prompt').style.display = 'block';
    
    showNotification('Você saiu do chat.');
}
