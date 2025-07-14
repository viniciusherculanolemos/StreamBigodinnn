// Função específica para gerenciar o vídeo offline
function setupOfflineVideo() {
    const offlineVideoElement = document.getElementById('offline-video');
    const introVideo = document.getElementById('intro-video');
    
    // Garantir que o vídeo tenha os atributos corretos
    introVideo.setAttribute('autoplay', '');
    introVideo.setAttribute('loop', '');
    introVideo.setAttribute('muted', '');
    introVideo.setAttribute('playsinline', ''); // Importante para iOS
    
    // Adicionar listener para quando o vídeo terminar
    introVideo.addEventListener('ended', function() {
        // Reiniciar o vídeo quando terminar (backup para o atributo loop)
        this.currentTime = 0;
        this.play().catch(error => {
            console.log('Erro ao reiniciar o vídeo:', error);
        });
    });
    
    // Função para tentar iniciar o vídeo
    function attemptAutoplay() {
        introVideo.muted = true; // Mutar o vídeo para aumentar chances de autoplay
        introVideo.play().catch(error => {
            console.log('Reprodução automática bloqueada pelo navegador:', error);
            
            // Criar um botão de play para interação do usuário
            if (!document.getElementById('play-button')) {
                const playButton = document.createElement('button');
                playButton.id = 'play-button';
                playButton.className = 'play-button';
                playButton.innerHTML = '<i class="fas fa-play"></i> Clique para assistir';
                playButton.style.position = 'absolute';
                playButton.style.top = '50%';
                playButton.style.left = '50%';
                playButton.style.transform = 'translate(-50%, -50%)';
                playButton.style.padding = '15px 30px';
                playButton.style.backgroundColor = 'rgba(255, 51, 153, 0.8)';
                playButton.style.color = 'white';
                playButton.style.border = 'none';
                playButton.style.borderRadius = '30px';
                playButton.style.fontSize = '18px';
                playButton.style.cursor = 'pointer';
                playButton.style.zIndex = '10';
                
                playButton.addEventListener('click', function() {
                    introVideo.play().then(() => {
                        this.remove(); // Remover o botão após iniciar o vídeo
                    }).catch(err => {
                        console.log('Ainda não foi possível reproduzir o vídeo:', err);
                    });
                });
                
                offlineVideoElement.style.position = 'relative';
                offlineVideoElement.appendChild(playButton);
            }
        });
    }
    
    // Tentar iniciar o vídeo quando a página carregar
    attemptAutoplay();
    
    // Adicionar listener para interação do usuário com a página
    document.addEventListener('click', function userInteraction() {
        attemptAutoplay();
        // Remover o listener após a primeira interação
        document.removeEventListener('click', userInteraction);
    }, { once: true });
    
    return {
        show: function() {
            offlineVideoElement.style.display = 'block';
            attemptAutoplay();
        },
        hide: function() {
            offlineVideoElement.style.display = 'none';
            introVideo.pause();
        }
    };
}

// Modificar a função checkStreamStatus para usar o controlador de vídeo offline
function checkStreamStatus() {
    // Inicializar o controlador de vídeo offline se ainda não existir
    if (!window.offlineVideoController) {
        window.offlineVideoController = setupOfflineVideo();
    }
    
    const statusElement = document.getElementById('stream-status');
    const twitchEmbedElement = document.getElementById('twitch-embed');
    
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
        window.offlineVideoController.hide();
        
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
        window.offlineVideoController.show();
        
        document.getElementById('stream-title').textContent = 'BigodiNNN1 - Offline';
    }
}
