// JavaScript para o contador de visualizações do site e da Twitch

// Inicialização quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o contador de visualizações
    initViewersCounter();
    
    // Configurar atualização automática
    setupCounterAutoUpdate();
});

// Inicializar o contador de visualizações
function initViewersCounter() {
    // Verificar se os elementos do contador existem
    const twitchCounter = document.getElementById('twitch-viewer-count');
    const siteCounter = document.getElementById('site-viewer-count');
    const totalCounter = document.getElementById('total-viewer-count');
    const twitchStatusBadge = document.getElementById('twitch-status-badge');
    
    if (!twitchCounter || !siteCounter || !totalCounter) return;
    
    // Obter dados da stream do localStorage (se disponível)
    const streamDataStr = localStorage.getItem('twitchStreamData');
    
    if (streamDataStr) {
        try {
            const streamData = JSON.parse(streamDataStr);
            
            // Atualizar contador da Twitch
            const twitchViewers = streamData.isLive ? streamData.viewerCount : 0;
            twitchCounter.textContent = twitchViewers.toString();
            
            // Atualizar badge de status
            if (twitchStatusBadge) {
                if (streamData.isLive) {
                    twitchStatusBadge.textContent = 'Online';
                    twitchStatusBadge.className = 'counter-badge online';
                } else {
                    twitchStatusBadge.textContent = 'Offline';
                    twitchStatusBadge.className = 'counter-badge offline';
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados da stream:', error);
        }
    }
    
    // Gerar número inicial de visualizações do site (simulação)
    const initialSiteViewers = Math.floor(Math.random() * 30) + 10;
    siteCounter.textContent = initialSiteViewers.toString();
    
    // Calcular e atualizar o total
    updateTotalViewers();
}

// Configurar atualização automática do contador
function setupCounterAutoUpdate() {
    // Atualizar contadores a cada 30 segundos
    setInterval(updateViewersCounts, 30000);
    
    // Verificar se a função de atualização da Twitch está disponível
    if (typeof window.twitchAPI !== 'undefined' && window.twitchAPI.checkStreamStatus) {
        // Verificar o status da stream a cada 2 minutos
        setInterval(window.twitchAPI.checkStreamStatus, 120000);
    } else {
        console.warn('API da Twitch não encontrada. Usando simulação para o contador.');
        // Usar simulação se a API da Twitch não estiver disponível
        setInterval(simulateStreamUpdate, 120000);
    }
}

// Atualizar contadores de visualizações
function updateViewersCounts() {
    const twitchCounter = document.getElementById('twitch-viewer-count');
    const siteCounter = document.getElementById('site-viewer-count');
    
    if (!twitchCounter || !siteCounter) return;
    
    // Obter dados da stream do localStorage
    const streamDataStr = localStorage.getItem('twitchStreamData');
    
    if (streamDataStr) {
        try {
            const streamData = JSON.parse(streamDataStr);
            
            // Atualizar contador da Twitch se a stream estiver online
            if (streamData.isLive) {
                // Simular pequenas flutuações no número de espectadores
                const currentTwitchCount = parseInt(twitchCounter.textContent) || 0;
                const twitchVariation = Math.floor(Math.random() * 10) - 3; // -3 a +6
                const newTwitchCount = Math.max(0, currentTwitchCount + twitchVariation);
                twitchCounter.textContent = newTwitchCount.toString();
                
                // Atualizar o objeto de dados
                streamData.viewerCount = newTwitchCount;
                localStorage.setItem('twitchStreamData', JSON.stringify(streamData));
            }
        } catch (error) {
            console.error('Erro ao atualizar contador da Twitch:', error);
        }
    }
    
    // Atualizar contador do site
    const currentSiteCount = parseInt(siteCounter.textContent) || 0;
    const siteVariation = Math.floor(Math.random() * 6) - 2; // -2 a +3
    const newSiteCount = Math.max(5, currentSiteCount + siteVariation); // Mínimo de 5 visitantes
    siteCounter.textContent = newSiteCount.toString();
    
    // Atualizar o total
    updateTotalViewers();
}

// Atualizar o contador total de visualizações
function updateTotalViewers() {
    const twitchCounter = document.getElementById('twitch-viewer-count');
    const siteCounter = document.getElementById('site-viewer-count');
    const totalCounter = document.getElementById('total-viewer-count');
    
    if (!twitchCounter || !siteCounter || !totalCounter) return;
    
    const twitchCount = parseInt(twitchCounter.textContent) || 0;
    const siteCount = parseInt(siteCounter.textContent) || 0;
    const totalCount = twitchCount + siteCount;
    
    totalCounter.textContent = totalCount.toString();
}

// Simular atualização da stream (usado apenas se a API da Twitch não estiver disponível)
function simulateStreamUpdate() {
    // Gerar um status aleatório para demonstração (online/offline)
    const isOnline = Math.random() > 0.3; // 70% de chance de estar online
    
    // Dados simulados da stream
    const streamData = {
        isLive: isOnline,
        viewerCount: isOnline ? Math.floor(Math.random() * 100) + 50 : 0,
        title: 'Jogando Valorant com os inscritos!',
        gameName: 'Valorant',
        thumbnailUrl: 'assets/images/stream_thumbnail.jpg',
        startedAt: new Date().toISOString(),
        tags: ['FPS', 'Competitivo', 'Português']
    };
    
    // Salvar dados no localStorage
    localStorage.setItem('twitchStreamData', JSON.stringify(streamData));
    
    // Atualizar contador da Twitch
    const twitchCounter = document.getElementById('twitch-viewer-count');
    const twitchStatusBadge = document.getElementById('twitch-status-badge');
    
    if (twitchCounter) {
        twitchCounter.textContent = streamData.viewerCount.toString();
    }
    
    // Atualizar badge de status
    if (twitchStatusBadge) {
        if (streamData.isLive) {
            twitchStatusBadge.textContent = 'Online';
            twitchStatusBadge.className = 'counter-badge online';
        } else {
            twitchStatusBadge.textContent = 'Offline';
            twitchStatusBadge.className = 'counter-badge offline';
        }
    }
    
    // Atualizar o total
    updateTotalViewers();
}
