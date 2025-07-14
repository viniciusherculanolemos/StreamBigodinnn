// JavaScript para a ferramenta de organização do streamer com acesso total para o administrador

// Inicialização quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário tem acesso de administrador
    checkAdminAccess();
    
    // Inicializar componentes
    initCalendar();
    initRevenueChart();
    setupEventListeners();
    setupAdminControls();
    loadTwitchData();
});

// Verificar se o usuário tem acesso de administrador
function checkAdminAccess() {
    // Verificar se a função authUtils está disponível (importada do login.js)
    if (typeof window.authUtils === 'undefined') {
        // Criar funções de fallback se não estiver disponível
        window.authUtils = {
            isAdmin: function() {
                const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
                return userType === 'admin';
            },
            hasFullAccess: function() {
                const adminAccess = localStorage.getItem('adminAccess') || sessionStorage.getItem('adminAccess');
                return adminAccess === 'full';
            },
            logout: function() {
                localStorage.removeItem('userType');
                localStorage.removeItem('username');
                localStorage.removeItem('adminAccess');
                sessionStorage.removeItem('userType');
                sessionStorage.removeItem('username');
                sessionStorage.removeItem('adminAccess');
                window.location.href = 'index.html';
            }
        };
    }
    
    // Verificar se o usuário é administrador
    const isAdmin = window.authUtils.isAdmin();
    const hasFullAccess = window.authUtils.hasFullAccess();
    
    // Atualizar a interface com base no status de administrador
    if (isAdmin) {
        // Atualizar o botão de login para mostrar o nome do usuário
        const loginLink = document.querySelector('.btn-login');
        if (loginLink) {
            const username = localStorage.getItem('username') || sessionStorage.getItem('username') || 'BigodiNNN';
            loginLink.innerHTML = `<i class="fas fa-user-shield"></i> ${username}`;
            loginLink.href = '#';
            
            // Adicionar menu dropdown para o administrador
            const dropdown = document.createElement('div');
            dropdown.className = 'admin-dropdown';
            dropdown.innerHTML = `
                <div class="dropdown-menu">
                    <a href="organizador.html" class="dropdown-item"><i class="fas fa-tasks"></i> Organizador</a>
                    <a href="#" class="dropdown-item" id="resetDataBtn"><i class="fas fa-sync"></i> Resetar Dados</a>
                    <a href="#" class="dropdown-item" id="syncTwitchBtn"><i class="fab fa-twitch"></i> Sincronizar com Twitch</a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Sair</a>
                </div>
            `;
            
            document.body.appendChild(dropdown);
            
            // Mostrar/ocultar dropdown ao clicar no link de login
            loginLink.addEventListener('click', function(e) {
                e.preventDefault();
                const dropdownMenu = document.querySelector('.admin-dropdown .dropdown-menu');
                dropdownMenu.classList.toggle('show');
                
                // Posicionar o dropdown abaixo do link
                const rect = loginLink.getBoundingClientRect();
                dropdownMenu.style.top = (rect.bottom + window.scrollY) + 'px';
                dropdownMenu.style.right = (window.innerWidth - rect.right) + 'px';
            });
            
            // Fechar dropdown ao clicar fora dele
            document.addEventListener('click', function(e) {
                if (!loginLink.contains(e.target) && !document.querySelector('.admin-dropdown').contains(e.target)) {
                    document.querySelector('.admin-dropdown .dropdown-menu').classList.remove('show');
                }
            });
            
            // Adicionar evento de logout
            document.getElementById('logoutBtn').addEventListener('click', function(e) {
                e.preventDefault();
                window.authUtils.logout();
            });
            
            // Adicionar evento para resetar dados
            document.getElementById('resetDataBtn').addEventListener('click', function(e) {
                e.preventDefault();
                resetOrganizadorData();
            });
            
            // Adicionar evento para sincronizar com a Twitch
            document.getElementById('syncTwitchBtn').addEventListener('click', function(e) {
                e.preventDefault();
                loadTwitchData(true);
            });
        }
        
        // Adicionar classe admin ao body para estilos específicos
        document.body.classList.add('admin-mode');
        
        // Se tiver acesso total, habilitar todas as funcionalidades de edição
        if (hasFullAccess) {
            document.body.classList.add('full-access');
            enableFullEditing();
        }
    } else {
        // Redirecionar para a página de login se tentar acessar o organizador sem ser admin
        window.location.href = 'login.html';
    }
}

