// admin.js - Lógica para o Painel de Administração

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("session_token") || sessionStorage.getItem("session_token");
    if (!token) {
        showAdminNotification("Acesso não autorizado. Faça login.", "danger");
        redirectToLogin();
        return;
    }
    fetchUserProfileAndSetupPanel(token);
});

const API_ADMIN_URL = "/api/admin";
const API_URL = "/api";

let userGrowthChartInstance = null;
let currentUsersPage = 1;
let currentUserRole = null; // Variável para armazenar o papel do utilizador logado (admin/moderator)

function redirectToLogin(){
    setTimeout(() => { window.location.href = "login.html"; }, 3000);
}

async function fetchUserProfileAndSetupPanel(token) {
    try {
        const response = await fetch(`${API_URL}/profile/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Falha ao verificar o perfil do utilizador.");
        }
        const userData = await response.json();
        currentUserRole = userData.role; // Armazenar o papel do utilizador

        if (currentUserRole !== "admin" && currentUserRole !== "moderator") {
            showAdminNotification("Acesso negado. Esta área é restrita a administradores e moderadores.", "danger");
            setTimeout(() => { window.location.href = "index.html"; }, 3000);
            return;
        }

        // Se for admin ou moderador, prosseguir com o carregamento do painel
        adjustPanelForRole();
        setupEventListeners();
        // Carregar a secção inicial apropriada com base no papel
        if (currentUserRole === "admin") {
            navigateToSection("dashboard-section"); 
            document.querySelector(".admin-nav-link[data-section=\"dashboard-section\"]").classList.add("active-link");
        } else if (currentUserRole === "moderator") {
            navigateToSection("content-approval-section"); // Moderadores começam na aprovação de conteúdo
            document.querySelector(".admin-nav-link[data-section=\"content-approval-section\"]").classList.add("active-link");
        }

    } catch (error) {
        console.error("Erro ao verificar perfil e configurar painel:", error);
        showAdminNotification(`Erro ao verificar permissões: ${error.message}. Tente fazer login novamente.`, "danger");
        localStorage.removeItem("session_token");
        sessionStorage.removeItem("session_token");
        localStorage.removeItem("currentUser");
        redirectToLogin();
    }
}

function adjustPanelForRole() {
    const adminNav = document.querySelector(".admin-nav ul");
    if (!adminNav) return;

    const allNavLinks = {
        "dashboard-section": adminNav.querySelector("li a[data-section=\"dashboard-section\"]"),
        "user-management-section": adminNav.querySelector("li a[data-section=\"user-management-section\"]"),
        "content-approval-section": adminNav.querySelector("li a[data-section=\"content-approval-section\"]"),
        "chat-moderation-section": adminNav.querySelector("li a[data-section=\"chat-moderation-section\"]")
        // Adicionar outras secções aqui se existirem (ex: Site Settings)
    };

    if (currentUserRole === "moderator") {
        // Ocultar links e secções não permitidas para moderadores
        if (allNavLinks["dashboard-section"]) allNavLinks["dashboard-section"].parentElement.style.display = "none";
        if (allNavLinks["user-management-section"]) allNavLinks["user-management-section"].parentElement.style.display = "none";
        // Garantir que as secções permitidas estão visíveis (caso tenham sido escondidas por defeito)
        if (allNavLinks["content-approval-section"]) allNavLinks["content-approval-section"].parentElement.style.display = "";
        if (allNavLinks["chat-moderation-section"]) allNavLinks["chat-moderation-section"].parentElement.style.display = "";
    } else if (currentUserRole === "admin") {
        // Garantir que todos os links estão visíveis para admin
        for (const key in allNavLinks) {
            if (allNavLinks[key]) {
                allNavLinks[key].parentElement.style.display = "";
            }
        }
    }
}

function setupEventListeners() {
    const adminNavLinks = document.querySelectorAll(".admin-nav-link");
    adminNavLinks.forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const sectionId = link.getAttribute("data-section");
            // Verificar se o moderador está a tentar aceder a uma secção não permitida (dupla verificação)
            if (currentUserRole === "moderator" && (sectionId === "dashboard-section" || sectionId === "user-management-section")) {
                showAdminNotification("Acesso negado a esta secção.", "warning");
                return;
            }
            navigateToSection(sectionId);
            adminNavLinks.forEach(l => l.classList.remove("active-link"));
            link.classList.add("active-link");
        });
    });

    const logoutAdminBtn = document.getElementById("logout-admin-btn");
    if (logoutAdminBtn) {
        logoutAdminBtn.addEventListener("click", handleAdminLogout);
    }

    const userSearchBtn = document.getElementById("user-search-btn");
    if(userSearchBtn) userSearchBtn.addEventListener("click", () => searchUsers(1));
    const userSearchInput = document.getElementById("user-search-input");
    if(userSearchInput) userSearchInput.addEventListener("keypress", (e) => { if(e.key === "Enter") searchUsers(1); });

    const modalCloseBtn = document.querySelector(".modal .close-btn");
    const modalCancelBtn = document.getElementById("modal-cancel-btn");
    if(modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
    if(modalCancelBtn) modalCancelBtn.addEventListener("click", closeModal);
    window.addEventListener("click", (event) => {
        const modal = document.getElementById("admin-modal");
        if (modal && event.target == modal) {
            closeModal();
        }
    });
}

function navigateToSection(sectionId) {
    const token = localStorage.getItem("session_token") || sessionStorage.getItem("session_token");
    if (!token) return;

    // Segurança adicional: verificar se o papel permite aceder à secção
    if (currentUserRole === "moderator" && (sectionId === "dashboard-section" || sectionId === "user-management-section")) {
        showAdminNotification("Acesso não permitido a esta secção.", "danger");
        // Redirecionar para uma secção permitida por defeito para moderadores
        document.getElementById("content-approval-section").classList.add("active-section");
        loadPendingNews(token);
        loadPendingClips(token);
        return;
    }

    document.querySelectorAll(".admin-section").forEach(section => {
        section.classList.remove("active-section");
    });
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add("active-section");
        if (sectionId === "dashboard-section" && currentUserRole === "admin") {
            loadDashboardData(token);
        } else if (sectionId === "user-management-section" && currentUserRole === "admin") {
            loadUsers(1, token);
        } else if (sectionId === "content-approval-section") {
            loadPendingNews(token);
            loadPendingClips(token);
        } else if (sectionId === "chat-moderation-section") {
            loadChatModerationData(token); // Implementar esta função
        }
    }
}

async function loadDashboardData(token) {
    if (currentUserRole !== "admin") return; // Só admin pode ver o dashboard completo
    
    document.getElementById("stats-users-today").textContent = "0"; 
    document.getElementById("stats-users-week").textContent = "0"; 
    document.getElementById("stats-users-month").textContent = "0"; 
    document.getElementById("stats-donations-total").textContent = "R$ 0,00"; 
    document.getElementById("stats-associates-active").textContent = "0"; 

    try {
        const [pendingNewsRes, pendingClipsRes, usersRes] = await Promise.all([
            fetch(`${API_ADMIN_URL}/news/pending`, { headers: { "Authorization": `Bearer ${token}` } }),
            fetch(`${API_ADMIN_URL}/clips/pending`, { headers: { "Authorization": `Bearer ${token}` } }),
            fetch(`${API_ADMIN_URL}/users?per_page=1`, { headers: { "Authorization": `Bearer ${token}` } }) // Para obter total de utilizadores
        ]);

        if (pendingNewsRes.ok) {
            const pendingNews = await pendingNewsRes.json();
            document.getElementById("stats-news-pending").textContent = pendingNews.length;
        }
        if (pendingClipsRes.ok) {
            const pendingClips = await pendingClipsRes.json();
            document.getElementById("stats-clips-pending").textContent = pendingClips.length;
        }
        if (usersRes.ok) {
            const usersData = await usersRes.json();
            // Assumindo que o backend não tem estatísticas diárias/semanais/mensais prontas
            // e o total de utilizadores pode ser usado como uma métrica geral.
            document.getElementById("stats-users-month").textContent = usersData.total_users || "0";
        }

    } catch (error) {
        console.error("Erro ao carregar estatísticas do painel:", error);
    }
    renderUserGrowthChart();
}

function renderUserGrowthChart() {
    if (currentUserRole !== "admin") return;
    const ctx = document.getElementById("userGrowthChart").getContext("2d");
    if (userGrowthChartInstance) {
        userGrowthChartInstance.destroy();
    }
    userGrowthChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"], 
            datasets: [{
                label: "Novos Utilizadores",
                data: [10, 25, 15, 40, 30, 55], 
                borderColor: "#9146FF",
                backgroundColor: "rgba(145, 70, 255, 0.1)",
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { color: "#e0e0e0" }, grid: { color: "rgba(224, 224, 224, 0.1)" } },
                x: { ticks: { color: "#e0e0e0" }, grid: { color: "rgba(224, 224, 224, 0.1)" } }
            },
            plugins: { legend: { labels: { color: "#e0e0e0" } } }
        }
    });
}

async function loadUsers(page = 1, token, searchTerm = "") {
    if (currentUserRole !== "admin") return; // Apenas admin pode gerir utilizadores
    currentUsersPage = page;
    let url = `${API_ADMIN_URL}/users?page=${page}&per_page=10`;
    // A pesquisa no frontend é um fallback, idealmente seria no backend.
    // if (searchTerm) { url += `&search=${encodeURIComponent(searchTerm)}`; }

    try {
        const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        if (!response.ok) throw new Error("Falha ao carregar utilizadores.");
        const data = await response.json();
        
        const usersTableBody = document.querySelector("#users-table tbody");
        usersTableBody.innerHTML = ""; 

        let filteredUsers = data.users;
        if(searchTerm){
            const lowerSearchTerm = searchTerm.toLowerCase();
            filteredUsers = data.users.filter(user => 
                user.username.toLowerCase().includes(lowerSearchTerm) || 
                user.email.toLowerCase().includes(lowerSearchTerm)
            );
        }

        filteredUsers.forEach(user => {
            const row = usersTableBody.insertRow();
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>
                    <select class="user-role-select" data-user-id="${user.id}" ${user.username === "BigodiNNN" && user.role === "admin" ? "disabled" : ""}>
                        <option value="user" ${user.role === "user" ? "selected" : ""}>Utilizador</option>
                        <option value="moderator" ${user.role === "moderator" ? "selected" : ""}>Moderador</option>
                        <option value="fino" ${user.role === "fino" ? "selected" : ""}>Fino</option>
                        <option value="raiz" ${user.role === "raiz" ? "selected" : ""}>Raiz</option>
                        <option value="grosso" ${user.role === "grosso" ? "selected" : ""}>Grosso</option>
                        <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
                    </select>
                </td>
                <td>${user.association ? user.association.tier + (user.association.is_active ? " (Ativo)" : " (Inativo)") : "Não"}</td>
                <td>${user.is_chat_muted ? (user.chat_mute_expires_at ? `Sim (expira ${new Date(user.chat_mute_expires_at).toLocaleString()})` : "Sim") : "Não"}</td>
                <td>${user.is_chat_banned ? "Sim" : "Não"}</td>
                <td>
                    <button class="actions-btn btn btn-secondary btn-sm" onclick="toggleMuteUser(${user.id}, ${user.is_chat_muted})">${user.is_chat_muted ? "Desmutar" : "Mutar"}</button>
                    <button class="actions-btn btn btn-danger btn-sm" onclick="toggleBanUser(${user.id}, ${user.is_chat_banned})">${user.is_chat_banned ? "Desbanir" : "Banir"}</button>
                </td>
            `;
        });
        setupRoleChangeListeners(token);
        renderUserPagination(data.total_pages, data.current_page, token, searchTerm);
    } catch (error) {
        console.error("Erro ao carregar utilizadores:", error);
        showAdminNotification("Erro ao carregar lista de utilizadores.", "danger");
    }
}

