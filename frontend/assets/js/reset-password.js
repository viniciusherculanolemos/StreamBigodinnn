document.addEventListener("DOMContentLoaded", function() {
    const resetPasswordForm = document.getElementById("resetPasswordForm");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
    const messageDiv = document.getElementById("resetPasswordMessage");
    const API_BASE_URL = "/api"; // Adjust if your API is hosted elsewhere

    // Get token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
        messageDiv.innerHTML = `<div class="alert alert-danger">Token de redefinição inválido ou ausente. Por favor, solicite um novo link de redefinição.</div>`;
        resetPasswordForm.style.display = "none";
        return;
    }

    resetPasswordForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        messageDiv.innerHTML = ""; // Clear previous messages

        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;

        if (newPassword.length < 8) {
            messageDiv.innerHTML = `<div class="alert alert-warning">A nova senha deve ter pelo menos 8 caracteres.</div>`;
            return;
        }

        if (newPassword !== confirmNewPassword) {
            messageDiv.innerHTML = `<div class="alert alert-warning">As senhas não coincidem.</div>`;
            return;
        }

        try {
            messageDiv.innerHTML = `<div class="alert alert-info">A processar o seu pedido...</div>`;
            const response = await fetch(`${API_BASE_URL}/profile/reset_password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    token: token, 
                    new_password: newPassword 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.innerHTML = `<div class="alert alert-success">${data.message || "Senha redefinida com sucesso! Agora pode fazer login com a sua nova senha."}</div>`;
                resetPasswordForm.reset();
                resetPasswordForm.style.display = "none"; // Hide form on success
            } else {
                messageDiv.innerHTML = `<div class="alert alert-danger">${data.error || "Ocorreu um erro ao redefinir a senha. Verifique se o link é válido ou tente novamente."}</div>`;
            }
        } catch (error) {
            console.error("Erro ao redefinir senha:", error);
            messageDiv.innerHTML = `<div class="alert alert-danger">Erro de conexão. Por favor, tente novamente mais tarde.</div>`;
        }
    });
});

