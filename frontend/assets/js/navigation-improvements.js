// Script para aplicar as melhorias de navegação e interatividade

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar melhorias de navegação
    initNavigationImprovements();
    
    // Inicializar tooltips e popovers
    initTooltipsAndPopovers();
    
    // Inicializar efeitos de hover
    initHoverEffects();
    
    // Inicializar feedback visual para interações
    initVisualFeedback();
    
    // Carregar otimizações de performance
    loadPerformanceOptimizations();
});

// Melhorias de navegação
function initNavigationImprovements() {
    // Destacar item de menu ativo
    highlightActiveMenuItem();
    
    // Adicionar indicadores de rolagem
    addScrollIndicators();
    
    // Implementar navegação por teclado
    implementKeyboardNavigation();
}

// Destacar item de menu ativo com base na URL atual
function highlightActiveMenuItem() {
    // Obter o caminho da URL atual
    const currentPath = window.location.pathname;
    
    // Selecionar todos os links de navegação
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    // Remover classe active de todos os links
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Adicionar classe active ao link correspondente à página atual
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || 
            (currentPath === '/' && href === 'index.html') || 
            (currentPath === '/index.html' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Adicionar indicadores de rolagem
function addScrollIndicators() {
    // Criar indicador de progresso de rolagem
    const scrollIndicator = document.createElement('div');
    scrollIndicator.className = 'scroll-progress-indicator';
    document.body.appendChild(scrollIndicator);
    
    // Atualizar indicador de progresso durante a rolagem
    window.addEventListener('scroll', function() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        
        const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
        scrollIndicator.style.width = scrollPercentage + '%';
    });
    
    // Adicionar botão "voltar ao topo" quando rolar além de certo ponto
    const backToTopButton = document.createElement('button');
    backToTopButton.className = 'back-to-top-button';
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopButton.style.display = 'none';
    document.body.appendChild(backToTopButton);
    
    // Mostrar/ocultar botão com base na posição de rolagem
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });
    
    // Adicionar evento de clique para rolar para o topo
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Implementar navegação por teclado
function implementKeyboardNavigation() {
    // Adicionar suporte para navegação por teclado
    document.addEventListener('keydown', function(e) {
        // Alt + número para navegar para links principais
        if (e.altKey && !isNaN(e.key) && e.key >= 1 && e.key <= 9) {
            const index = parseInt(e.key) - 1;
            const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
            
            if (navLinks[index]) {
                e.preventDefault();
                window.location.href = navLinks[index].getAttribute('href');
            }
        }
        
        // Tecla Home para ir ao topo da página
        if (e.key === 'Home') {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        
        // Tecla End para ir ao final da página
        if (e.key === 'End') {
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
            });
        }
    });
}

// Inicializar tooltips e popovers
function initTooltipsAndPopovers() {
    // Adicionar tooltips a elementos com atributo data-tooltip
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        const tooltipText = element.getAttribute('data-tooltip');
        
        // Criar elemento de tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.textContent = tooltipText;
        
        // Adicionar tooltip ao elemento
        element.appendChild(tooltip);
        
        // Adicionar eventos para mostrar/ocultar tooltip
        element.addEventListener('mouseenter', function() {
            tooltip.classList.add('show');
        });
        
        element.addEventListener('mouseleave', function() {
            tooltip.classList.remove('show');
        });
    });
}

// Inicializar efeitos de hover
function initHoverEffects() {
    // Adicionar efeitos de hover a cards e botões
    const hoverElements = document.querySelectorAll('.content-card, .btn-primary-gradient, .btn-outline');
    
    hoverElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.classList.add('hover-effect');
        });
        
        element.addEventListener('mouseleave', function() {
            this.classList.remove('hover-effect');
        });
    });
}

// Inicializar feedback visual para interações
function initVisualFeedback() {
    // Adicionar feedback visual para cliques em botões
    const buttons = document.querySelectorAll('button, .btn, [role="button"]');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Adicionar classe para efeito de clique
            this.classList.add('button-clicked');
            
            // Remover classe após a animação
            setTimeout(() => {
                this.classList.remove('button-clicked');
            }, 300);
        });
    });
    
    // Adicionar feedback visual para campos de formulário
    const formFields = document.querySelectorAll('input, textarea, select');
    
    formFields.forEach(field => {
        // Adicionar classe quando o campo recebe foco
        field.addEventListener('focus', function() {
            this.parentElement.classList.add('field-focused');
        });
        
        // Remover classe quando o campo perde foco
        field.addEventListener('blur', function() {
            this.parentElement.classList.remove('field-focused');
            
            // Adicionar classe se o campo tem valor
            if (this.value.trim() !== '') {
                this.parentElement.classList.add('field-filled');
            } else {
                this.parentElement.classList.remove('field-filled');
            }
        });
    });
}

// Carregar otimizações de performance
function loadPerformanceOptimizations() {
    // Verificar se o módulo de otimizações de performance está disponível
    if (typeof window.performanceUtils !== 'undefined') {
        // Inicializar carregamento lazy para imagens
        window.performanceUtils.initLazyLoading();
        
        // Inicializar animações de entrada
        window.performanceUtils.initFadeInAnimations();
        
        // Otimizar renderização de página
        window.performanceUtils.optimizePageRendering();
    }
}

// Exportar funções para uso em outras páginas
window.navigationUtils = {
    highlightActiveMenuItem,
    addScrollIndicators,
    implementKeyboardNavigation
};