function setupRoleChangeListeners(token) {
    if (currentUserRole !== "admin") return;
    document.querySelectorAll(".user-role-select").forEach(select => {
        select.addEventListener("change", async (event) => {
            const userId = event.target.dataset.userId;
            const newRole = event.target.value;
            if (confirm(`Tem certeza que deseja alterar o papel do utilizador ID ${userId} para ${newRole}?`)) {
                try {
                    const response = await fetch(`${API_ADMIN_URL}/users/${userId}/update-role`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ role: newRole })
                    });
                    const result = await response.json();
                    if (response.ok) {
                        showAdminNotification("Papel do utilizador atualizado com sucesso!", "success");
                        loadUsers(currentUsersPage, token, document.getElementById("user-search-input").value);
                    } else {
                        throw new Error(result.error || "Falha ao atualizar papel.");
                    }
                } catch (err) {
                    showAdminNotification(`Erro: ${err.message}`, "danger");
                    // Reverter visualmente se a API falhar
                    const originalOption = Array.from(event.target.options).find(opt => opt.defaultSelected);
                    if(originalOption) event.target.value = originalOption.value;
                }
            }
        });
    });
}

function renderUserPagination(totalPages, currentPage, token, searchTerm) {
    if (currentUserRole !== "admin") return;
    const paginationContainer = document.getElementById("user-pagination");
    paginationContainer.innerHTML = "";
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        button.className = "btn btn-sm " + (i === currentPage ? "btn-primary" : "btn-secondary");
        button.addEventListener("click", () => loadUsers(i, token, searchTerm));
        paginationContainer.appendChild(button);
    }
}