// Habilitar edição completa para administradores com acesso total
function enableFullEditing() {
    // Tornar todos os campos editáveis
    const editableElements = document.querySelectorAll('.stat-value, .day-label, .time-slot, .event-date, .event-title, .game-title, .game-category, .idea-title, .idea-description, .goal-title, .goal-description, .strategy-title, .strategy-description, .partnership-name, .partnership-details, .source-name, .source-amount, .note-title');
    
    editableElements.forEach(element => {
        element.setAttribute('contenteditable', 'true');
        element.classList.add('editable');
        
        // Adicionar evento para salvar ao perder o foco
        element.addEventListener('blur', function() {
            // Aqui seria implementada a funcionalidade para salvar as alterações
            console.log('Valor alterado:', this.textContent);
            saveOrganizadorData();
        });
    });
    
    // Habilitar todos os botões de edição
    const editButtons = document.querySelectorAll('.edit-controls button');
    editButtons.forEach(button => {
        button.disabled = false;
    });
    
    // Habilitar todos os botões de adicionar
    const addButtons = document.querySelectorAll('.btn-primary');
    addButtons.forEach(button => {
        if (button.textContent.includes('Adicionar')) {
            button.disabled = false;
        }
    });
    
    // Adicionar botão de salvar global
    const saveButton = document.createElement('button');
    saveButton.className = 'btn btn-success btn-save-all';
    saveButton.innerHTML = '<i class="fas fa-save"></i> Salvar Todas as Alterações';
    saveButton.addEventListener('click', function() {
        saveOrganizadorData();
        showAdminNotification('Todas as alterações foram salvas com sucesso!', 'success');
    });
    
    // Adicionar botão de resetar global
    const resetButton = document.createElement('button');
    resetButton.className = 'btn btn-danger btn-reset-all';
    resetButton.innerHTML = '<i class="fas fa-undo"></i> Resetar Alterações';
    resetButton.addEventListener('click', function() {
        if (confirm('Tem certeza que deseja resetar todas as alterações? Esta ação não pode ser desfeita.')) {
            resetOrganizadorData();
            showAdminNotification('Todos os dados foram resetados com sucesso!', 'success');
        }
    });
    
    // Adicionar botões ao topo da página
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
        const adminControls = document.createElement('div');
        adminControls.className = 'admin-controls';
        adminControls.appendChild(saveButton);
        adminControls.appendChild(resetButton);
        pageHeader.appendChild(adminControls);
    }
}

