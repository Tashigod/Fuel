const API_BASE = "https://fuel-xxa4.onrender.com";

const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    message.textContent = "";

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {

        const response = await fetch(`${API_BASE}/admin/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await response.json();

        if (data.success) {

            localStorage.setItem("adminToken", data.token);
            localStorage.setItem("adminUsername", data.username);

            window.location.href = "dashboard.html";

        } else {

            message.textContent = data.message || "Login failed.";

        }

    } catch (err) {

        console.error(err);
        message.textContent = "Unable to connect to the server.";

    }
});