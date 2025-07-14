// JavaScript para o chat-box melhorado com bot de divulgação

// Configurações do chat e do bot
const chatConfig = {
    maxMessages: 100,
    botName: 'BigodiBot',
    botAvatar: 'assets/images/logo.jpg',
    botColor: '#9146FF',
    botInterval: 10, // minutos
    botEnabled: true,
    botMessages: {
        sorteio: [
            "🎁 SORTEIO ATIVO! Estamos sorteando um Gift Card de R$50! Para participar, seja um associado do canal. Mais informações na página de sorteios!",
            "🎮 Quer ganhar um jogo na Steam? Estamos com sorteio ativo para todos os associados! Acesse a página de sorteios para mais detalhes!",
            "🏆 Sorteio especial para associados acontecendo agora! O vencedor será anunciado ao final da live de hoje. Não perca!"
        ],
        redes: [
            "📱 Siga o BigodiNNN1 no Instagram: @bigodinnn1 para ficar por dentro das novidades e bastidores!",
            "🔔 Entre no nosso Discord oficial: discord.gg/HnWa77FA e participe da nossa comunidade!",
            "📺 Se inscreva no canal da Twitch e ative as notificações para não perder nenhuma live!"
        ],
        associados: [
            "⭐ Seja um associado do canal e tenha acesso a conteúdos exclusivos, emotes personalizados e muito mais! Clique em 'Seja Associado' para saber mais.",
            "💎 Associados têm 3x mais chances de ganhar nos sorteios e acesso a streams exclusivas! Torne-se um associado hoje mesmo!",
            "🌟 Conheça os benefícios de ser um associado Bigode Grosso! Acesso VIP ao chat, menções personalizadas e muito mais!"
        ]
    }
};

// Emojis para o seletor
const emojiCategories = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘'],
    people: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲'],
    animals: ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧'],
    food: ['🍔', '🍕', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯', '🥖'],
    activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅'],
    travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺'],
    objects: ['💡', '🔦', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🔨', '⛏️', '⚒️', '🛠️'],
    symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘']
};

// Usuários simulados para o chat
const simulatedUsers = [
    { username: 'GameMaster2000', avatar: 'assets/images/avatar1.jpg', color: '#ff5722', badges: ['sub'] },
    { username: 'StreamFan123', avatar: 'assets/images/avatar2.jpg', color: '#2196f3', badges: [] },
    { username: 'ProGamer555', avatar: 'assets/images/avatar3.jpg', color: '#4caf50', badges: ['sub', 'vip'] },
    { username: 'TwitchViewer42', avatar: 'assets/images/avatar4.jpg', color: '#9c27b0', badges: [] },
    { username: 'BigodinFan', avatar: 'assets/images/avatar5.jpg', color: '#e91e63', badges: ['sub'] },
    { username: 'GamerBR', avatar: 'assets/images/avatar6.jpg', color: '#ff9800', badges: [] },
    { username: 'StreamerWannabe', avatar: 'assets/images/avatar7.jpg', color: '#795548', badges: ['vip'] },
    { username: 'ChatLegend', avatar: 'assets/images/avatar8.jpg', color: '#607d8b', badges: ['sub'] }
];

// Mensagens simuladas para o chat
const simulatedMessages = [
    "Boa tarde, pessoal! Como estão todos hoje?",
    "Alguém sabe quando começa a próxima live?",
    "Esse jogo está incrível! Quero ver mais gameplay",
    "BigodiNNN1 é o melhor streamer, sem dúvidas!",
    "Quem mais está ansioso para o sorteio de hoje?",
    "Acabei de me tornar associado! Muito feliz 😁",
    "Alguém aqui joga Valorant? Me add lá",
    "Essa música de fundo está demais!",
    "Primeira vez assistindo, já virei fã!",
    "Quem vai participar da maratona de 12h?",
    "Bigode, você é muito engraçado cara kkkk",
    "Já deixei meu sub do mês, vale muito a pena!",
    "Quem mais está no Discord do canal?",
    "Esse setup novo ficou incrível!",
    "Alguém sabe qual é o próximo jogo da programação?"
];

// Inicialização quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o chat
    initChat();
    
    // Configurar eventos
    setupChatEvents();
    
    // Iniciar o bot
    if (chatConfig.botEnabled) {
        startChatBot();
    }
    
    // Verificar se o usuário é administrador
    checkAdminAccess();
});