// Configurar controles de administrador adicionais
function setupAdminControls() {
    // Verificar se o usuário é administrador com acesso total
    if (!window.authUtils.isAdmin() || !window.authUtils.hasFullAccess()) return;
    
    // Adicionar funcionalidade para editar estatísticas
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(statValue => {
        statValue.addEventListener('click', function() {
            const currentValue = this.textContent;
            const newValue = prompt('Digite o novo valor:', currentValue);
            
            if (newValue !== null && newValue !== '') {
                this.textContent = newValue;
                saveOrganizadorData();
            }
        });
    });
    
    // Adicionar funcionalidade para editar horários fixos
    const scheduleItems = document.querySelectorAll('.schedule-item');
    scheduleItems.forEach(item => {
        const editButton = item.querySelector('.edit-controls button');
        if (editButton) {
            editButton.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const dayLabel = item.querySelector('.day-label').textContent;
                const timeSlot = item.querySelector('.time-slot').textContent;
                
                const newDay = prompt('Dia(s) da semana:', dayLabel);
                if (newDay !== null && newDay !== '') {
                    item.querySelector('.day-label').textContent = newDay;
                }
                
                const newTime = prompt('Horário (formato HH:MM - HH:MM):', timeSlot);
                if (newTime !== null && newTime !== '') {
                    item.querySelector('.time-slot').textContent = newTime;
                }
                
                saveOrganizadorData();
            });
        }
    });
    
    // Adicionar funcionalidade para editar eventos especiais
    const eventItems = document.querySelectorAll('.event-item');
    eventItems.forEach(item => {
        const editButton = item.querySelector('.edit-controls button');
        if (editButton) {
            editButton.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const eventDate = item.querySelector('.event-date').textContent;
                const eventTitle = item.querySelector('.event-title').textContent;
                
                const newDate = prompt('Data do evento (formato DD/MM/AAAA):', eventDate);
                if (newDate !== null && newDate !== '') {
                    item.querySelector('.event-date').textContent = newDate;
                }
                
                const newTitle = prompt('Título do evento:', eventTitle);
                if (newTitle !== null && newTitle !== '') {
                    item.querySelector('.event-title').textContent = newTitle;
                }
                
                saveOrganizadorData();
            });
        }
    });
    
    // Adicionar funcionalidade para adicionar novo horário fixo
    const addScheduleButton = document.querySelector('.schedule-list .btn-primary');
    if (addScheduleButton) {
        addScheduleButton.addEventListener('click', function() {
            const newDay = prompt('Dia(s) da semana:');
            if (newDay === null || newDay === '') return;
            
            const newTime = prompt('Horário (formato HH:MM - HH:MM):');
            if (newTime === null || newTime === '') return;
            
            const newItem = document.createElement('div');
            newItem.className = 'schedule-item';
            newItem.innerHTML = `
                <div class="day-label">${newDay}</div>
                <div class="time-slot">${newTime}</div>
                <div class="edit-controls">
                    <button class="btn btn-sm btn-outline-light"><i class="fas fa-edit"></i></button>
                </div>
            `;
            
            // Adicionar antes do botão
            this.parentNode.insertBefore(newItem, this);
            
            // Adicionar evento ao botão de edição
            const editButton = newItem.querySelector('.edit-controls button');
            editButton.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const dayLabel = newItem.querySelector('.day-label').textContent;
                const timeSlot = newItem.querySelector('.time-slot').textContent;
                
                const updatedDay = prompt('Dia(s) da semana:', dayLabel);
                if (updatedDay !== null && updatedDay !== '') {
                    newItem.querySelector('.day-label').textContent = updatedDay;
                }
                
                const updatedTime = prompt('Horário (formato HH:MM - HH:MM):', timeSlot);
                if (updatedTime !== null && updatedTime !== '') {
                    newItem.querySelector('.time-slot').textContent = updatedTime;
                }
                
                saveOrganizadorData();
            });
            
            saveOrganizadorData();
        });
    }
    
    // Adicionar funcionalidade para adicionar novo evento especial
    const addEventButton = document.querySelector('.events-list .btn-primary');
    if (addEventButton) {
        addEventButton.addEventListener('click', function() {
            const newDate = prompt('Data do evento (formato DD/MM/AAAA):');
            if (newDate === null || newDate === '') return;
            
            const newTitle = prompt('Título do evento:');
            if (newTitle === null || newTitle === '') return;
            
            const newItem = document.createElement('div');
            newItem.className = 'event-item';
            newItem.innerHTML = `
                <div class="event-date">${newDate}</div>
                <div class="event-title">${newTitle}</div>
                <div class="edit-controls">
                    <button class="btn btn-sm btn-outline-light"><i class="fas fa-edit"></i></button>
                </div>
            `;
            
            // Adicionar antes do botão
            this.parentNode.insertBefore(newItem, this);
            
            // Adicionar evento ao botão de edição
            const editButton = newItem.querySelector('.edit-controls button');
            editButton.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const eventDate = newItem.querySelector('.event-date').textContent;
                const eventTitle = newItem.querySelector('.event-title').textContent;
                
                const updatedDate = prompt('Data do evento (formato DD/MM/AAAA):', eventDate);
                if (updatedDate !== null && updatedDate !== '') {
                    newItem.querySelector('.event-date').textContent = updatedDate;
                }
                
                const updatedTitle = prompt('Título do evento:', eventTitle);
                if (updatedTitle !== null && updatedTitle !== '') {
                    newItem.querySelector('.event-title').textContent = updatedTitle;
                }
                
                saveOrganizadorData();
            });
            
            saveOrganizadorData();
        });
    }
}

