// BigodiNNN1 - JavaScript Otimizado e Moderno

class BigodiNNN1App {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupLazyLoading();
    this.setupServiceWorker();
    this.setupPerformanceOptimizations();
    this.setupOAuth();
    this.checkAuthStatus();
  }

  // ===== EVENT LISTENERS =====
  setupEventListeners() {
    // DOM Content Loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
    } else {
      this.onDOMReady();
    }

    // Mobile menu toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', 
          navToggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
        );
      });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navMenu && navMenu.classList.contains('active') && 
          !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Form validation
    this.setupFormValidation();
  }

  onDOMReady() {
    // Adicionar classe loaded para animações
    document.body.classList.add('loaded');
    
    // Inicializar componentes
    this.initializeComponents();
    
    // Verificar status da Twitch
    this.updateTwitchStatus();
    
    // Configurar auto-refresh para status
    setInterval(() => this.updateTwitchStatus(), 60000); // 1 minuto
  }

  // ===== LAZY LOADING =====
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    } else {
      // Fallback para navegadores sem suporte
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        img.classList.add('loaded');
      });
    }
  }

  // ===== SERVICE WORKER =====
  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }

  // ===== PERFORMANCE OPTIMIZATIONS =====
  setupPerformanceOptimizations() {
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Debounce scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(() => {
        this.handleScroll();
      }, 16); // ~60fps
    }, { passive: true });

    // Optimize images
    this.optimizeImages();
  }

  preloadCriticalResources() {
    const criticalResources = [
      '/api/auth/check_session',
      '/api/twitch/status'
    ];

    criticalResources.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  handleScroll() {
    const scrollY = window.scrollY;
    const header = document.querySelector('.header');
    
    if (header) {
      if (scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  }

  optimizeImages() {
    // Converter imagens para WebP se suportado
    if (this.supportsWebP()) {
      document.querySelectorAll('img').forEach(img => {
        if (img.src && !img.src.includes('.webp')) {
          const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
          // Verificar se a versão WebP existe
          this.checkImageExists(webpSrc).then(exists => {
            if (exists) {
              img.src = webpSrc;
            }
          });
        }
      });
    }
  }

  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  checkImageExists(url) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  // ===== OAUTH AUTHENTICATION =====
  setupOAuth() {
    // Verificar se há parâmetros de OAuth na URL
    const urlParams = new URLSearchParams(window.location.search);
    const loginStatus = urlParams.get('login');
    const token = urlParams.get('token');
    const error = urlParams.get('message');

    if (loginStatus === 'success' && token) {
      this.handleOAuthSuccess(token);
    } else if (loginStatus === 'error') {
      this.handleOAuthError(error);
    }

    // Configurar botões OAuth
    this.setupOAuthButtons();
  }

  setupOAuthButtons() {
    const googleBtn = document.querySelector('.btn-google-oauth');
    const discordBtn = document.querySelector('.btn-discord-oauth');

    if (googleBtn) {
      googleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.initiateOAuth('google');
      });
    }

    if (discordBtn) {
      discordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.initiateOAuth('discord');
      });
    }
  }

  initiateOAuth(provider) {
    // Mostrar loading
    this.showLoading(`Conectando com ${provider}...`);
    
    // Redirecionar para OAuth
    window.location.href = `/api/auth/${provider}`;
  }

  handleOAuthSuccess(token) {
    // Salvar token
    localStorage.setItem('auth_token', token);
    
    // Limpar URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Mostrar sucesso
    this.showNotification('Login realizado com sucesso!', 'success');
    
    // Atualizar UI
    this.updateAuthUI(true);
    
    // Recarregar dados do usuário
    this.loadUserData();
  }

  handleOAuthError(error) {
    // Limpar URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Mostrar erro
    const errorMessages = {
      'google_oauth_failed': 'Erro ao conectar com Google. Tente novamente.',
      'discord_oauth_failed': 'Erro ao conectar com Discord. Tente novamente.',
      'default': 'Erro no login. Tente novamente.'
    };
    
    this.showNotification(errorMessages[error] || errorMessages.default, 'error');
  }

  // ===== AUTHENTICATION =====
  async checkAuthStatus() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.updateAuthUI(false);
      return;
    }

    try {
      const response = await this.apiCall('/api/auth/check_session', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.authenticated) {
        this.updateAuthUI(true, response);
      } else {
        localStorage.removeItem('auth_token');
        this.updateAuthUI(false);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      localStorage.removeItem('auth_token');
      this.updateAuthUI(false);
    }
  }

  updateAuthUI(isAuthenticated, userData = null) {
    const loginBtn = document.querySelector('.btn-login');
    const logoutBtn = document.querySelector('.btn-logout');
    const userMenu = document.querySelector('.user-menu');
    const guestMenu = document.querySelector('.guest-menu');

    if (isAuthenticated && userData) {
      // Usuário logado
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (userMenu) {
        userMenu.style.display = 'block';
        this.updateUserMenu(userData);
      }
      if (guestMenu) guestMenu.style.display = 'none';
    } else {
      // Usuário não logado
      if (loginBtn) loginBtn.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (userMenu) userMenu.style.display = 'none';
      if (guestMenu) guestMenu.style.display = 'block';
    }
  }

  updateUserMenu(userData) {
    const userAvatar = document.querySelector('.user-avatar');
    const userName = document.querySelector('.user-name');

    if (userAvatar && userData.profile_picture_url) {
      userAvatar.src = userData.profile_picture_url;
    }

    if (userName) {
      userName.textContent = userData.username;
    }
  }

  async loadUserData() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await this.apiCall('/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Atualizar dados do usuário na interface
      this.updateUserProfile(response);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  }

  // ===== TWITCH STATUS =====
  async updateTwitchStatus() {
    try {
      const response = await this.apiCall('/api/twitch/status');
      const statusBadge = document.querySelector('.status-badge');
      
      if (statusBadge) {
        statusBadge.className = `status-badge ${response.is_live ? 'online' : 'offline'}`;
        statusBadge.innerHTML = `
          <span class="status-dot"></span>
          ${response.is_live ? 'AO VIVO' : 'OFFLINE'}
        `;
      }

      // Atualizar informações adicionais se disponíveis
      if (response.is_live && response.game) {
        const gameInfo = document.querySelector('.game-info');
        if (gameInfo) {
          gameInfo.textContent = `Jogando: ${response.game}`;
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status da Twitch:', error);
    }
  }

  // ===== FORM VALIDATION =====
  setupFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        if (!this.validateForm(form)) {
          e.preventDefault();
        }
      });

      // Validação em tempo real
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => this.clearFieldError(input));
      });
    });
  }

  validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    let isValid = true;
    let errorMessage = '';

    // Verificar se é obrigatório
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'Este campo é obrigatório.';
    }

    // Validações específicas por tipo
    if (value && type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Digite um email válido.';
      }
    }

    if (value && type === 'password') {
      if (value.length < 8) {
        isValid = false;
        errorMessage = 'A senha deve ter pelo menos 8 caracteres.';
      }
    }

    // Mostrar/esconder erro
    this.showFieldError(field, isValid ? '' : errorMessage);
    
    return isValid;
  }

  showFieldError(field, message) {
    this.clearFieldError(field);
    
    if (message) {
      field.classList.add('error');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.textContent = message;
      field.parentNode.appendChild(errorDiv);
    }
  }

  clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  }

  // ===== UTILITIES =====
  async apiCall(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }

  showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="notification-message">${message}</span>
      <button class="notification-close">&times;</button>
    `;

    // Adicionar ao DOM
    document.body.appendChild(notification);

    // Mostrar com animação
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto-remover após 5 segundos
    setTimeout(() => this.removeNotification(notification), 5000);

    // Botão de fechar
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.removeNotification(notification);
    });
  }

  removeNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  showLoading(message = 'Carregando...') {
    const loading = document.createElement('div');
    loading.className = 'loading-overlay';
    loading.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(loading);
  }

  hideLoading() {
    const loading = document.querySelector('.loading-overlay');
    if (loading) {
      loading.remove();
    }
  }

  initializeComponents() {
    // Inicializar tooltips
    this.initTooltips();
    
    // Inicializar modais
    this.initModals();
    
    // Inicializar dropdowns
    this.initDropdowns();
  }

  initTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
      element.addEventListener('mouseenter', (e) => {
        this.showTooltip(e.target, e.target.dataset.tooltip);
      });
      element.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    });
  }

  showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
  }

  hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  initModals() {
    const modalTriggers = document.querySelectorAll('[data-modal]');
    modalTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = trigger.dataset.modal;
        this.openModal(modalId);
      });
    });

    // Fechar modal ao clicar no overlay
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.closeModal();
      }
    });

    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.classList.add('modal-open');
    }
  }

  closeModal() {
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
      activeModal.classList.remove('active');
      document.body.classList.remove('modal-open');
    }
  }

  initDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
      const trigger = dropdown.querySelector('.dropdown-trigger');
      const menu = dropdown.querySelector('.dropdown-menu');

      if (trigger && menu) {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          dropdown.classList.toggle('active');
        });
      }
    });

    // Fechar dropdowns ao clicar fora
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown.active').forEach(dropdown => {
          dropdown.classList.remove('active');
        });
      }
    });
  }
}

// Inicializar aplicação
const app = new BigodiNNN1App();

// Exportar para uso global se necessário
window.BigodiNNN1App = app;

