// JavaScript para a página de perfil (perfil.js)

document.addEventListener("DOMContentLoaded", function() {
    const API_BASE_URL = "http://localhost:5000/api";
    let currentUser = null;
    const token = localStorage.getItem("session_token") || sessionStorage.getItem("session_token");

    const profilePicturePreview = document.getElementById("profilePicturePreview");
    const profilePictureUpload = document.getElementById("profilePictureUpload");
    const userProfileUsername = document.getElementById("userProfileUsername");
    const userProfileEmail = document.getElementById("userProfileEmail");
    const userProfileBadge = document.getElementById("userProfileBadge");
    const profileUpdateForm = document.getElementById("profileUpdateForm");
    const profileUsernameInput = document.getElementById("profileUsernameInput");
    const profileEmailInput = document.getElementById("profileEmailInput");
    const passwordChangeForm = document.getElementById("passwordChangeForm");
    const currentPasswordInput = document.getElementById("currentPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
    const userAssociations = document.getElementById("userAssociations");
    const logoutButton = document.getElementById("logoutButton");

    if (!token) {
        showNotification("Acesso não autorizado. Faça login para continuar.", "danger");
        setTimeout(() => { window.location.href = "login.html"; }, 2000);
        return;
    }

    async function fetchUserProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/profile/me`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 401) {
                    showNotification("Sessão expirada ou inválida. Faça login novamente.", "danger");
                    localStorage.removeItem("session_token");
                    sessionStorage.removeItem("session_token");
                    localStorage.removeItem("currentUser");
                    setTimeout(() => { window.location.href = "login.html"; }, 2000);
                }
                throw new Error(`Erro ao buscar perfil: ${response.statusText}`);
            }
            const data = await response.json();
            currentUser = data;
            displayUserProfile(data);
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
            showNotification("Não foi possível carregar os dados do perfil.", "danger");
        }
    }

    function displayUserProfile(userData) {
        if (userProfileUsername) userProfileUsername.textContent = userData.username;
        if (userProfileEmail) userProfileEmail.textContent = userData.email;
        if (profileUsernameInput) profileUsernameInput.value = userData.username;
        if (profileEmailInput) profileEmailInput.value = userData.email;
        if (profilePicturePreview && userData.profile_picture_url) {
            profilePicturePreview.src = userData.profile_picture_url.startsWith("http") ? userData.profile_picture_url : `${API_BASE_URL.replace("/api","")}${userData.profile_picture_url}`;
        } else if (profilePicturePreview) {
            profilePicturePreview.src = "assets/images/default-avatar.png";
        }

        // Display badge based on role or associate level
        if (userProfileBadge) {
            let badgeText = "Utilizador Comum";
            let badgeClass = "bg-secondary";
            if (userData.role === "admin") {
                badgeText = "Administrador";
                badgeClass = "bg-danger";
            } else if (userData.associate_level) {
                badgeText = `Associado ${userData.associate_level.charAt(0).toUpperCase() + userData.associate_level.slice(1)}`;
                switch (userData.associate_level) {
                    case "fino": badgeClass = "bg-info text-dark"; break;
                    case "raiz": badgeClass = "bg-success"; break;
                    case "grosso": badgeClass = "bg-warning text-dark"; break;
                    default: badgeClass = "bg-primary";
                }
            }
            userProfileBadge.textContent = badgeText;
            userProfileBadge.className = `badge ${badgeClass}`;
        }
        // Display association info
        if(userAssociations){
            if(userData.associate_level && userData.associated_since){
                const sinceDate = new Date(userData.associated_since).toLocaleDateString("pt-BR");
                userAssociations.innerHTML = `<p>Você é um Associado ${userData.associate_level.charAt(0).toUpperCase() + userData.associate_level.slice(1)} desde ${sinceDate}.</p>`;
            } else {
                userAssociations.innerHTML = `<p>Você ainda não é um associado. <a href="associados.html">Clique aqui para saber mais!</a></p>`;
            }
        }
    }

    if (profilePictureUpload) {
        profilePictureUpload.addEventListener("change", async function(event) {
            const file = event.target.files[0];
            if (file) {
                const formData = new FormData();
                formData.append("profile_picture", file);

                try {
                    showNotification("A carregar nova foto de perfil...", "info");
                    const response = await fetch(`${API_BASE_URL}/profile/upload_picture`, {
                        method: "POST",
                        headers: { "Authorization": `Bearer ${token}` },
                        body: formData
                    });
                    const data = await response.json();
                    if (response.ok) {
                        showNotification("Foto de perfil atualizada com sucesso!", "success");
                        if (profilePicturePreview) profilePicturePreview.src = data.file_url.startsWith("http") ? data.file_url : `${API_BASE_URL.replace("/api","")}${data.file_url}`;
                        fetchUserProfile(); // Refresh profile data
                    } else {
                        showNotification(data.error || "Erro ao atualizar foto de perfil.", "danger");
                    }
                } catch (error) {
                    console.error("Erro no upload da foto:", error);
                    showNotification("Erro de conexão ao tentar atualizar a foto.", "danger");
                }
            }
        });
    }

    if (profileUpdateForm) {
        profileUpdateForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            const newUsername = profileUsernameInput.value;
            if (!newUsername.trim()) {
                showNotification("O nome de utilizador não pode estar vazio.", "warning");
                return;
            }
            try {
                showNotification("A atualizar perfil...", "info");
                const response = await fetch(`${API_BASE_URL}/profile/update`, {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ username: newUsername })
                });
                const data = await response.json();
                if (response.ok) {
                    showNotification("Perfil atualizado com sucesso!", "success");
                    fetchUserProfile(); // Refresh displayed data
                    // Update username in navbar if login.js is managing it
                    if (window.authUtils && typeof window.authUtils.updateLoginLink === "function") {
                        window.authUtils.updateLoginLink(newUsername, currentUser.role);
                    }
                     const storedUser = JSON.parse(localStorage.getItem("currentUser"));
                     if(storedUser) {
                        storedUser.username = newUsername;
                        localStorage.setItem("currentUser", JSON.stringify(storedUser));
                        checkLoggedInStatus(); // from login.js to update navbar
                     }

                } else {
                    showNotification(data.error || "Erro ao atualizar perfil.", "danger");
                }
            } catch (error) {
                console.error("Erro ao atualizar perfil:", error);
                showNotification("Erro de conexão ao tentar atualizar o perfil.", "danger");
            }
        });
    }

    if (passwordChangeForm) {
        passwordChangeForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmNewPassword = confirmNewPasswordInput.value;

            if (!currentPassword || !newPassword || !confirmNewPassword) {
                showNotification("Preencha todos os campos de senha.", "warning");
                return;
            }
            if (newPassword.length < 8) {
                showNotification("A nova senha deve ter pelo menos 8 caracteres.", "warning");
                return;
            }
            if (newPassword !== confirmNewPassword) {
                showNotification("As novas senhas não coincidem.", "warning");
                return;
            }

            try {
                showNotification("A alterar senha...", "info");
                const response = await fetch(`${API_BASE_URL}/profile/change_password`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
                });
                const data = await response.json();
                if (response.ok) {
                    showNotification("Senha alterada com sucesso!", "success");
                    passwordChangeForm.reset();
                } else {
                    showNotification(data.error || "Erro ao alterar senha.", "danger");
                }
            } catch (error) {
                console.error("Erro ao alterar senha:", error);
                showNotification("Erro de conexão ao tentar alterar a senha.", "danger");
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", async function() {
            // Use logoutUser from login.js if available and it handles UI updates
            if (typeof logoutUser === "function") {
                logoutUser();
            } else { // Fallback basic logout
                localStorage.removeItem("session_token");
                sessionStorage.removeItem("session_token");
                localStorage.removeItem("currentUser");
                showNotification("Logout realizado com sucesso!", "success");
                setTimeout(() => { window.location.href = "index.html"; }, 1000);
            }
        });
    }

    // Initial load
    fetchUserProfile();
});

// Re-use showNotification from login.js if it's globally available
// If not, define it here or ensure login.js is loaded first and showNotification is global.
// Assuming showNotification is made global or login.js is loaded before perfil.js
// function showNotification(message, type) { ... } // Definition from login.js

