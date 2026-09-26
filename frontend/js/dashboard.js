const noticeForm = document.getElementById("notice-form");
const formMessage = document.getElementById("form-message");
const addBtn = document.getElementById("add-btn");
const noticeListEl = document.getElementById("notice-list");
const logoutLink = document.getElementById("logout-link");

// Wraps fetch() so every request sends the auth cookie, and falls back to
// the Authorization header if a token was stored (e.g. cross-site cookie blocked).
function authFetch(url, options = {}) {
  const token = localStorage.getItem("noticeboard_token");
  const headers = { ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return fetch(url, { ...options, credentials: "include", headers });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

// --- Auth guard: redirect to login if not authenticated ---
async function checkAuth() {
  try {
    const res = await authFetch(`${API_BASE_URL}/auth/me`);
    const data = await res.json();
    if (!data.success) throw new Error();
  } catch {
    window.location.href = "admin-login.html";
  }
}

// --- Load and render notices, each with a Delete button ---
async function loadNotices() {
  try {
    const res = await fetch(`${API_BASE_URL}/notices`);
    const data = await res.json();

    if (!data.success) throw new Error(data.message || "Failed to load notices.");

    if (data.notices.length === 0) {
      noticeListEl.innerHTML = `<p class="empty-state">No notices yet. Add one above.</p>`;
      return;
    }

    noticeListEl.innerHTML = data.notices
      .map(
        (notice) => `
      <div class="card dashboard-notice-item" data-id="${notice._id}">
        <div class="content">
          <h3 style="margin:0 0 4px;">${escapeHtml(notice.title)}</h3>
          <span class="notice-date">Posted on ${formatDate(notice.createdAt)}</span>
          <p style="margin-top:8px;">${escapeHtml(notice.description)}</p>
        </div>
        <button class="btn-danger delete-btn" data-id="${notice._id}">Delete</button>
      </div>
    `
      )
      .join("");
  } catch (err) {
    noticeListEl.innerHTML = `<p class="error-state">Could not load notices.</p>`;
    console.error(err);
  }
}

// --- Add notice ---
noticeForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();

  formMessage.textContent = "";
  formMessage.className = "form-message";
  addBtn.disabled = true;
  addBtn.textContent = "Adding...";

  try {
    const res = await authFetch(`${API_BASE_URL}/notices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message || "Failed to add notice.");

    noticeForm.reset();
    formMessage.textContent = "Notice added.";
    formMessage.className = "form-message success";
    loadNotices();
  } catch (err) {
    formMessage.textContent = err.message;
    formMessage.className = "form-message error";
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = "Add Notice";
  }
});

// --- Delete notice (delegated click handler) ---
noticeListEl.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-btn")) return;

  const id = e.target.dataset.id;
  if (!confirm("Delete this notice? This cannot be undone.")) return;

  e.target.disabled = true;
  e.target.textContent = "Deleting...";

  try {
    const res = await authFetch(`${API_BASE_URL}/notices/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!data.success) throw new Error(data.message || "Failed to delete notice.");

    loadNotices();
  } catch (err) {
    alert(err.message);
    e.target.disabled = false;
    e.target.textContent = "Delete";
  }
});

// --- Logout ---
logoutLink.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    await authFetch(`${API_BASE_URL}/auth/logout`, { method: "POST" });
  } finally {
    localStorage.removeItem("noticeboard_token");
    window.location.href = "admin-login.html";
  }
});

// --- Init ---
checkAuth();
loadNotices();