// Salvar dados do organizador
function saveOrganizadorData() {
    // Coletar dados de estatísticas
    const stats = {};
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        const title = card.querySelector('h3').textContent;
        const value = card.querySelector('.stat-value').textContent;
        const change = card.querySelector('.stat-change').textContent;
        stats[title] = { value, change };
    });
    
    // Coletar dados de horários fixos
    const schedules = [];
    const scheduleItems = document.querySelectorAll('.schedule-item');
    scheduleItems.forEach(item => {
        const day = item.querySelector('.day-label').textContent;
        const time = item.querySelector('.time-slot').textContent;
        schedules.push({ day, time });
    });
    
    // Coletar dados de eventos especiais
    const events = [];
    const eventItems = document.querySelectorAll('.event-item');
    eventItems.forEach(item => {
        const date = item.querySelector('.event-date').textContent;
        const title = item.querySelector('.event-title').textContent;
        events.push({ date, title });
    });
    
    // Coletar dados de jogos planejados
    const games = [];
    const gameItems = document.querySelectorAll('.game-item');
    gameItems.forEach(item => {
        const title = item.querySelector('.game-title').textContent;
        const category = item.querySelector('.game-category').textContent;
        const badges = item.querySelectorAll('.badge');
        const days = Array.from(badges).map(badge => badge.textContent);
        games.push({ title, category, days });
    });
    
    // Criar objeto com todos os dados
    const organizadorData = {
        stats,
        schedules,
        events,
        games,
        lastUpdated: new Date().toISOString()
    };
    
    // Salvar no localStorage
    localStorage.setItem('organizadorData', JSON.stringify(organizadorData));
    
    // Mostrar notificação de sucesso
    showAdminNotification('Dados salvos com sucesso!', 'success');
}

// Carregar dados do organizador
function loadOrganizadorData() {
    // Verificar se existem dados salvos
    const savedData = localStorage.getItem('organizadorData');
    if (!savedData) return;
    
    try {
        const organizadorData = JSON.parse(savedData);
        
        // Atualizar estatísticas
        if (organizadorData.stats) {
            const statCards = document.querySelectorAll('.stat-card');
            statCards.forEach(card => {
                const title = card.querySelector('h3').textContent;
                if (organizadorData.stats[title]) {
                    card.querySelector('.stat-value').textContent = organizadorData.stats[title].value;
                    card.querySelector('.stat-change').textContent = organizadorData.stats[title].change;
                }
            });
        }
        
        // Atualizar horários fixos
        if (organizadorData.schedules && organizadorData.schedules.length > 0) {
            const scheduleList = document.querySelector('.schedule-list');
            const addButton = scheduleList.querySelector('.btn-primary');
            
            // Limpar itens existentes (exceto o botão de adicionar)
            const existingItems = scheduleList.querySelectorAll('.schedule-item');
            existingItems.forEach(item => item.remove());
            
            // Adicionar itens salvos
            organizadorData.schedules.forEach(schedule => {
                const newItem = document.createElement('div');
                newItem.className = 'schedule-item';
                newItem.innerHTML = `
                    <div class="day-label">${schedule.day}</div>
                    <div class="time-slot">${schedule.time}</div>
                    <div class="edit-controls">
                        <button class="btn btn-sm btn-outline-light"><i class="fas fa-edit"></i></button>
                    </div>
                `;
                
                // Adicionar antes do botão
                scheduleList.insertBefore(newItem, addButton);
            });
        }
        
        // Atualizar eventos especiais
        if (organizadorData.events && organizadorData.events.length > 0) {
            const eventsList = document.querySelector('.events-list');
            const addButton = eventsList.querySelector('.btn-primary');
            
            // Limpar itens existentes (exceto o botão de adicionar)
            const existingItems = eventsList.querySelectorAll('.event-item');
            existingItems.forEach(item => item.remove());
            
            // Adicionar itens salvos
            organizadorData.events.forEach(event => {
                const newItem = document.createElement('div');
                newItem.className = 'event-item';
                newItem.innerHTML = `
                    <div class="event-date">${event.date}</div>
                    <div class="event-title">${event.title}</div>
                    <div class="edit-controls">
                        <button class="btn btn-sm btn-outline-light"><i class="fas fa-edit"></i></button>
                    </div>
                `;
                
                // Adicionar antes do botão
                eventsList.insertBefore(newItem, addButton);
            });
        }
        
        // Mostrar notificação de sucesso
        showAdminNotification('Dados carregados com sucesso!', 'info');
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showAdminNotification('Erro ao carregar dados!', 'danger');
    }
}

