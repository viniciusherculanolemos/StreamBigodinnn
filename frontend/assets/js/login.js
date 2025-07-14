// JavaScript para a página de login e cadastro com integração ao backend Flask

document.addEventListener("DOMContentLoaded", function() {
    setupPasswordToggle();
    setupPasswordStrength();
    setupFormValidationAndSubmission(); // Combined setup
    checkLoggedInStatus(); // Check on load
    addNotificationStyles();
});

const API_BASE_URL = "http://localhost:5000/api"; // Adjust if your backend runs elsewhere

async function checkLoggedInStatus() {
    const token = localStorage.getItem("session_token") || sessionStorage.getItem("session_token");
    const loginLink = document.querySelector(".btn-login");

    if (token) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/check_session`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            const data = await response.json();
            if (response.ok && data.authenticated) {
                if (loginLink) {
                    loginLink.innerHTML = `<i class="fas fa-user"></i> ${data.username}`;
                    // Link to a generic profile page for now, or differentiate by role if needed
                    loginLink.href = data.role === "admin" ? "organizador.html" : "perfil.html"; // Adjusted for admin
                }
                // Optionally, store user info like role for UI adjustments
                localStorage.setItem("currentUser", JSON.stringify({ username: data.username, role: data.role, id: data.user_id }));
            } else {
                // Token invalid or expired, clear it
                localStorage.removeItem("session_token");
                sessionStorage.removeItem("session_token");
                localStorage.removeItem("currentUser");
                if (loginLink) {
                    loginLink.innerHTML = ". LOGIN";
                    loginLink.href = "login.html";
                }
            }
        } catch (error) {
            console.error("Error checking session:", error);
            if (loginLink) {
                loginLink.innerHTML = ". LOGIN";
                loginLink.href = "login.html";
            }
        }
    } else {
        if (loginLink) {
            loginLink.innerHTML = ". LOGIN";
            loginLink.href = "login.html";
        }
    }
}

function setupPasswordToggle() {
    const toggleButtons = document.querySelectorAll(".toggle-password");
    toggleButtons.forEach(button => {
        button.addEventListener("click", function() {
            const passwordInput = this.previousElementSibling;
            const icon = this.querySelector("i");
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            } else {
                passwordInput.type = "password";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }
        });
    });
}

function setupPasswordStrength() {
    const passwordInput = document.getElementById("registerPassword");
    const strengthBar = document.getElementById("passwordStrength");
    const feedback = document.getElementById("passwordFeedback");
    if (!passwordInput || !strengthBar || !feedback) return;

    passwordInput.addEventListener("input", function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        strengthBar.style.width = strength.score + "%";
        strengthBar.setAttribute("aria-valuenow", strength.score);
        if (strength.score < 25) strengthBar.className = "progress-bar bg-danger";
        else if (strength.score < 50) strengthBar.className = "progress-bar bg-warning";
        else if (strength.score < 75) strengthBar.className = "progress-bar bg-info";
        else strengthBar.className = "progress-bar bg-success";
        feedback.textContent = strength.message;
    });
}

function calculatePasswordStrength(password) {
    let score = 0;
    let message = "Sua senha deve ter pelo menos 8 caracteres";
    if (!password) return { score: 0, message };
    if (password.length >= 8) { score += 25; message = "Senha fraca"; }
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) { score += 25; message = "Senha média"; }
    if (/\d/.test(password)) { score += 25; message = "Senha boa"; }
    if (/[!@#$%^&*(),.?\":{}|<>]/.test(password)) { score += 25; message = "Senha forte"; }
    return { score, message };
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function setupFormValidationAndSubmission() {
    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const username = document.getElementById("registerUsername").value;
            const email = document.getElementById("registerEmail").value;
            const password = document.getElementById("registerPassword").value;
            const confirmPassword = document.getElementById("registerConfirmPassword").value;
            const termsAgree = document.getElementById("termsAgree").checked;

            if (!username || !email || !password || !confirmPassword) {
                showNotification("Preencha todos os campos obrigatórios", "danger"); return;
            }
            if (!isValidEmail(email)) {
                showNotification("Digite um email válido", "danger"); return;
            }
            if (password.length < 8) {
                showNotification("A senha deve ter pelo menos 8 caracteres", "danger"); return;
            }
            if (password !== confirmPassword) {
                showNotification("As senhas não coincidem", "danger"); return;
            }
            if (!termsAgree) {
                showNotification("Você deve concordar com os Termos de Uso", "danger"); return;
            }

            showNotification("Processando cadastro...", "info");
            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email, password })
                });
                const data = await response.json();
                if (response.ok) {
                    showNotification("Cadastro realizado com sucesso! Redirecionando para login...", "success");
                    setTimeout(() => {
                        // Redirect to login page or automatically log in
                        window.location.hash = "#login"; // Switch to login tab
                        document.getElementById("loginEmail").value = email;
                        document.getElementById("loginPassword").focus();
                    }, 1500);
                } else {
                    showNotification(data.error || "Erro no cadastro", "danger");
                }
            } catch (error) {
                showNotification("Erro de conexão ao tentar cadastrar.", "danger");
                console.error("Registration error:", error);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;
            const rememberMe = document.getElementById("rememberMe").checked;

            if (!email || !password) {
                showNotification("Preencha email e senha", "danger"); return;
            }
            if (!isValidEmail(email)) {
                showNotification("Digite um email válido", "danger"); return;
            }

            showNotification("Processando login...", "info");
            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (response.ok) {
                    showNotification("Login bem-sucedido!", "success");
                    if (rememberMe) {
                        localStorage.setItem("session_token", data.session_token);
                    } else {
                        sessionStorage.setItem("session_token", data.session_token);
                    }
                    localStorage.setItem("currentUser", JSON.stringify({ username: data.username, role: data.role, id: data.user_id }));
                    
                    setTimeout(() => {
                        // Redirect based on role or to a default page
                        window.location.href = data.role === "admin" ? "organizador.html" : "index.html";
                    }, 1500);
                } else {
                    showNotification(data.error || "Credenciais inválidas", "danger");
                }
            } catch (error) {
                showNotification("Erro de conexão ao tentar fazer login.", "danger");
                console.error("Login error:", error);
            }
        });
    }

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const email = document.getElementById("recoveryEmail").value;
            if (!email || !isValidEmail(email)) {
                showNotification("Digite um email válido", "danger"); return;
            }

            showNotification("Enviando pedido de recuperação...", "info");
            try {
                const response = await fetch(`${API_BASE_URL}/profile/forgot_password`, { // Corrected endpoint
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();
                if (response.ok) {
                    showNotification(data.message || "Email de recuperação enviado com sucesso!", "success");
                } else {
                    showNotification(data.error || "Erro ao enviar email de recuperação", "danger");
                }
            } catch (error) {
                showNotification("Erro de conexão ao tentar recuperar senha.", "danger");
                console.error("Forgot password error:", error);
            }
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById("forgotPasswordModal"));
                if (modal) modal.hide();
            }, 2000);
        });
    }

    // Social login buttons - These would require more complex OAuth flows with backend support
    // For now, they will remain as placeholders or be removed if not in scope for backend integration
    const socialButtons = document.querySelectorAll(".btn-social");
    socialButtons.forEach(button => {
        button.addEventListener("click", function() {
            const provider = this.classList.contains("btn-twitch") ? "Twitch" :
                            this.classList.contains("btn-google") ? "Google" :
                            this.classList.contains("btn-discord") ? "Discord" : "";
            showNotification(`Login com ${provider} ainda não implementado com backend.`, "info");
        });
    });
}

function showNotification(message, type) {
    let notification = document.querySelector(".notification");
    if (!notification) {
        notification = document.createElement("div");
        notification.className = "notification";
        document.body.appendChild(notification);
    }
    notification.className = `notification notification-${type} show`;
    notification.textContent = message;
    setTimeout(() => { notification.classList.remove("show"); }, 3000);
}

function addNotificationStyles() {
    const style = document.createElement("style");
    style.textContent = `
        .notification {
            position: fixed; top: 20px; right: 20px; padding: 15px 20px; border-radius: 5px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); z-index: 1050; /* Higher than modals */
            opacity: 0; transform: translateY(-20px); transition: opacity 0.3s ease, transform 0.3s ease; color: white;
        }
        .notification.show { opacity: 1; transform: translateY(0); }
        .notification-success { background-color: #28a745; }
        .notification-danger { background-color: #dc3545; }
        .notification-info { background-color: #17a2b8; }
        .notification-warning { background-color: #ffc107; color: #333; }
    `;
    document.head.appendChild(style);
}

// Logout functionality (example, can be placed in a global script)
async function logoutUser() {
    const token = localStorage.getItem("session_token") || sessionStorage.getItem("session_token");
    if (token) {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
        } catch (error) {
            console.error("Error during logout API call:", error);
            // Proceed to clear client-side session anyway
        }
    }
    localStorage.removeItem("session_token");
    sessionStorage.removeItem("session_token");
    localStorage.removeItem("currentUser");
    showNotification("Logout realizado com sucesso!", "success");
    setTimeout(() => { window.location.href = "index.html"; }, 1000);
}

// Example: Attach logout to a button if one exists with id="logoutButton"
// document.getElementById("logoutButton")?.addEventListener("click", logoutUser);


