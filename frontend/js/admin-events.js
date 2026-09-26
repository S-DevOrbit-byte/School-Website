const eventForm = document.getElementById("event-form");
const eventFormMessage = document.getElementById("event-form-message");
const eventAddBtn = document.getElementById("event-add-btn");
const eventListEl = document.getElementById("event-list");

function formatEventDateTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Converts an ISO date string into the "YYYY-MM-DDTHH:MM" format a
// datetime-local input needs, using local time.
function toDateTimeInputValue(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderEventView(event) {
  const isPast = new Date(event.date) < new Date();
  return `
    <div class="content">
      <h3 style="margin:0 0 4px;">${escapeHtml(event.title)}${isPast ? " (Past)" : ""}</h3>
      <span class="notice-date"> ${formatEventDateTime(event.date)}${
        event.location ? ` &nbsp;•&nbsp;  ${escapeHtml(event.location)}` : ""
      }</span>
      <p style="margin-top:8px;">${escapeHtml(event.description)}</p>
    </div>
    <div style="display:flex; flex-direction:column; gap:6px;">
      <button class="btn-secondary edit-event-btn" data-id="${event._id}">Edit</button>
      <button class="btn-danger delete-event-btn" data-id="${event._id}">Delete</button>
    </div>
  `;
}

function renderEventEditForm(event) {
  return `
    <form class="event-edit-form" data-id="${event._id}" style="width:100%;">
      <div>
        <label>Title</label>
        <input type="text" name="title" maxlength="150" value="${escapeHtml(event.title)}" required />
      </div>
      <div>
        <label>Description</label>
        <textarea name="description" maxlength="2000" required>${escapeHtml(event.description)}</textarea>
      </div>
      <div>
        <label>Date &amp; Time</label>
        <input type="datetime-local" name="date" value="${toDateTimeInputValue(event.date)}" required />
      </div>
      <div>
        <label>Location</label>
        <input type="text" name="location" maxlength="200" value="${escapeHtml(event.location || "")}" />
      </div>
      <div>
        <label>Image URLs (comma-separated)</label>
        <textarea name="images">${escapeHtml((event.images || []).join(", "))}</textarea>
      </div>
      <div style="display:flex; gap:8px;">
        <button type="submit" class="btn-primary">Save</button>
        <button type="button" class="btn-secondary cancel-edit-btn">Cancel</button>
      </div>
    </form>
  `;
}

async function loadEvents() {
  try {
    const res = await fetch(`${API_BASE_URL}/events`);
    const data = await res.json();

    if (!data.success) throw new Error(data.message || "Failed to load events.");

    if (data.events.length === 0) {
      eventListEl.innerHTML = `<p class="empty-state">No events yet. Add one above.</p>`;
      return;
    }

    // Stash raw event data on the container so edit forms can rebuild themselves
    eventListEl.dataset.events = JSON.stringify(data.events);

    eventListEl.innerHTML = data.events
      .map((event) => `<div class="card dashboard-notice-item" data-event-id="${event._id}">${renderEventView(event)}</div>`)
      .join("");
  } catch (err) {
    eventListEl.innerHTML = `<p class="error-state">Could not load events.</p>`;
    console.error(err);
  }
}

// --- Add event ---
eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("event-title").value.trim();
  const description = document.getElementById("event-description").value.trim();
  const date = document.getElementById("event-date").value;
  const location = document.getElementById("event-location").value.trim();
const images = document
    .getElementById("event-images")
    .value.split(",")
    .map((url) => url.trim())
    .filter(Boolean);
  eventFormMessage.textContent = "";
  eventFormMessage.className = "form-message";
  eventAddBtn.disabled = true;
  eventAddBtn.textContent = "Adding...";

  try {
    const res = await authFetch(`${API_BASE_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, date, location,images }),
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message || "Failed to add event.");

    eventForm.reset();
    eventFormMessage.textContent = "Event added.";
    eventFormMessage.className = "form-message success";
    loadEvents();
  } catch (err) {
    eventFormMessage.textContent = err.message;
    eventFormMessage.className = "form-message error";
  } finally {
    eventAddBtn.disabled = false;
    eventAddBtn.textContent = "Add Event";
  }
});

// --- Delegated clicks: edit / delete / cancel ---
eventListEl.addEventListener("click", async (e) => {
  const card = e.target.closest(".dashboard-notice-item");
  if (!card) return;
  const id = card.dataset.eventId;

  // Delete
  if (e.target.classList.contains("delete-event-btn")) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    e.target.disabled = true;
    e.target.textContent = "Deleting...";
    try {
      const res = await authFetch(`${API_BASE_URL}/events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to delete event.");
      loadEvents();
    } catch (err) {
      alert(err.message);
      e.target.disabled = false;
      e.target.textContent = "Delete";
    }
    return;
  }

  // Enter edit mode
  if (e.target.classList.contains("edit-event-btn")) {
    const events = JSON.parse(eventListEl.dataset.events || "[]");
    const event = events.find((ev) => ev._id === id);
    if (!event) return;
    card.innerHTML = renderEventEditForm(event);
    return;
  }

  // Cancel edit mode
  if (e.target.classList.contains("cancel-edit-btn")) {
    loadEvents();
    return;
  }
});

// --- Submit an edit form ---
eventListEl.addEventListener("submit", async (e) => {
  const form = e.target.closest(".event-edit-form");
  if (!form) return;
  e.preventDefault();

  const id = form.dataset.id;
  const title = form.title.value.trim();
  const description = form.description.value.trim();
  const date = form.date.value;
  const location = form.location.value.trim();
  const images = form.images.value
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  const saveBtn = form.querySelector('button[type="submit"]');
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const res = await authFetch(`${API_BASE_URL}/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, date, location,images }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Failed to update event.");
    loadEvents();
  } catch (err) {
    alert(err.message);
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
  }
});

// --- Init ---
loadEvents();