// Resetar dados do organizador
function resetOrganizadorData() {
    if (confirm('Tem certeza que deseja resetar todos os dados? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem('organizadorData');
        location.reload();
    }
}

// Carregar dados da Twitch
function loadTwitchData(forceUpdate = false) {
    // Verificar se o usuário é administrador
    if (!window.authUtils.isAdmin()) return;
    
    // Verificar se já carregamos dados recentemente (menos de 5 minutos atrás)
    const lastTwitchUpdate = localStorage.getItem('lastTwitchUpdate');
    const now = new Date().getTime();
    
    if (!forceUpdate && lastTwitchUpdate && (now - parseInt(lastTwitchUpdate)) < 300000) {
        // Usar dados em cache
        updateTwitchStats();
        return;
    }
    
    // Simular carregamento de dados da API da Twitch
    showAdminNotification('Sincronizando com a Twitch...', 'info');
    
    // Em um ambiente real, aqui seria feita uma chamada à API da Twitch
    // Simulação de dados para demonstração
    setTimeout(() => {
        const twitchData = {
            followers: 1523,
            views: 12782,
            subscribers: 48,
            donations: 920,
            lastStream: {
                date: '24/04/2025',
                duration: '4h 15min',
                viewers: 87,
                newFollowers: 12
            },
            lastUpdated: now
        };
        
        // Salvar dados no localStorage
        localStorage.setItem('twitchData', JSON.stringify(twitchData));
        localStorage.setItem('lastTwitchUpdate', now.toString());
        
        // Atualizar estatísticas na interface
        updateTwitchStats();
        
        showAdminNotification('Dados da Twitch atualizados com sucesso!', 'success');
    }, 1500);
}

// Atualizar estatísticas com dados da Twitch
function updateTwitchStats() {
    const twitchDataStr = localStorage.getItem('twitchData');
    if (!twitchDataStr) return;
    
    try {
        const twitchData = JSON.parse(twitchDataStr);
        
        // Atualizar estatísticas
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            const title = card.querySelector('h3').textContent;
            
            if (title === 'Seguidores') {
                card.querySelector('.stat-value').textContent = twitchData.followers.toString();
                card.querySelector('.stat-change').textContent = `+${twitchData.lastStream.newFollowers} <small>esta semana</small>`;
            } else if (title === 'Visualizações') {
                card.querySelector('.stat-value').textContent = twitchData.views.toString();
                card.querySelector('.stat-change').textContent = `+${twitchData.lastStream.viewers * 3} <small>este mês</small>`;
            } else if (title === 'Associados') {
                card.querySelector('.stat-value').textContent = twitchData.subscribers.toString();
                card.querySelector('.stat-change').textContent = `+3 <small>este mês</small>`;
            } else if (title === 'Doações') {
                card.querySelector('.stat-value').textContent = `R$ ${twitchData.donations}`;
                card.querySelector('.stat-change').textContent = `+R$ 150 <small>este mês</small>`;
            }
        });
        
    } catch (error) {
        console.error('Erro ao atualizar estatísticas da Twitch:', error);
    }
}

// Mostrar notificação para administradores
function showAdminNotification(message, type) {
    // Verificar se já existe uma notificação
    let notification = document.querySelector('.admin-notification');
    
    if (!notification) {
        // Criar elemento de notificação
        notification = document.createElement('div');
        notification.className = 'admin-notification';
        document.body.appendChild(notification);
    }
    
    // Definir classe de tipo
    notification.className = `admin-notification admin-notification-${type} show`;
    
    // Definir mensagem
    notification.textContent = message;
    
    // Esconder após 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Inicializar o calendário
function initCalendar() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Atualizar o título do mês
    document.getElementById('currentMonth').textContent = getMonthName(currentMonth) + ' ' + currentYear;
    
    // Gerar o calendário
    generateCalendar(currentMonth, currentYear);
    
    // Adicionar eventos aos botões de navegação
    document.getElementById('prevMonth').addEventListener('click', function() {
        navigateMonth(-1);
    });
    
    document.getElementById('nextMonth').addEventListener('click', function() {
        navigateMonth(1);
    });
}