function searchUsers(page = 1){
    if (currentUserRole !== "admin") return;
    const token = localStorage.getItem("session_token") || sessionStorage.getItem("session_token");
    const searchTerm = document.getElementById("user-search-input").value;
    loadUsers(page, token, searchTerm);
}

async function toggleMuteUser(userId, isMuted) {
    const token = localStorage.getItem("session_token") || sessionStorage.getItem("session_token");
    const action = isMuted ? "unmute" : "mute";
    let duration = null;
    if (!isMuted) {
        const durationStr = prompt("Por quantos minutos deseja mutar o utilizador? (Deixe em branco para 60 min)", "60");
        if (durationStr === null) return; 
        duration = parseInt(durationStr) || 60;
    }

    openModal(
        `Confirmar ${action === "mute" ? "Mutar" : "Desmutar"}`,
        `Tem certeza que deseja ${action === "mute" ? "mutar" : "desmutar"} o utilizador ID ${userId}${action === "mute" ? " por " + duration + " minutos" : ""}?`,
        async () => {
            try {
                const response = await fetch(`${API_ADMIN_URL}/chat/users/${userId}/${action}`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` 
                    },
                    body: action === "mute" ? JSON.stringify({ duration_minutes: duration }) : null
                });
                const result = await response.json();
                if (response.ok) {
                    showAdminNotification(result.message, "success");
                    // Atualizar a lista de utilizadores se estiver na secção de gestão, ou a secção de moderação de chat
                    if (document.getElementById("user-management-section").classList.contains("active-section") && currentUserRole === "admin") {
                        loadUsers(currentUsersPage, token, document.getElementById("user-search-input").value);
                    } else if (document.getElementById("chat-moderation-section").classList.contains("active-section")){
                        loadChatModerationData(token); // Recarregar dados da moderação de chat
                    }
                } else {
                    throw new Error(result.error || `Falha ao ${action} utilizador.`);
                }
            } catch (err) {
                showAdminNotification(`Erro: ${err.message}`, "danger");
            }
            closeModal();
        }
    );
}

async function toggleBanUser(userId, isBanned) {
    const token = localStorage.getItem("session_token") || sessionStorage.getItem("session_token");
    const action = isBanned ? "unban" : "ban";
    openModal(
        `Confirmar ${action === "ban" ? "Banir" : "Desbanir"}`,
        `Tem certeza que deseja ${action === "ban" ? "banir (permanentemente do chat)" : "desbanir"} o utilizador ID ${userId}?`,
        async () => {
            try {
                const response = await fetch(`${API_ADMIN_URL}/chat/users/${userId}/${action}`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await response.json();
                if (response.ok) {
                    showAdminNotification(result.message, "success");
                    if (document.getElementById("user-management-section").classList.contains("active-section") && currentUserRole === "admin") {
                        loadUsers(currentUsersPage, token, document.getElementById("user-search-input").value);
                    } else if (document.getElementById("chat-moderation-section").classList.contains("active-section")){
                        loadChatModerationData(token);
                    }
                } else {
                    throw new Error(result.error || `Falha ao ${action} utilizador.`);
                }
            } catch (err) {
                showAdminNotification(`Erro: ${err.message}`, "danger");
            }
            closeModal();
        }
    );
}

async function loadPendingNews(token) {
    try {
        const response = await fetch(`${API_ADMIN_URL}/news/pending`, { headers: { "Authorization": `Bearer ${token}` } });
        if (!response.ok) throw new Error("Falha ao carregar notícias pendentes.");
        const newsItems = await response.json();
        const container = document.getElementById("pending-news-list");
        container.innerHTML = newsItems.length === 0 ? "<p>Nenhuma notícia pendente.</p>" : "";
        newsItems.forEach(news => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "content-item";
            itemDiv.innerHTML = `
                <h4>${news.title}</h4>
                <p>${news.content.substring(0, 100)}...</p>
                <p class="author">Enviado por: ${news.author_username || "Desconhecido"} em ${new Date(news.created_at).toLocaleDateString()}</p>
                <div class="actions">
                    <button class="btn btn-success btn-sm" onclick="approveContent("news", ${news.id})">Aprovar</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectContent("news", ${news.id})">Rejeitar</button>
                    <button class="btn btn-secondary btn-sm" onclick="viewContentDetails("news", ${news.id})">Ver Detalhes</button>
                </div>
            `;
            container.appendChild(itemDiv);
        });
    } catch (error) {
        console.error("Erro ao carregar notícias pendentes:", error);
        document.getElementById("pending-news-list").innerHTML = "<p>Erro ao carregar notícias.</p>";
    }
}

async function loadPendingClips(token) {
    try {
        const response = await fetch(`${API_ADMIN_URL}/clips/pending`, { headers: { "Authorization": `Bearer ${token}` } });
        if (!response.ok) throw new Error("Falha ao carregar clipes pendentes.");
        const clips = await response.json();
        const container = document.getElementById("pending-clips-list");
        container.innerHTML = clips.length === 0 ? "<p>Nenhum clipe pendente.</p>" : "";
        clips.forEach(clip => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "content-item";
            itemDiv.innerHTML = `
                <h4>${clip.title}</h4>
                <p><a href="${clip.clip_url}" target="_blank">Ver Clipe</a></p>
                <p class="author">Enviado por: ${clip.submitter_username || "Desconhecido"} em ${new Date(clip.created_at).toLocaleDateString()}</p>
                <div class="actions">
                    <button class="btn btn-success btn-sm" onclick="approveContent("clips", ${clip.id})">Aprovar</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectContent("clips", ${clip.id})">Rejeitar</button>
                </div>
            `;
            container.appendChild(itemDiv);
        });
    } catch (error) {
        console.error("Erro ao carregar clipes pendentes:", error);
        document.getElementById("pending-clips-list").innerHTML = "<p>Erro ao carregar clipes.</p>";
    }
}

async function approveContent(type, id) {
    const token = localStorage.getItem("session_token") || sessionStorage.getItem("session_token");
    openModal(
        "Confirmar Aprovação",
        `Tem certeza que deseja aprovar este ${type === "news" ? "artigo de notícia" : "clipe"} (ID: ${id})?`,
        async () => {
            try {
                const response = await fetch(`${API_ADMIN_URL}/${type}/${id}/approve`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await response.json();
                if (response.ok) {
                    showAdminNotification(`${type === "news" ? "Notícia" : "Clipe"} aprovado com sucesso!`, "success");
                    if (type === "news") loadPendingNews(token); else loadPendingClips(token);
                    if (currentUserRole === "admin") loadDashboardData(token); 
                } else {
                    throw new Error(result.error || "Falha ao aprovar conteúdo.");
                }
            } catch (err) {
                showAdminNotification(`Erro: ${err.message}`, "danger");
            }
            closeModal();
        }
    );
}

async function rejectContent(type, id) {
    const token = localStorage.getItem("session_token") || sessionStorage.getItem("session_token");
    openModal(
        "Confirmar Rejeição",
        `Tem certeza que deseja rejeitar este ${type === "news" ? "artigo de notícia" : "clipe"} (ID: ${id})?`,
        async () => {
            try {
                const response = await fetch(`${API_ADMIN_URL}/${type}/${id}/reject`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await response.json();
                if (response.ok) {
                    showAdminNotification(`${type === "news" ? "Notícia" : "Clipe"} rejeitado com sucesso!`, "success");
                    if (type === "news") loadPendingNews(token); else loadPendingClips(token);
                    if (currentUserRole === "admin") loadDashboardData(token); 
                } else {
                    throw new Error(result.error || "Falha ao rejeitar conteúdo.");
                }
            } catch (err) {
                showAdminNotification(`Erro: ${err.message}`, "danger");
            }
            closeModal();
        }
    );
}

function viewContentDetails(type, id) {
    showAdminNotification(`Visualizar detalhes para ${type} ID ${id} (Em desenvolvimento).`, "info");
}

async function loadChatModerationData(token) {
    // Esta função irá popular a secção de moderação de chat.
    // Por agora, pode ser uma lista de utilizadores com opções de mutar/banir,
    // ou uma interface para ver mensagens reportadas (se essa funcionalidade existir).
    // Para este exemplo, vamos reusar a listagem de utilizadores, mas focada em ações de moderação.
    // No entanto, a secção "user-management-section" já tem estas ações.
    // Uma secção dedicada "chat-moderation-section" poderia ter:
    // 1. Lista de utilizadores atualmente mutados/banidos.
    // 2. Campo de pesquisa para encontrar um utilizador e aplicar mute/ban.
    // 3. Log de ações de moderação (se implementado no backend).

    const container = document.getElementById("chat-moderation-content");
    if (!container) return;

    container.innerHTML = `
        <h3>Moderação de Chat</h3>
        <p>Aqui poderá ver utilizadores mutados/banidos e aplicar ações.</p>
        <div class="user-search-container">
            <input type="text" id="chat-mod-user-search-input" placeholder="Pesquisar utilizador por nome ou ID...">
            <button id="chat-mod-user-search-btn" class="btn btn-primary">Pesquisar</button>
        </div>
        <div id="chat-mod-users-list"></div>
        <div id="chat-mod-user-details"></div>
    `;

    const searchBtn = document.getElementById("chat-mod-user-search-btn");
    const searchInput = document.getElementById("chat-mod-user-search-input");

    searchBtn.addEventListener("click", async () => {
        const searchTerm = searchInput.value.trim();
        if (!searchTerm) {
            showAdminNotification("Digite um nome ou ID para pesquisar.", "warning");
            return;
        }
        await searchAndDisplayUserForMod(searchTerm, token);
    });
    searchInput.addEventListener("keypress", async (e) => {
        if (e.key === "Enter") {
            const searchTerm = searchInput.value.trim();
            if (!searchTerm) return;
            await searchAndDisplayUserForMod(searchTerm, token);
        }
    });
}

async function searchAndDisplayUserForMod(searchTerm, token) {
    const detailsContainer = document.getElementById("chat-mod-user-details");
    detailsContainer.innerHTML = "<p>A pesquisar...</p>";
    try {
        // O backend precisaria de uma rota para pesquisar utilizadores por nome/ID para moderação
        // Por agora, vamos simular a busca no endpoint de listagem (não ideal para muitos utilizadores)
        const response = await fetch(`${API_ADMIN_URL}/users?per_page=200`, { headers: { "Authorization": `Bearer ${token}` } }); // Fetch a larger list
        if (!response.ok) throw new Error("Falha ao pesquisar utilizador.");
        const data = await response.json();
        
        const foundUser = data.users.find(user => 
            user.username.toLowerCase() === searchTerm.toLowerCase() || 
            user.id.toString() === searchTerm
        );

        if (foundUser) {
            detailsContainer.innerHTML = `
                <h4>Utilizador: ${foundUser.username} (ID: ${foundUser.id})</h4>
                <p>Email: ${foundUser.email}</p>
                <p>Papel: ${foundUser.role}</p>
                <p>Mutado: ${foundUser.is_chat_muted ? (foundUser.chat_mute_expires_at ? `Sim (expira ${new Date(foundUser.chat_mute_expires_at).toLocaleString()})` : "Sim") : "Não"}</p>
                <p>Banido: ${foundUser.is_chat_banned ? "Sim" : "Não"}</p>
                <div class="actions">
                    <button class="actions-btn btn btn-secondary btn-sm" onclick="toggleMuteUser(${foundUser.id}, ${foundUser.is_chat_muted})">${foundUser.is_chat_muted ? "Desmutar" : "Mutar"}</button>
                    <button class="actions-btn btn btn-danger btn-sm" onclick="toggleBanUser(${foundUser.id}, ${foundUser.is_chat_banned})">${foundUser.is_chat_banned ? "Desbanir" : "Banir"}</button>
                </div>
            `;
        } else {
            detailsContainer.innerHTML = "<p>Utilizador não encontrado.</p>";
        }
    } catch (error) {
        console.error("Erro ao pesquisar utilizador para moderação:", error);
        detailsContainer.innerHTML = "<p>Erro ao pesquisar utilizador.</p>";
        showAdminNotification("Erro ao pesquisar utilizador.", "danger");
    }
}


function handleAdminLogout() {
    openModal(
        "Confirmar Logout",
        "Tem certeza que deseja sair do Painel de Administração?",
        () => {
            localStorage.removeItem("session_token");
            sessionStorage.removeItem("session_token");
            localStorage.removeItem("currentUser");
            currentUserRole = null; // Limpar papel do utilizador
            showAdminNotification("Logout realizado com sucesso!", "success");
            redirectToLogin();
            closeModal();
        }
    );
}

let confirmCallback = null;
function openModal(title, message, onConfirm) {
    const modalTitle = document.getElementById("modal-title");
    const modalMessage = document.getElementById("modal-message");
    const adminModal = document.getElementById("admin-modal");
    const modalConfirmBtn = document.getElementById("modal-confirm-btn");

    if(modalTitle) modalTitle.textContent = title;
    if(modalMessage) modalMessage.textContent = message;
    confirmCallback = onConfirm;
    if(adminModal) adminModal.style.display = "block";
    if(modalConfirmBtn) modalConfirmBtn.onclick = () => {
        if(confirmCallback) confirmCallback();
    };
}

function closeModal() {
    const adminModal = document.getElementById("admin-modal");
    if(adminModal) adminModal.style.display = "none";
    confirmCallback = null;
}

function showAdminNotification(message, type = "info") {
    console.log(`Admin Notification (${type}): ${message}`);
    // Substituir por um sistema de notificação mais robusto se necessário
    const notificationArea = document.getElementById("admin-notifications");
    if (notificationArea) {
        const notificationDiv = document.createElement("div");
        notificationDiv.className = `admin-notification admin-notification-${type}`;
        notificationDiv.textContent = message;
        notificationArea.appendChild(notificationDiv);
        // Remover notificação após alguns segundos
        setTimeout(() => {
            notificationDiv.remove();
        }, 5000);
    } else {
        alert(`[Admin Panel] ${type.toUpperCase()}: ${message}`); // Fallback
    }
}

window.toggleMuteUser = toggleMuteUser;
window.toggleBanUser = toggleBanUser;
window.approveContent = approveContent;
window.rejectContent = rejectContent;
window.viewContentDetails = viewContentDetails;