// Inicializar o chat
function initChat() {
    // Verificar se os elementos do chat existem
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Limpar mensagens existentes (exceto as primeiras duas: boas-vindas e bot)
    const existingMessages = chatMessages.querySelectorAll('.chat-message:not(.system-message):not(.bot-message)');
    existingMessages.forEach(message => message.remove());
    
    // Adicionar algumas mensagens simuladas iniciais
    addInitialMessages();
    
    // Inicializar o seletor de emojis
    initEmojiPicker();
}

// Adicionar mensagens iniciais simuladas
function addInitialMessages() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Adicionar 5-10 mensagens simuladas
    const messageCount = Math.floor(Math.random() * 6) + 5;
    
    for (let i = 0; i < messageCount; i++) {
        // Selecionar um usuário aleatório
        const user = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
        
        // Selecionar uma mensagem aleatória
        const messageText = simulatedMessages[Math.floor(Math.random() * simulatedMessages.length)];
        
        // Criar timestamp aleatório nos últimos 10 minutos
        const minutes = Math.floor(Math.random() * 10) + 1;
        const timestamp = `${minutes}m atrás`;
        
        // Adicionar a mensagem ao chat
        addChatMessage(user.username, messageText, timestamp, user.color, user.avatar, user.badges);
    }
    
    // Rolar para o final
    scrollChatToBottom();
}

