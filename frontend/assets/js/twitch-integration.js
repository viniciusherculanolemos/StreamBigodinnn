// JavaScript para integração com a Twitch e atualização automática de dados

// Configurações da API da Twitch
const TWITCH_CHANNEL = 'bigodinnn1'; // Canal da Twitch a ser verificado
const BACKEND_API_URL = '/api/twitch/status'; // Endpoint do nosso backend

// Inicialização quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar a integração com a Twitch
    initTwitchIntegration();
    
    // Configurar atualização automática
    setupAutoUpdate();
});

// Inicializar a integração com a Twitch
function initTwitchIntegration() {
    // Verificar se o elemento de stream existe
    const streamContainer = document.getElementById('twitch-stream-container');
    if (!streamContainer) return;
    
    // Verificar o status da stream
    checkStreamStatus();
}

// Verificar o status da stream na Twitch através do nosso backend
async function checkStreamStatus() {
    console.log('Verificando status da stream através do backend...');
    try {
        const response = await fetch(BACKEND_API_URL);
        if (!response.ok) {
            console.error('Falha ao buscar status da stream do backend:', response.status, await response.text());
            // Tentar mostrar vídeo offline como fallback em caso de erro do backend
            updateStreamInterface({ is_live: false }); 
            return;
        }
        const streamData = await response.json();
        
        // Atualizar a interface com base no status
        updateStreamInterface(streamData);
        
        // Salvar dados no localStorage para uso em outras páginas (opcional, mas mantido da lógica original)
        localStorage.setItem('twitchStreamData', JSON.stringify(streamData));
        localStorage.setItem('lastTwitchUpdate', new Date().getTime().toString());

    } catch (error) {
        console.error('Erro ao verificar status da stream:', error);
        // Tentar mostrar vídeo offline como fallback em caso de erro de rede
        updateStreamInterface({ is_live: false }); 
    }
}

// Atualizar a interface com base no status da stream
function updateStreamInterface(streamData) {
    const streamContainer = document.getElementById('twitch-stream-container');
    const offlineVideoContainer = document.getElementById('offline-video-container');
    const streamTitle = document.getElementById('stream-title');
    const streamGame = document.getElementById('stream-game');
    const viewerCount = document.getElementById('twitch-viewer-count');
    const siteViewerCount = document.getElementById('site-viewer-count'); // Este contador é simulado
    
    if (!streamContainer && !offlineVideoContainer) return;
    
    // Atualizar título e jogo se os elementos existirem e a stream estiver live
    if (streamTitle) streamTitle.textContent = streamData.is_live ? (streamData.title || 'Live!') : 'Offline';
    if (streamGame) streamGame.textContent = streamData.is_live ? (streamData.game_name || 'N/A') : '';
    
    // Atualizar contador de visualizações da Twitch
    if (viewerCount) {
        viewerCount.textContent = streamData.is_live ? (streamData.viewer_count !== undefined ? streamData.viewer_count.toString() : '0') : '0';
    }
    
    // Atualizar contador de visualizações do site (simulação mantida da lógica original)
    if (siteViewerCount) {
        const siteViewers = Math.floor(Math.random() * 30) + 10;
        siteViewerCount.textContent = siteViewers.toString();
    }
    
    // Mostrar stream ou vídeo offline com base no status
    if (streamData.is_live) {
        // Stream está online
        if (streamContainer) {
            streamContainer.style.display = 'block';
            if (!streamContainer.querySelector('iframe')) {
                const iframe = document.createElement('iframe');
                iframe.src = `https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=${window.location.hostname}&autoplay=true&muted=false`;
                iframe.allowFullscreen = true;
                iframe.width = '100%';
                iframe.height = '100%';
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('scrolling', 'no');
                iframe.setAttribute('allow', 'autoplay; fullscreen');
                streamContainer.innerHTML = '';
                streamContainer.appendChild(iframe);
            }
        }
        if (offlineVideoContainer) {
            offlineVideoContainer.style.display = 'none';
            const videoElement = offlineVideoContainer.querySelector('video');
            if (videoElement) videoElement.pause(); // Pausar vídeo offline se estiver a tocar
        }
        updateStreamStatus(true, streamData.viewer_count);
    } else {
        // Stream está offline
        if (streamContainer) {
            streamContainer.style.display = 'none';
            streamContainer.innerHTML = ''; // Limpar o iframe se existir
        }
        if (offlineVideoContainer) {
            offlineVideoContainer.style.display = 'block';
            if (!offlineVideoContainer.querySelector('video')) {
                const video = document.createElement('video');
                video.src = 'assets/videos/offline-video.mp4'; // Nome do ficheiro corrigido
                video.controls = false;
                video.autoplay = true;
                video.loop = true;
                video.muted = true; // Recomenda-se começar mutado para autoplay
                video.width = '100%';
                video.height = '100%';
                video.setAttribute('playsinline', ''); // Para iOS
                offlineVideoContainer.innerHTML = '';
                offlineVideoContainer.appendChild(video);
            } else {
                 const videoElement = offlineVideoContainer.querySelector('video');
                 if (videoElement && videoElement.paused) videoElement.play(); // Tocar vídeo offline se já existir e estiver pausado
            }
        }
        updateStreamStatus(false, 0);
    }
}

// Atualizar o status da stream na interface (badges, texto, título da página)
function updateStreamStatus(isLive, viewerCount) {
    const statusBadge = document.getElementById('stream-status-badge');
    const statusText = document.getElementById('stream-status-text');
    
    if (statusBadge) {
        if (isLive) {
            statusBadge.className = 'badge bg-danger live-badge';
            statusBadge.innerHTML = '<i class="fas fa-broadcast-tower"></i> AO VIVO';
        } else {
            statusBadge.className = 'badge bg-secondary offline-badge';
            statusBadge.innerHTML = '<i class="fas fa-power-off"></i> OFFLINE';
        }
    }
    
    if (statusText) {
        if (isLive) {
            statusText.innerHTML = `<span class="text-danger"><i class="fas fa-circle"></i></span> Ao vivo agora com <strong>${viewerCount !== undefined ? viewerCount : 'N/A'}</strong> espectadores`;
        } else {
            statusText.innerHTML = '<span class="text-secondary"><i class="fas fa-circle"></i></span> Offline no momento';
        }
    }
    
    document.title = isLive ? `🔴 AO VIVO: ${TWITCH_CHANNEL} - BigodiNNN1` : 'BigodiNNN1';
    
    if (isLive) {
        document.body.classList.add('stream-online');
        document.body.classList.remove('stream-offline');
    } else {
        document.body.classList.add('stream-offline');
        document.body.classList.remove('stream-online');
    }
}

// Configurar atualização automática
function setupAutoUpdate() {
    // Verificar o status da stream a cada 60 segundos (1 minuto)
    setInterval(checkStreamStatus, 60000);
    
    // Atualizar contador de visualizações do site (simulação) a cada 30 segundos
    // Esta parte pode ser removida ou ajustada se não for necessária
    setInterval(() => {
        const siteViewerCount = document.getElementById('site-viewer-count');
        if (siteViewerCount) {
            const currentCount = parseInt(siteViewerCount.textContent) || 0;
            const variation = Math.floor(Math.random() * 6) - 2;
            const newCount = Math.max(5, currentCount + variation);
            siteViewerCount.textContent = newCount.toString();
        }
    }, 30000);
}

// Exportar funções para uso em outras páginas (se necessário)
window.twitchAPI = {
    checkStreamStatus
};