// Gerar o calendário para o mês e ano especificados
function generateCalendar(month, year) {
    const calendarBody = document.getElementById('calendarBody');
    calendarBody.innerHTML = '';
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let date = 1;
    
    // Criar as linhas do calendário
    for (let i = 0; i < 6; i++) {
        // Parar se já tivermos mostrado todos os dias do mês
        if (date > daysInMonth) break;
        
        const row = document.createElement('tr');
        
        // Criar as células para cada dia da semana
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            
            if (i === 0 && j < firstDay) {
                // Células vazias antes do primeiro dia do mês
                cell.textContent = '';
            } else if (date > daysInMonth) {
                // Células vazias após o último dia do mês
                break;
            } else {
                // Células com dias do mês
                const dayNumber = document.createElement('div');
                dayNumber.className = 'day-number';
                dayNumber.textContent = date;
                cell.appendChild(dayNumber);
                
                // Verificar se é hoje
                const today = new Date();
                if (date === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                    cell.classList.add('today');
                }
                
                // Verificar se tem eventos neste dia (simulação)
                if (hasEvent(date, month, year)) {
                    cell.classList.add('has-event');
                    
                    // Adicionar indicador de evento
                    const eventIndicator = document.createElement('div');
                    eventIndicator.className = 'event-dot';
                    cell.appendChild(eventIndicator);
                }
                
                // Adicionar evento de clique para adicionar/editar eventos
                cell.addEventListener('click', function() {
                    // Verificar se o usuário é administrador com acesso total
                    if (window.authUtils.isAdmin() && window.authUtils.hasFullAccess()) {
                        const eventTitle = prompt(`Adicionar evento para ${date}/${month + 1}/${year}:`);
                        if (eventTitle && eventTitle.trim() !== '') {
                            // Adicionar evento à lista
                            const eventsList = document.querySelector('.events-list');
                            const addButton = eventsList.querySelector('.btn-primary');
                            
                            const newItem = document.createElement('div');
                            newItem.className = 'event-item';
                            newItem.innerHTML = `
                                <div class="event-date">${date.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}</div>
                                <div class="event-title">${eventTitle}</div>
                                <div class="edit-controls">
                                    <button class="btn btn-sm btn-outline-light"><i class="fas fa-edit"></i></button>
                                </div>
                            `;
                            
                            // Adicionar antes do botão
                            eventsList.insertBefore(newItem, addButton);
                            
                            // Adicionar evento ao botão de edição
                            const editButton = newItem.querySelector('.edit-controls button');
                            editButton.addEventListener('click', function(e) {
                                e.stopPropagation();
                                
                                const eventDate = newItem.querySelector('.event-date').textContent;
                                const eventTitle = newItem.querySelector('.event-title').textContent;
                                
                                const updatedDate = prompt('Data do evento (formato DD/MM/AAAA):', eventDate);
                                if (updatedDate !== null && updatedDate !== '') {
                                    newItem.querySelector('.event-date').textContent = updatedDate;
                                }
                                
                                const updatedTitle = prompt('Título do evento:', eventTitle);
                                if (updatedTitle !== null && updatedTitle !== '') {
                                    newItem.querySelector('.event-title').textContent = updatedTitle;
                                }
                                
                                saveOrganizadorData();
                            });
                            
                            // Adicionar classe has-event à célula
                            this.classList.add('has-event');
                            
                            // Adicionar indicador de evento
                            if (!this.querySelector('.event-dot')) {
                                const eventIndicator = document.createElement('div');
                                eventIndicator.className = 'event-dot';
                                this.appendChild(eventIndicator);
                            }
                            
                            // Salvar dados
                            saveOrganizadorData();
                        }
                    } else {
                        alert(`Dia ${date}/${month + 1}/${year}`);
                    }
                });
                
                date++;
            }
            
            row.appendChild(cell);
        }
        
        calendarBody.appendChild(row);
    }
}

// Navegar para o mês anterior ou próximo
function navigateMonth(direction) {
    const currentMonthElement = document.getElementById('currentMonth');
    const [monthName, year] = currentMonthElement.textContent.split(' ');
    
    let month = getMonthNumber(monthName);
    let yearNum = parseInt(year);
    
    month += direction;
    
    if (month < 0) {
        month = 11;
        yearNum--;
    } else if (month > 11) {
        month = 0;
        yearNum++;
    }
    
    currentMonthElement.textContent = getMonthName(month) + ' ' + yearNum;
    generateCalendar(month, yearNum);
}

