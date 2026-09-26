const loginForm = document.getElementById("login-form");
const formMessage = document.getElementById("form-message");
const loginBtn = document.getElementById("login-btn");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  formMessage.textContent = "";
  formMessage.className = "form-message";
  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // required so the httpOnly auth cookie is stored
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Login failed.");
    }

    // Fallback for browsers/setups where the cross-site cookie doesn't stick
    if (data.token) {
      localStorage.setItem("noticeboard_token", data.token);
    }

    formMessage.textContent = "Login successful! Redirecting...";
    formMessage.className = "form-message success";

    setTimeout(() => {
      window.location.href = "admin-dashboard.html";
    }, 600);
  } catch (err) {
    formMessage.textContent = err.message;
    formMessage.className = "form-message error";
    loginBtn.disabled = false;
    loginBtn.textContent = "Log In";
  }
});
