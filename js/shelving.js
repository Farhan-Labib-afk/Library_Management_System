const shelvingList = document.getElementById("shelvingList");
const activityLog = document.getElementById("activityLog");
const progressSummary = document.getElementById("progressSummary");
const successSound = document.getElementById("successSound");

let shelvingQueue = [];

// ---------- LOAD DATA ----------
async function loadShelving() {
  // Load from localStorage if exists (persistent session)
  const localData = JSON.parse(localStorage.getItem("shelvingQueue") || "[]");

  if (localData.length) {
    shelvingQueue = localData;
  } else {
    const res = await fetch("data/shelving.json");
    const data = await res.json();
    shelvingQueue = data.copies;
    localStorage.setItem("shelvingQueue", JSON.stringify(shelvingQueue));
  }

  renderShelvingList();
  loadActivityLog();
}

// ---------- RENDER ----------
function renderShelvingList() {
  const pending = shelvingQueue.filter(c => c.status === "Pending");

  if (!pending.length) {
    shelvingList.innerHTML = `<p style="text-align:center;">✅ All copies have been processed!</p>`;
    updateProgress();
    return;
  }

  shelvingList.innerHTML = pending.map(c => `
    <div class="book-card">
      <img src="assets/images/book_fb.png" alt="${c.title}" id="cover-${c.copyId}">
      <div class="book-info">
        <h3>${c.title}</h3>
        <p><em>${c.author}</em></p>
        <p><strong>Genre:</strong> ${c.genre}</p>
        <p><strong>Suggested:</strong> ${c.suggestedShelf}</p>
        <select id="cond-${c.copyId}" class="condition-select">
          <option value="">Select Condition</option>
          <option value="Good">Good</option>
          <option value="Worn">Worn</option>
          <option value="Damaged">Damaged</option>
        </select>
        <button class="shelve-btn" onclick="handleShelving('${c.copyId}')">Mark as Shelved</button>
      </div>
    </div>
  `).join("");

  // Load cover images dynamically
  pending.forEach(c => {
    if (c.isbn) {
      const img = document.getElementById(`cover-${c.copyId}`);
      // Ensure broken cover images fall back to local placeholder
      const fallbackSrc = "assets/images/book_fb.png";
      img.onerror = () => {
        // Prevent infinite loop if fallback also fails
        img.onerror = null;
        // Only switch if not already the fallback
        if (!img.src.endsWith("book_fb.png")) {
          img.src = fallbackSrc;
        }
      };
      const coverUrl = `https://covers.openlibrary.org/b/isbn/${c.isbn}-L.jpg`;
      fetch(coverUrl, { method: "HEAD" }).then(res => {
        if (res.ok) img.src = coverUrl;
      });
    }
  });

  updateProgress();
}

// ---------- HANDLE SHELVING ----------
function handleShelving(copyId) {
  const c = shelvingQueue.find(x => x.copyId === copyId);
  const cond = document.getElementById(`cond-${copyId}`).value;
  if (!cond) return alert("Please select a condition.");

  c.condition = cond;
  if (cond === "Damaged") {
    c.status = "Inspection";
  } else {
    c.status = "Shelved";
  }

  saveShelvingState();
  logShelving(c);
  successSound.play();
  renderShelvingList();
}

// ---------- SAVE STATE ----------
function saveShelvingState() {
  localStorage.setItem("shelvingQueue", JSON.stringify(shelvingQueue));
  updateProgress();
}

// ---------- ACTIVITY LOG ----------
function logShelving(copy) {
  const logs = JSON.parse(localStorage.getItem("shelvingLog") || "[]");
  const time = new Date().toLocaleString();
  logs.unshift({
    title: copy.title,
    condition: copy.condition,
    action: copy.status === "Inspection" ? "Sent for Inspection" : "Shelved",
    time: time,
    by: "Alan (Volunteer)"
  });
  localStorage.setItem("shelvingLog", JSON.stringify(logs));
  loadActivityLog();
}

function loadActivityLog() {
  const logs = JSON.parse(localStorage.getItem("shelvingLog") || "[]");
  if (!logs.length) {
    activityLog.innerHTML = `<li>No shelving activity yet.</li>`;
    return;
  }

  activityLog.innerHTML = logs.map(l => `
    <li class="${l.condition.toLowerCase()}">
      📚 <strong>${l.title}</strong> — ${l.action}
      <br>🕒 ${l.time} — Condition: <em>${l.condition}</em> — ${l.by}
    </li>
  `).join("");
}

// ---------- PROGRESS ----------
function updateProgress() {
  const total = shelvingQueue.length;
  const done = shelvingQueue.filter(c => c.status !== "Pending").length;
  const inspection = shelvingQueue.filter(c => c.status === "Inspection").length;
  progressSummary.textContent = `Progress: ${done}/${total} processed | ${inspection} sent for inspection`;
}

// ---------- INIT ----------
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadShelving);
} else {
  loadShelving();
}