// Verificar se há eventos em uma data específica (simulação)
function hasEvent(day, month, year) {
    // Verificar se existem dados salvos
    const savedData = localStorage.getItem('organizadorData');
    if (savedData) {
        try {
            const organizadorData = JSON.parse(savedData);
            
            // Verificar se há eventos para esta data
            if (organizadorData.events && organizadorData.events.length > 0) {
                return organizadorData.events.some(event => {
                    const [eventDay, eventMonth, eventYear] = event.date.split('/').map(Number);
                    return eventDay === day && eventMonth === (month + 1) && eventYear === year;
                });
            }
        } catch (error) {
            console.error('Erro ao verificar eventos:', error);
        }
    }
    
    // Simulação de eventos - em produção, isso viria de um banco de dados
    const events = [
        { day: 15, month: 3, year: 2025 }, // 15/04/2025
        { day: 30, month: 3, year: 2025 }, // 30/04/2025
        { day: 15, month: 4, year: 2025 }, // 15/05/2025
        { day: 20, month: 4, year: 2025 }  // 20/05/2025
    ];
    
    return events.some(event => event.day === day && event.month === month && event.year === year);
}

// Obter o nome do mês a partir do número (0-11)
function getMonthName(monthNumber) {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return months[monthNumber];
}

// Obter o número do mês a partir do nome
function getMonthNumber(monthName) {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return months.indexOf(monthName);
}

// Inicializar o gráfico de receita
function initRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    
    if (!ctx) return; // Se não estiver na aba de monetização, o canvas não existirá
    
    // Verificar se existem dados salvos
    const twitchDataStr = localStorage.getItem('twitchData');
    let donationData = [350, 420, 580, 850, 0, 0, 0, 0, 0, 0, 0, 0]; // Dados padrão
    
    if (twitchDataStr) {
        try {
            const twitchData = JSON.parse(twitchDataStr);
            // Atualizar o valor do mês atual (abril = índice 3)
            donationData[3] = twitchData.donations;
        } catch (error) {
            console.error('Erro ao carregar dados da Twitch para o gráfico:', error);
        }
    }
    
    // Dados para o gráfico
    const revenueData = {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        datasets: [{
            label: 'Receita Mensal (R$)',
            data: donationData,
            backgroundColor: 'rgba(255, 51, 153, 0.2)',
            borderColor: 'rgba(255, 51, 153, 1)',
            borderWidth: 2,
            tension: 0.4
        }]
    };
    
    // Configurações do gráfico
    const config = {
        type: 'line',
        data: revenueData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            }
        }
    };
    
    // Criar o gráfico
    new Chart(ctx, config);
}