// Adicionar uma mensagem ao chat
function addChatMessage(username, message, timestamp, color = '#ffffff', avatar = '', badges = [], isBot = false, isSystem = false, isSelf = false) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Criar elemento de mensagem
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message${isBot ? ' bot-message' : ''}${isSystem ? ' system-message' : ''}${isSelf ? ' self-message' : ''}`;
    
    // Conteúdo HTML da mensagem
    let messageHTML = '';
    
    if (!isSystem) {
        // Adicionar avatar
        messageHTML += `<img src="${avatar || 'assets/images/default-avatar.jpg'}" alt="${username}" class="chat-message-avatar">`;
    }
    
    messageHTML += '<div class="chat-message-content">';
    
    if (!isSystem) {
        // Adicionar cabeçalho com nome de usuário, badges e timestamp
        messageHTML += '<div class="chat-message-header">';
        messageHTML += `<span class="chat-message-username" style="color: ${color}">${username}</span>`;
        
        // Adicionar badges
        if (badges && badges.length > 0) {
            badges.forEach(badge => {
                messageHTML += `<span class="chat-message-badge ${badge}">${badge.toUpperCase()}</span>`;
            });
        }
        
        if (isBot) {
            messageHTML += '<span class="chat-message-badge bot">BOT</span>';
        }
        
        messageHTML += `<span class="chat-message-time">${timestamp}</span>`;
        messageHTML += '</div>';
    }
    
    // Adicionar texto da mensagem com emojis processados
    messageHTML += `<div class="chat-message-text">${processMessageText(message)}</div>`;
    messageHTML += '</div>';
    
    messageElement.innerHTML = messageHTML;
    
    // Adicionar ao container de mensagens
    chatMessages.appendChild(messageElement);
    
    // Limitar o número de mensagens
    limitChatMessages();
    
    // Rolar para o final
    scrollChatToBottom();
}

// Processar texto da mensagem (converter emojis, links, etc.)
function processMessageText(text) {
    // Converter códigos de emoji para imagens
    text = text.replace(/:\w+:/g, match => {
        const emojiName = match.substring(1, match.length - 1);
        // Aqui seria implementada a conversão para emojis personalizados
        // Por simplicidade, retornamos o texto original
        return match;
    });
    
    // Converter emojis Unicode para imagens (opcional)
    // Esta é uma implementação simplificada
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    text = text.replace(emojiRegex, match => {
        return `<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="emoji" alt="${match}" title="${match}" style="background-position: ${Math.random() * 100}% ${Math.random() * 100}%;">`;
    });
    
    // Converter URLs em links clicáveis
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    text = text.replace(urlRegex, url => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
    
    return text;
}

// Limitar o número de mensagens no chat
function limitChatMessages() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messages = chatMessages.querySelectorAll('.chat-message');
    if (messages.length > chatConfig.maxMessages) {
        // Remover mensagens mais antigas, preservando as mensagens do sistema
        const messagesToRemove = messages.length - chatConfig.maxMessages;
        for (let i = 0; i < messagesToRemove; i++) {
            const message = messages[i];
            if (!message.classList.contains('system-message')) {
                message.remove();
            }
        }
    }
}

// Rolar o chat para o final
function scrollChatToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Configurar eventos do chat
function setupChatEvents() {
    // Botão de enviar mensagem
    const sendButton = document.getElementById('chat-send-btn');
    if (sendButton) {
        sendButton.addEventListener('click', sendChatMessage);
    }
    
    // Input de mensagem (enviar ao pressionar Enter)
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    // Botão de emoji
    const emojiButton = document.getElementById('chat-emoji-btn');
    if (emojiButton) {
        emojiButton.addEventListener('click', toggleEmojiPicker);
    }
    
    // Botão de atualizar chat
    const refreshButton = document.getElementById('chat-refresh-btn');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            // Limpar todas as mensagens exceto as do sistema
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                const messages = chatMessages.querySelectorAll('.chat-message:not(.system-message)');
                messages.forEach(message => message.remove());
                
                // Adicionar mensagem do bot
                addBotMessage('Olá pessoal! Estou aqui para ajudar e manter vocês informados. Fiquem ligados nos sorteios e novidades!');
                
                // Adicionar novas mensagens simuladas
                addInitialMessages();
            }
        });
    }
    
    // Botões de configuração do bot (para administradores)
    const botTestButton = document.getElementById('bot-test-btn');
    if (botTestButton) {
        botTestButton.addEventListener('click', testBotMessage);
    }
    
    const botSaveButton = document.getElementById('bot-save-btn');
    if (botSaveButton) {
        botSaveButton.addEventListener('click', saveBotSettings);
    }
    
    // Fechar o seletor de emojis ao clicar fora dele
    document.addEventListener('click', function(e) {
        const emojiPicker = document.getElementById('chat-emoji-picker');
        const emojiButton = document.getElementById('chat-emoji-btn');
        
        if (emojiPicker && emojiPicker.classList.contains('show') && 
            !emojiPicker.contains(e.target) && 
            !emojiButton.contains(e.target)) {
            emojiPicker.classList.remove('show');
        }
    });
}

// Enviar mensagem do chat
function sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    if (!chatInput) return;
    
    const message = chatInput.value.trim();
    if (message === '') return;
    
    // Verificar se o usuário está logado
    const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    
    if (userType && username) {
        // Usuário logado
        const isAdmin = userType === 'admin';
        const badges = [];
        
        if (isAdmin) {
            badges.push('admin');
        } else {
            // Simular badges para usuários normais (em produção, isso viria do banco de dados)
            if (Math.random() > 0.7) {
                badges.push('sub');
            }
            if (Math.random() > 0.9) {
                badges.push('vip');
            }
        }
        
        // Adicionar mensagem ao chat
        addChatMessage(
            username,
            message,
            'agora',
            isAdmin ? '#ff3399' : getRandomColor(),
            'assets/images/default-avatar.jpg',
            badges,
            false,
            false,
            true
        );
    } else {
        // Usuário não logado, usar nome aleatório
        const randomUser = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
        
        // Adicionar mensagem ao chat
        addChatMessage(
            randomUser.username,
            message,
            'agora',
            randomUser.color,
            randomUser.avatar,
            randomUser.badges,
            false,
            false,
            true
        );
    }
    
    // Limpar input
    chatInput.value = '';
    
    // Simular resposta após um tempo aleatório
    simulateResponse();
}

// Simular resposta de outro usuário
function simulateResponse() {
    // 50% de chance de gerar uma resposta
    if (Math.random() > 0.5) {
        // Tempo aleatório entre 2 e 8 segundos
        const delay = Math.floor(Math.random() * 6000) + 2000;
        
        setTimeout(() => {
            // Selecionar um usuário aleatório
            const user = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
            
            // Selecionar uma mensagem aleatória
            const messageText = simulatedMessages[Math.floor(Math.random() * simulatedMessages.length)];
            
            // Adicionar a mensagem ao chat
            addChatMessage(user.username, messageText, 'agora', user.color, user.avatar, user.badges);
        }, delay);
    }
}

// Inicializar o seletor de emojis
function initEmojiPicker() {
    const emojiGrid = document.getElementById('chat-emoji-grid');
    if (!emojiGrid) return;
    
    // Limpar grid
    emojiGrid.innerHTML = '';
    
    // Adicionar emojis da categoria padrão (smileys)
    addEmojisToGrid('smileys');
    
    // Configurar eventos para as categorias
    const categoryButtons = document.querySelectorAll('.chat-emoji-category');
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe active de todos os botões
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adicionar classe active ao botão clicado
            this.classList.add('active');
            
            // Adicionar emojis da categoria selecionada
            const category = this.getAttribute('data-category');
            addEmojisToGrid(category);
        });
    });
}

// Adicionar emojis ao grid
function addEmojisToGrid(category) {
    const emojiGrid = document.getElementById('chat-emoji-grid');
    if (!emojiGrid) return;
    
    // Limpar grid
    emojiGrid.innerHTML = '';
    
    // Verificar se a categoria existe
    if (!emojiCategories[category]) return;
    
    // Adicionar emojis
    emojiCategories[category].forEach(emoji => {
        const emojiItem = document.createElement('div');
        emojiItem.className = 'chat-emoji-item';
        emojiItem.textContent = emoji;
        emojiItem.addEventListener('click', function() {
            insertEmoji(emoji);
        });
        
        emojiGrid.appendChild(emojiItem);
    });
}

// Inserir emoji no input de mensagem
function insertEmoji(emoji) {
    const chatInput = document.getElementById('chat-input');
    if (!chatInput) return;
    
    // Inserir emoji na posição do cursor
    const cursorPos = chatInput.selectionStart;
    const textBefore = chatInput.value.substring(0, cursorPos);
    const textAfter = chatInput.value.substring(cursorPos);
    
    chatInput.value = textBefore + emoji + textAfter;
    
    // Atualizar posição do cursor
    chatInput.selectionStart = cursorPos + emoji.length;
    chatInput.selectionEnd = cursorPos + emoji.length;
    
    // Focar no input
    chatInput.focus();
    
    // Fechar o seletor de emojis
    const emojiPicker = document.getElementById('chat-emoji-picker');
    if (emojiPicker) {
        emojiPicker.classList.remove('show');
    }
}

// Alternar visibilidade do seletor de emojis
function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('chat-emoji-picker');
    if (emojiPicker) {
        emojiPicker.classList.toggle('show');
    }
}

// Iniciar o bot de chat
function startChatBot() {
    // Verificar se o bot está habilitado
    if (!chatConfig.botEnabled) return;
    
    // Carregar configurações salvas (se existirem)
    loadBotSettings();
    
    // Configurar intervalo para mensagens do bot
    setInterval(() => {
        // Enviar mensagem do bot
        sendBotMessage();
    }, chatConfig.botInterval * 60 * 1000); // Converter minutos para milissegundos
}

// Enviar mensagem do bot
function sendBotMessage() {
    // Selecionar um tipo de mensagem aleatório
    const messageTypes = Object.keys(chatConfig.botMessages);
    const randomType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
    
    // Selecionar uma mensagem aleatória do tipo escolhido
    const messages = chatConfig.botMessages[randomType];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Adicionar mensagem do bot ao chat
    addBotMessage(randomMessage);
}

// Adicionar mensagem do bot ao chat
function addBotMessage(message) {
    addChatMessage(
        chatConfig.botName,
        message,
        'agora',
        chatConfig.botColor,
        chatConfig.botAvatar,
        [],
        true
    );
}

// Testar mensagem do bot (para administradores)
function testBotMessage() {
    // Verificar se o usuário é administrador
    if (!isAdmin()) return;
    
    // Obter tipo de mensagem selecionado
    const messageType = document.getElementById('bot-message-type').value;
    
    // Verificar se é mensagem personalizada
    if (messageType === 'personalizado') {
        const customMessage = document.getElementById('bot-custom-message').value.trim();
        if (customMessage !== '') {
            addBotMessage(customMessage);
        } else {
            alert('Por favor, digite uma mensagem personalizada.');
        }
    } else {
        // Selecionar uma mensagem aleatória do tipo escolhido
        const messages = chatConfig.botMessages[messageType];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // Adicionar mensagem do bot ao chat
        addBotMessage(randomMessage);
    }
}

// Salvar configurações do bot (para administradores)
function saveBotSettings() {
    // Verificar se o usuário é administrador
    if (!isAdmin()) return;
    
    // Obter valores dos campos
    const interval = parseInt(document.getElementById('bot-interval').value);
    const messageType = document.getElementById('bot-message-type').value;
    const customMessage = document.getElementById('bot-custom-message').value.trim();
    
    // Validar intervalo
    if (isNaN(interval) || interval < 1 || interval > 60) {
        alert('Por favor, digite um intervalo válido entre 1 e 60 minutos.');
        return;
    }
    
    // Atualizar configurações
    chatConfig.botInterval = interval;
    
    // Se for mensagem personalizada, adicionar à lista de mensagens
    if (messageType === 'personalizado' && customMessage !== '') {
        // Verificar se já existe a categoria de mensagens personalizadas
        if (!chatConfig.botMessages.personalizado) {
            chatConfig.botMessages.personalizado = [];
        }
        
        // Adicionar mensagem personalizada
        chatConfig.botMessages.personalizado.push(customMessage);
    }
    
    // Salvar configurações no localStorage
    localStorage.setItem('chatBotConfig', JSON.stringify({
        interval: chatConfig.botInterval,
        messages: chatConfig.botMessages
    }));
    
    // Mostrar mensagem de sucesso
    alert('Configurações do bot salvas com sucesso!');
}

// Carregar configurações do bot
function loadBotSettings() {
    // Verificar se existem configurações salvas
    const savedConfig = localStorage.getItem('chatBotConfig');
    if (!savedConfig) return;
    
    try {
        const config = JSON.parse(savedConfig);
        
        // Atualizar configurações
        if (config.interval) {
            chatConfig.botInterval = config.interval;
        }
        
        if (config.messages) {
            chatConfig.botMessages = config.messages;
        }
        
        // Atualizar campos do formulário
        const intervalInput = document.getElementById('bot-interval');
        if (intervalInput) {
            intervalInput.value = chatConfig.botInterval;
        }
    } catch (error) {
        console.error('Erro ao carregar configurações do bot:', error);
    }
}

// Verificar se o usuário é administrador
function isAdmin() {
    // Verificar se a função authUtils está disponível (importada do login.js)
    if (typeof window.authUtils !== 'undefined' && window.authUtils.isAdmin) {
        return window.authUtils.isAdmin();
    }
    
    // Fallback se authUtils não estiver disponível
    const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
    return userType === 'admin';
}

// Verificar acesso de administrador
function checkAdminAccess() {
    // Verificar se o usuário é administrador
    if (isAdmin()) {
        // Adicionar classe admin-mode ao body
        document.body.classList.add('admin-mode');
    }
}

// Gerar cor aleatória
function getRandomColor() {
    const colors = ['#ff5722', '#2196f3', '#4caf50', '#9c27b0', '#e91e63', '#ff9800', '#795548', '#607d8b'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Exportar funções para uso em outras páginas
window.chatUtils = {
    addChatMessage,
    addBotMessage,
    sendBotMessage
};
