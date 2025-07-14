// JavaScript para a página de associados

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes
    setupPlanCards();
    setupTestimonials();
    checkLoginStatus();
});

// Configurar cards de planos
function setupPlanCards() {
    const planCards = document.querySelectorAll('.plan-card');
    
    planCards.forEach(card => {
        // Adicionar efeito de hover
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('featured')) {
                planCards.forEach(c => {
                    if (c !== this && !c.classList.contains('featured')) {
                        c.style.opacity = '0.7';
                    }
                });
            }
        });
        
        card.addEventListener('mouseleave', function() {
            planCards.forEach(c => {
                c.style.opacity = '1';
            });
        });
        
        // Adicionar evento de clique no botão de assinar
        const subscribeButton = card.querySelector('.btn-plan');
        if (subscribeButton) {
            subscribeButton.addEventListener('click', function(e) {
                // Verificar se o usuário está logado antes de redirecionar
                const isLoggedIn = localStorage.getItem('username') || sessionStorage.getItem('username');
                
                if (!isLoggedIn) {
                    e.preventDefault();
                    showLoginPrompt();
                }
                // Se estiver logado, o link funciona normalmente
            });
        }
    });
}

// Configurar depoimentos
function setupTestimonials() {
    // Em uma implementação real, poderíamos ter um carrossel de depoimentos
    // Para esta demonstração, os depoimentos são estáticos
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
    
    // Se o usuário já for associado, atualizar os botões de plano
    if (userType === 'associate' || userType === 'admin') {
        const planButtons = document.querySelectorAll('.btn-plan');
        planButtons.forEach(button => {
            button.textContent = 'Você já é associado';
            button.classList.add('disabled');
            button.style.backgroundColor = '#28a745';
            button.href = '#';
            button.onclick = function(e) {
                e.preventDefault();
                showNotification('Você já é um associado!', 'success');
            };
        });
        
        // Atualizar o CTA
        const ctaButton = document.querySelector('.btn-cta');
        if (ctaButton) {
            ctaButton.textContent = 'Gerenciar Assinatura';
            ctaButton.href = '#'; // Em produção, apontaria para a página de gerenciamento de assinatura
        }
        
        const ctaTitle = document.querySelector('.cta-content h2');
        if (ctaTitle) {
            ctaTitle.textContent = 'Obrigado por ser um associado!';
        }
        
        const ctaText = document.querySelector('.cta-content p');
        if (ctaText) {
            ctaText.textContent = 'Continue aproveitando todos os benefícios exclusivos da nossa comunidade.';
        }
    }
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
                        <p>Para se tornar um associado, você precisa estar logado em sua conta.</p>
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