// Configurar listeners de eventos para interatividade
function setupEventListeners() {
    // Adicionar eventos para os botões de edição
    const editButtons = document.querySelectorAll('.edit-controls button');
    editButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Evitar propagação para o elemento pai
            
            // Verificar se o usuário é administrador com acesso total
            if (!window.authUtils.isAdmin() || !window.authUtils.hasFullAccess()) {
                showAdminNotification('Você não tem permissão para editar', 'danger');
                return;
            }
            
            const parentItem = this.closest('.schedule-item, .event-item, .game-item, .idea-item, .goal-item, .strategy-item, .partnership-item, .source-item, .note-item');
            
            if (parentItem) {
                // Aqui seria implementada a funcionalidade para editar o item
                const titleElement = parentItem.querySelector('.day-label, .event-title, .game-title, .idea-title, .goal-title, .strategy-title, .partnership-name, .source-name, .note-title');
                if (titleElement) {
                    const newTitle = prompt('Editar item:', titleElement.textContent);
                    if (newTitle !== null && newTitle !== '') {
                        titleElement.textContent = newTitle;
                        saveOrganizadorData();
                    }
                }
            }
        });
    });
    
    // Adicionar eventos para os botões de adicionar
    const addButtons = document.querySelectorAll('.btn-primary');
    addButtons.forEach(button => {
        if (button.textContent.includes('Adicionar')) {
            button.addEventListener('click', function() {
                // Verificar se o usuário é administrador com acesso total
                if (!window.authUtils.isAdmin() || !window.authUtils.hasFullAccess()) {
                    showAdminNotification('Você não tem permissão para adicionar', 'danger');
                    return;
                }
                
                const parentCard = this.closest('.content-card');
                const cardTitle = parentCard ? parentCard.querySelector('h3').textContent : '';
                
                // Aqui seria implementada a funcionalidade para adicionar um novo item
                alert('Adicionar novo item em: ' + cardTitle);
            });
        }
    });
    
    // Adicionar eventos para os checkboxes da checklist
    const checkboxes = document.querySelectorAll('.form-check-input');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.nextElementSibling;
            
            if (this.checked) {
                label.style.textDecoration = 'line-through';
                label.style.opacity = '0.6';
            } else {
                label.style.textDecoration = 'none';
                label.style.opacity = '1';
            }
            
            // Salvar estado se o usuário for administrador
            if (window.authUtils.isAdmin()) {
                saveOrganizadorData();
            }
        });
    });
    
    // Adicionar eventos para as abas
    const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', function(e) {
            const targetId = e.target.getAttribute('data-bs-target').substring(1);
            
            // Se a aba de monetização for selecionada, inicializar o gráfico
            if (targetId === 'monetization') {
                initRevenueChart();
            }
        });
    });
    
    // Adicionar evento para o botão de salvar do bloco de notas
    const saveNoteButton = document.querySelector('.notepad-controls .btn-primary');
    if (saveNoteButton) {
        saveNoteButton.addEventListener('click', function() {
            // Verificar se o usuário é administrador
            if (!window.authUtils.isAdmin()) {
                showAdminNotification('Você não tem permissão para salvar notas', 'danger');
                return;
            }
            
            const notepadContent = document.querySelector('.notepad textarea').value;
            
            // Salvar no localStorage
            localStorage.setItem('notepadContent', notepadContent);
            
            showAdminNotification('Nota salva com sucesso!', 'success');
        });
    }
    
    // Adicionar evento para o botão de exportar do bloco de notas
    const exportNoteButton = document.querySelector('.notepad-controls .btn-outline-light');
    if (exportNoteButton) {
        exportNoteButton.addEventListener('click', function() {
            const notepadContent = document.querySelector('.notepad textarea').value;
            
            // Criar um elemento de link para download
            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(notepadContent));
            element.setAttribute('download', 'notas_bigodinnn1.txt');
            
            element.style.display = 'none';
            document.body.appendChild(element);
            
            element.click();
            
            document.body.removeChild(element);
        });
    }
    
    // Carregar conteúdo do bloco de notas se existir
    const notepadTextarea = document.querySelector('.notepad textarea');
    if (notepadTextarea) {
        const savedContent = localStorage.getItem('notepadContent');
        if (savedContent) {
            notepadTextarea.value = savedContent;
        }
    }
    
    // Carregar dados salvos do organizador
    loadOrganizadorData();
}

// Adicionar estilos CSS para notificações de administrador
function addAdminStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .admin-notification {
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
        
        .admin-notification.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .admin-notification-success {
            background-color: #28a745;
        }
        
        .admin-notification-danger {
            background-color: #dc3545;
        }
        
        .admin-notification-info {
            background-color: #17a2b8;
        }
        
        .admin-notification-warning {
            background-color: #ffc107;
            color: #333;
        }
        
        .admin-dropdown .dropdown-menu {
            position: absolute;
            background-color: #343a40;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            padding: 0;
            display: none;
            z-index: 1000;
        }
        
        .admin-dropdown .dropdown-menu.show {
            display: block;
        }
        
        .admin-dropdown .dropdown-item {
            padding: 10px 15px;
            color: white;
            text-decoration: none;
        }
        
        .admin-dropdown .dropdown-item:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
        
        .admin-dropdown .dropdown-divider {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin: 5px 0;
        }
        
        .admin-controls {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 10px;
        }
        
        .btn-save-all, .btn-reset-all {
            padding: 8px 15px;
            border-radius: 5px;
            font-size: 0.9rem;
        }
        
        .editable {
            border-bottom: 1px dashed rgba(255, 255, 255, 0.3);
            padding: 2px 5px;
            transition: background-color 0.3s ease;
        }
        
        .editable:hover {
            background-color: rgba(255, 255, 255, 0.1);
            cursor: pointer;
        }
        
        .admin-mode .edit-controls button {
            opacity: 1;
        }
        
        .admin-mode .btn-primary {
            opacity: 1;
        }
    `;
    
    document.head.appendChild(style);
}

// Adicionar estilos para administrador
addAdminStyles();
