// Otimizações de performance para o site BigodiNNN1

// Carregamento lazy para imagens
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar carregamento lazy para imagens
    initLazyLoading();
    
    // Inicializar animações de entrada
    initFadeInAnimations();
    
    // Pré-carregar recursos críticos
    preloadCriticalResources();
});

// Implementar carregamento lazy para imagens
function initLazyLoading() {
    // Selecionar todas as imagens com classe lazy-load
    const lazyImages = document.querySelectorAll('img.lazy-load');
    
    // Configurar o observador de interseção
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                // Verificar se o elemento está visível
                if (entry.isIntersecting) {
                    const img = entry.target;
                    // Carregar a imagem real
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                    }
                    // Parar de observar o elemento após carregá-lo
                    imageObserver.unobserve(img);
                }
            });
        });
        
        // Observar cada imagem
        lazyImages.forEach(function(img) {
            imageObserver.observe(img);
        });
    } else {
        // Fallback para navegadores que não suportam IntersectionObserver
        lazyImages.forEach(function(img) {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.add('loaded');
            }
        });
    }
}

// Inicializar animações de entrada
function initFadeInAnimations() {
    // Selecionar todos os elementos com classe animate-fade-in
    const animatedElements = document.querySelectorAll('.animate-fade-in');
    
    // Configurar o observador de interseção
    if ('IntersectionObserver' in window) {
        const animationObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                // Verificar se o elemento está visível
                if (entry.isIntersecting) {
                    // Adicionar classe para iniciar a animação
                    entry.target.classList.add('visible');
                    // Parar de observar o elemento após animá-lo
                    animationObserver.unobserve(entry.target);
                }
            });
        });
        
        // Observar cada elemento
        animatedElements.forEach(function(element) {
            animationObserver.observe(element);
        });
    } else {
        // Fallback para navegadores que não suportam IntersectionObserver
        animatedElements.forEach(function(element) {
            element.classList.add('visible');
        });
    }
}

// Pré-carregar recursos críticos
function preloadCriticalResources() {
    // Lista de recursos críticos para pré-carregar
    const criticalResources = [
        'assets/images/logo.jpg',
        'assets/images/hero-bg.jpg'
    ];
    
    // Criar elementos de link para pré-carregar
    criticalResources.forEach(function(resource) {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = resource.endsWith('.jpg') || resource.endsWith('.png') ? 'image' : 'script';
        preloadLink.href = resource;
        document.head.appendChild(preloadLink);
    });
}

// Otimizar renderização de página
function optimizePageRendering() {
    // Adiar carregamento de scripts não críticos
    const nonCriticalScripts = document.querySelectorAll('script[data-defer]');
    nonCriticalScripts.forEach(function(script) {
        script.setAttribute('defer', '');
    });
    
    // Adiar carregamento de estilos não críticos
    const nonCriticalStyles = document.querySelectorAll('link[data-defer]');
    nonCriticalStyles.forEach(function(style) {
        style.setAttribute('media', 'print');
        style.setAttribute('onload', "this.media='all'");
    });
}

// Otimizar cache do navegador
function optimizeBrowserCache() {
    // Esta função seria implementada no servidor
    // Aqui apenas documentamos o que deve ser feito
    
    // 1. Configurar cabeçalhos de cache para recursos estáticos
    // Cache-Control: max-age=31536000, immutable
    
    // 2. Configurar cabeçalhos de cache para HTML
    // Cache-Control: no-cache, must-revalidate
    
    // 3. Implementar ETag para validação de cache
    
    // 4. Implementar versioning para recursos estáticos
    // exemplo: style.css?v=1.2.3
}

// Otimizar carregamento de fontes
function optimizeFontLoading() {
    // Adicionar preconnect para domínios de fontes
    const domains = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
    
    domains.forEach(function(domain) {
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = domain;
        document.head.appendChild(preconnect);
    });
    
    // Adicionar font-display: swap para fontes
    const style = document.createElement('style');
    style.textContent = `
        @font-face {
            font-family: 'Roboto';
            font-display: swap;
        }
    `;
    document.head.appendChild(style);
}

// Otimizar carregamento de terceiros
function optimizeThirdPartyLoading() {
    // Adiar carregamento de scripts de terceiros
    window.addEventListener('load', function() {
        // Carregar scripts de terceiros após a página estar completamente carregada
        setTimeout(function() {
            // Exemplo: carregar scripts de análise
            loadAnalytics();
        }, 2000);
    });
}

// Carregar scripts de análise
function loadAnalytics() {
    // Esta função carregaria scripts de análise como Google Analytics
    console.log('Scripts de análise carregados');
}

// Exportar funções para uso em outras páginas
window.performanceUtils = {
    initLazyLoading,
    initFadeInAnimations,
    optimizePageRendering
};
