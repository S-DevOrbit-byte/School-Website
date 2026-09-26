document.getElementById("year").textContent = new Date().getFullYear();

const eventListEl = document.getElementById("event-list");
const tagsEl = document.getElementById("event-tags");

const IMAGE_SLIDE_INTERVAL = 4000; // ms between image changes
const TEXT_PAGE_INTERVAL = 5000; // ms between text page changes
const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#93a5c4"/><text x="50%" y="50%" font-size="28" fill="#fff" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">Event</text></svg>'
  );

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDateTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function splitIntoSentences(text) {
  const matches = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
  return matches ? matches.map((s) => s.trim()).filter(Boolean) : [text];
}

// Last-resort splitter for a single sentence too long to fit one page on its own.
function splitLongSentenceByWords(sentence, measurer, maxHeight) {
  const words = sentence.split(/\s+/);
  const pages = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? current + " " + word : word;
    measurer.textContent = candidate;
    if (measurer.scrollHeight > maxHeight && current) {
      pages.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) pages.push(current);
  return pages;
}

// Splits `text` into pages of whole sentences, each page sized to fit within
// `maxHeight` (px), by measuring against a hidden clone of the real text box.
// Falls back to a word-level split only if a single sentence alone overflows.
function paginateText(text, referenceBox, maxHeight) {
  const measurer = document.createElement("div");
  measurer.style.position = "absolute";
  measurer.style.visibility = "hidden";
  measurer.style.pointerEvents = "none";
  measurer.style.width = referenceBox.clientWidth + "px";
  measurer.style.lineHeight = "1.6";
  measurer.style.font = window.getComputedStyle(referenceBox).font || "16px sans-serif";
  document.body.appendChild(measurer);

  const sentences = splitIntoSentences(text);
  const pages = [];
  let current = "";

  for (const sentence of sentences) {
    const candidate = current ? current + " " + sentence : sentence;
    measurer.textContent = candidate;

    if (measurer.scrollHeight <= maxHeight) {
      current = candidate;
      continue;
    }

    if (current) {
      pages.push(current);
      current = "";
    }

    measurer.textContent = sentence;
    if (measurer.scrollHeight > maxHeight) {
      const subPages = splitLongSentenceByWords(sentence, measurer, maxHeight);
      pages.push(...subPages.slice(0, -1));
      current = subPages[subPages.length - 1] || "";
    } else {
      current = sentence;
    }
  }
  if (current) pages.push(current);

  document.body.removeChild(measurer);
  return pages.length ? pages : [text];
}

function buildEventCard(event) {
  const images = event.images && event.images.length ? event.images : [FALLBACK_IMAGE];

  const card = document.createElement("div");
  card.className = "event-highlight-card";
card.id = "event-" + event._id;
  card.innerHTML = `
    <div class="event-highlight-image">
      ${images
        .map(
          (src, i) =>
            `<img src="${escapeHtml(src)}" class="${i === 0 ? "active" : ""}" data-index="${i}" alt="${escapeHtml(event.title)}" />`
        )
        .join("")}
      ${
        images.length > 1
          ? `<div class="event-highlight-dots">${images
              .map((_, i) => `<span class="${i === 0 ? "active" : ""}"></span>`)
              .join("")}</div>`
          : ""
      }
    </div>
       <div class="event-highlight-info">
      <h2 class="event-highlight-title">${escapeHtml(event.title)}</h2>
      <div class="event-highlight-meta">
        ${formatDateTime(event.date)}${event.location ? ` &nbsp;•&nbsp; ${escapeHtml(event.location)}` : ""}
      </div>
      <p class="event-highlight-desc">${escapeHtml(event.description)}</p>
    </div>
  `;

  setupImageSlider(card, images.length);
 

  return card;
}

function setupImageSlider(card, imageCount) {
  if (imageCount <= 1) return;

  const imgs = card.querySelectorAll(".event-highlight-image img");
  const dots = card.querySelectorAll(".event-highlight-dots span");
  let index = 0;

  function show(newIndex) {
    imgs[index].classList.remove("active");
    if (dots[index]) dots[index].classList.remove("active");
    index = (newIndex + imageCount) % imageCount;
    imgs[index].classList.add("active");
    if (dots[index]) dots[index].classList.add("active");
  }

  let timer = setInterval(() => show(index + 1), IMAGE_SLIDE_INTERVAL);

  // Swipe support (touch) - resets the auto timer after a manual swipe
  const imageEl = card.querySelector(".event-highlight-image");
  let touchStartX = 0;

  imageEl.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  });

  imageEl.addEventListener("touchend", (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) < 40) return; // ignore small taps
    clearInterval(timer);
    show(index + (deltaX < 0 ? 1 : -1));
    timer = setInterval(() => show(index + 1), IMAGE_SLIDE_INTERVAL);
  });
}

function setupTextPager(card, description) {
  const box = card.querySelector(".event-highlight-text-box");
  const dotsContainer = card.querySelector(".event-highlight-page-dots");
  const maxHeight = box.clientHeight || 190;

  const pages = paginateText(description, box, maxHeight);

  box.innerHTML = pages
    .map((page, i) => `<p class="event-highlight-page ${i === 0 ? "active" : ""}">${escapeHtml(page)}</p>`)
    .join("");

  if (pages.length <= 1) return; // no need for dots/timer on short descriptions

  dotsContainer.innerHTML = pages.map((_, i) => `<span class="${i === 0 ? "active" : ""}"></span>`).join("");

  const pageEls = box.querySelectorAll(".event-highlight-page");
  const dotEls = dotsContainer.querySelectorAll("span");
  let index = 0;

  setInterval(() => {
    pageEls[index].classList.remove("active");
    dotEls[index].classList.remove("active");
    index = (index + 1) % pages.length;
    pageEls[index].classList.add("active");
    dotEls[index].classList.add("active");
  }, TEXT_PAGE_INTERVAL);
}

async function loadEvents() {
  try {
    const res = await fetch(`${API_BASE_URL}/events`);
    const data = await res.json();

    if (!data.success) throw new Error(data.message || "Failed to load events.");

    if (data.events.length === 0) {
      eventListEl.innerHTML = `<p class="empty-state">No upcoming events right now.</p>`;
      return;
    }

  eventListEl.innerHTML = "";
tagsEl.innerHTML = "";

data.events.forEach((event) => {
  // 1. make the card (same as before)
  const card = buildEventCard(event);
  eventListEl.appendChild(card);

  // 2. make the tag for this same event
  const tag = document.createElement("a");
  tag.className = "event-tag";
  tag.href = "#event-" + event._id;
  tag.innerHTML = `
    <strong>${escapeHtml(event.title)}</strong>
    <span>
      ${new Date(event.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
      ${event.location ? " • " + escapeHtml(event.location) : ""}
    </span>`;

  // 3. when clicked, scroll to that event's card
  tag.addEventListener("click", (e) => {
    e.preventDefault();
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  tagsEl.appendChild(tag);
});
  } catch (err) {
    eventListEl.innerHTML = `<p class="error-state">Could not load events. Is the backend server running?</p>`;
    console.error(err);
  }
}

loadEvents();
