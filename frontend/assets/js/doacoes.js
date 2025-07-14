// JavaScript para a página de doações

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes
    setupDonationAmounts();
    setupDonationSubmit();
    animateProgressBar();
    checkLoginStatus();
    setupSmoothScroll();
});

// Configurar botões de valores de doação
function setupDonationAmounts() {
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountContainer = document.querySelector('.custom-amount-container');
    const customAmountInput = document.getElementById('customAmount');
    
    // Adicionar evento de clique para cada botão
    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe active de todos os botões
            amountButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adicionar classe active ao botão clicado
            this.classList.add('active');
            
            // Verificar se é o botão de valor personalizado
            if (this.dataset.amount === 'custom') {
                customAmountContainer.style.display = 'block';
                customAmountInput.focus();
            } else {
                customAmountContainer.style.display = 'none';
            }
        });
    });
}

// Configurar envio de doação
function setupDonationSubmit() {
    const submitButton = document.getElementById('submitDonation');
    
    if (submitButton) {
        submitButton.addEventListener('click', function() {
            // Obter valor selecionado
            const activeButton = document.querySelector('.amount-btn.active');
            let donationAmount = 0;
            
            if (activeButton) {
                if (activeButton.dataset.amount === 'custom') {
                    const customAmountInput = document.getElementById('customAmount');
                    donationAmount = parseFloat(customAmountInput.value);
                } else {
                    donationAmount = parseFloat(activeButton.dataset.amount);
                }
            }
            
            // Obter mensagem
            const messageTextarea = document.querySelector('.donation-message textarea');
            const donationMessage = messageTextarea ? messageTextarea.value : '';
            
            // Validar valor
            if (isNaN(donationAmount) || donationAmount <= 0) {
                showNotification('Por favor, selecione ou digite um valor válido para doação.', 'warning');
                return;
            }
            
            // Verificar se o usuário está logado
            const isLoggedIn = localStorage.getItem('username') || sessionStorage.getItem('username');
            
            if (!isLoggedIn) {
                showLoginPrompt();
                return;
            }
            
            // Simular processamento de doação
            processDonation(donationAmount, donationMessage);
        });
    }
}

// Processar doação (simulação)
function processDonation(amount, message) {
    // Mostrar notificação de processamento
    showNotification('Processando sua doação...', 'info');
    
    // Simular delay de processamento
    setTimeout(() => {
        // Redirecionar para a plataforma de pagamento (simulação)
        showNotification('Redirecionando para a plataforma de pagamento...', 'success');
        
        // Em produção, redirecionaria para a plataforma de pagamento real
        setTimeout(() => {
            window.location.href = 'https://livepix.gg/bigodinnn';
        }, 1500);
    }, 1000);
}

// Animar barra de progresso
function animateProgressBar() {
    const progressBar = document.querySelector('.goal-progress .progress-bar');
    
    if (progressBar) {
        const targetWidth = progressBar.style.width;
        
        // Resetar largura para animar
        progressBar.style.width = '0%';
        
        // Animar até o valor alvo
        setTimeout(() => {
            progressBar.style.width = targetWidth;
        }, 500);
    }
}

// Verificar status de login
function checkLoginStatus() {
    const username = localStorage.getItem('username') || sessionStorage.getItem('username');
    const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
    
    if (username && userType) {
        // Usuário está logado
        updateUserUI(username, userType);
    }
}

// Atualizar UI para usuário logado
function updateUserUI(username, userType) {
    // Atualizar link de login no navbar
    const loginLink = document.querySelector('.btn-login');
    if (loginLink) {
        loginLink.textContent = username;
        loginLink.href = '#'; // Em produção, apontaria para a página de perfil
    }
}

// Configurar rolagem suave para âncoras
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Mostrar prompt de login
function showLoginPrompt() {
    // Criar modal de login
    const modalHTML = `
        <div class="modal fade" id="loginPromptModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Login Necessário</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>Para fazer uma doação, você precisa estar logado em sua conta.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <a href="login.html" class="btn btn-primary">Fazer Login</a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar modal ao body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('loginPromptModal'));
    modal.show();
    
    // Remover modal do DOM quando for fechado
    document.getElementById('loginPromptModal').addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modalContainer);
    });
}

// Mostrar notificação
function showNotification(message, type) {
    // Verificar se já existe uma notificação
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        // Criar elemento de notificação
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Definir classe de tipo
    notification.className = `notification notification-${type} show`;
    
    // Definir mensagem
    notification.textContent = message;
    
    // Esconder após 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Adicionar estilos CSS para notificações
function addNotificationStyles() {
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 5px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                z-index: 1000;
                opacity: 0;
                transform: translateY(-20px);
                transition: opacity 0.3s ease, transform 0.3s ease;
                color: white;
            }
            
            .notification.show {
                opacity: 1;
                transform: translateY(0);
            }
            
            .notification-success {
                background-color: #28a745;
            }
            
            .notification-danger {
                background-color: #dc3545;
            }
            
            .notification-info {
                background-color: #17a2b8;
            }
            
            .notification-warning {
                background-color: #ffc107;
                color: #333;
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Adicionar estilos para notificações
addNotificationStyles();
