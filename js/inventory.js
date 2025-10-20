const inventoryBody = document.getElementById("inventoryBody");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

let allBooks = [];

// Load and merge all books from JSON
async function loadBooks() {
  const res = await fetch("data/books.json");
  const data = await res.json();
  allBooks = [
    ...(data.catalog || []),
    ...(data.newArrivals || []),
    ...(data.liked || []),
    ...(data.moreBooks || [])
  ];

  // Merge local updates if any
  const updates = JSON.parse(localStorage.getItem("catalogUpdates") || "{}");
  allBooks.forEach(b => {
    if (updates[b.id]) Object.assign(b, updates[b.id]);
  });

  renderBooks(allBooks);
}

function renderBooks(books) {
  if (!books.length) {
    inventoryBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No books found.</td></tr>`;
    return;
  }

  inventoryBody.innerHTML = books.map(book => `
    <tr class="${book.count <= 2 ? 'low-stock' : ''}" onclick="openModal('${book.id}')">
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.genre || '—'}</td>
      <td>${book.count}</td>
      <td>${book.shelfLocation || '<em>Needs shelving</em>'}</td>
      <td onclick="event.stopPropagation()">
        <button class="action-btn add" onclick="updateCount('${book.id}', 1)">+</button>
        <button class="action-btn remove" onclick="updateCount('${book.id}', -1)">–</button>
        <button class="action-btn edit" onclick="editShelf('${book.id}')"><i class="fa-solid fa-pen"></i></button>
      </td>
    </tr>
  `).join("");
}

function updateCount(id, delta) {
  const book = allBooks.find(b => b.id === id);
  if (!book) return;
  book.count = Math.max(0, (book.count || 0) + delta);
  saveToLocal(book);
  renderBooks(allBooks);
}

function editShelf(id) {
  const book = allBooks.find(b => b.id === id);
  if (!book) return;
  const newLoc = prompt(`Enter new shelf location for "${book.title}"`, book.shelfLocation || "");
  if (!newLoc) return;
  book.shelfLocation = newLoc;
  saveToLocal(book);
  renderBooks(allBooks);
}

function saveToLocal(book) {
  const updates = JSON.parse(localStorage.getItem("catalogUpdates") || "{}");
  updates[book.id] = { count: book.count, shelfLocation: book.shelfLocation };
  localStorage.setItem("catalogUpdates", JSON.stringify(updates));
}

// ---------- SEARCH ----------
function searchBooks() {
  const query = searchInput.value.toLowerCase();
  const filtered = allBooks.filter(b =>
    b.title.toLowerCase().includes(query) ||
    b.author.toLowerCase().includes(query) ||
    (b.genre && b.genre.toLowerCase().includes(query))
  );
  renderBooks(filtered);
}

searchBtn.addEventListener("click", searchBooks);
searchInput.addEventListener("input", searchBooks);

// ---------- MODAL ----------
const modal = document.getElementById("bookModal");
const closeModal = document.getElementById("closeModal");

function openModal(id) {
  const book = allBooks.find(b => b.id === id);
  if (!book) return;

  document.getElementById("modalTitle").textContent = book.title;
  document.getElementById("modalAuthor").textContent = book.author || "Unknown";
  document.getElementById("modalGenre").textContent = book.genre || "—";
  document.getElementById("modalCount").textContent = book.count;
  document.getElementById("modalShelf").textContent = book.shelfLocation || "Needs shelving";
  document.getElementById("modalSummary").textContent = book.summary || "No summary available.";

  const img = document.getElementById("modalCover");
  img.src = "assets/images/book_fb.png";
  if (book.isbn) {
    const coverUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
    fetch(coverUrl, { method: "HEAD" })
      .then(res => { if (res.ok) img.src = coverUrl; });
  }

  modal.style.display = "flex";
}

closeModal.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

// Init
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadBooks);
} else {
  loadBooks();
}

// ---------- SHIPMENT REPORT REVIEW ----------
const reportReviewList = document.getElementById("reportReviewList");

function loadShipmentReports() {
  const reports = JSON.parse(localStorage.getItem("shipmentReports") || "[]");
  const pending = reports.filter(r => r.status !== "Resolved");
  if (!pending.length) {
    reportReviewList.innerHTML = `<p style="text-align:center;">No shipment reports awaiting review.</p>`;
    return;
  }

  reportReviewList.innerHTML = pending.map(r => `
    <div class="report-card" id="report-${r.id}">
      <div class="report-header">
        <h3>Report: ${r.id}</h3>
        <span>🕒 ${r.createdAt}</span>
      </div>
      <div class="report-info">
        <p><strong>From:</strong> ${r.from}</p>
        <p><strong>Status:</strong> ${r.status}</p>
        <p><strong>Books Included:</strong></p>
        <ul>${r.books.map(b => `<li>${b.id} — ${b.quantity} copies</li>`).join("")}</ul>
      </div>
      <div class="report-actions">
        <button class="report-btn resolve" onclick="resolveReport('${r.id}')">Marked as Resolved</button>
      </div>
    </div>
  `).join("");
}

// ---------- Resolve Report (mark as resolved only) ----------
function resolveReport(id) {
  const reports = JSON.parse(localStorage.getItem("shipmentReports") || "[]");
  const report = reports.find(r => r.id === id);
  if (!report) return;

  // Do not modify inventory counts here; Inventory Clerk updates manually
  report.status = "Resolved";
  localStorage.setItem("shipmentReports", JSON.stringify(reports));

  loadShipmentReports();
  alert(`Report ${id} marked as resolved.`);
}


// ---------- INIT ----------
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadShipmentReports);
} else {
  loadShipmentReports();
}

