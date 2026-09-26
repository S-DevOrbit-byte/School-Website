document.getElementById("year").textContent = new Date().getFullYear();

const noticeListEl = document.getElementById("notice-list");

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

async function loadNotices() {
  try {
    const res = await fetch(`${API_BASE_URL}/notices`);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to load notices.");
    }

    if (data.notices.length === 0) {
      noticeListEl.innerHTML = `<p class="empty-state">No notices have been posted yet.</p>`;
      return;
    }

    noticeListEl.innerHTML = data.notices
      .map(
        (notice) => `
      <div class="card notice-card">
        <h3>${escapeHtml(notice.title)}</h3>
        <span class="notice-date">Posted on ${formatDate(notice.createdAt)}</span>
        <p>${escapeHtml(notice.description)}</p>
      </div>
    `
      )
      .join("");
  } catch (err) {
    noticeListEl.innerHTML = `<p class="error-state">Could not load notices. Is the backend server running?</p>`;
    console.error(err);
  }
}

loadNotices();
