// ----------- UTILITIES -----------
function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

const buildCoverUrl = (type, id) =>
  `https://covers.openlibrary.org/b/${type}/${encodeURIComponent(id)}-L.jpg?default=false`;

async function urlIfExists(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok ? url : null;
  } catch (_) {
    return null;
  }
}

async function fetchOlidByQuery(title, author) {
  const params = new URLSearchParams({ title });
  if (author) params.set("author", author);
  params.set("limit", "1");
  try {
    const res = await fetch(`https://openlibrary.org/search.json?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data?.docs?.[0];
    return doc?.cover_edition_key || (doc?.edition_key?.[0] ?? null);
  } catch (_) {
    return null;
  }
}

async function resolveCover(imgEl, meta) {
  if (meta.isbn) {
    const u = await urlIfExists(buildCoverUrl("isbn", meta.isbn));
    if (u) return (imgEl.src = u);
  }
  if (meta.olid) {
    const u = await urlIfExists(buildCoverUrl("olid", meta.olid));
    if (u) return (imgEl.src = u);
  }
  if (meta.title) {
    const olid = await fetchOlidByQuery(meta.title, meta.author);
    if (olid) {
      const u = await urlIfExists(buildCoverUrl("olid", olid));
      if (u) return (imgEl.src = u);
    }
  }
  imgEl.src = "assets/images/book_fb.png";
}

// ----------- DATA LOADING -----------
async function loadBooksJson() {
  const res = await fetch("data/books.json");
  if (!res.ok) throw new Error("books.json load failed");
  return res.json();
}

function findBookInData(data, id) {
  if (!id) return null;
  const all = [...(data.catalog || []), ...(data.newArrivals || []), ...(data.liked || [])];
  return all.find((b) => String(b.id) === String(id)) || null;
}

// ----------- FILL PAGE -----------
function fillDetails(book) {
  document.getElementById("bookTitle").textContent = book.title || "Untitled";
  document.getElementById("bookAuthor").textContent = book.author || "Unknown";
  document.getElementById("bookGenre").textContent = book.genre || "";
  document.getElementById("bookIsbn").textContent = book.isbn || "—";
  document.getElementById("bookCount").textContent = book.count ?? 0;
  document.getElementById("bookShelf").textContent = book.shelfLocation || "Unassigned";
  document.getElementById('bookSummary').textContent = book.summary || 'No summary available.';


  const coverEl = document.getElementById("bookCover");
  coverEl.alt = book.title ? `${book.title} cover` : "Book cover";
  resolveCover(coverEl, book);

  // cache selected
  localStorage.setItem("selectedBook", JSON.stringify(book));
}

// ----------- INVENTORY ACTIONS -----------
function updateBookCount(delta) {
  const countEl = document.getElementById("bookCount");
  let count = parseInt(countEl.textContent || 0);
  count = Math.max(0, count + delta);
  countEl.textContent = count;

  const selectedBook = JSON.parse(localStorage.getItem("selectedBook") || "{}");
  selectedBook.count = count;
  localStorage.setItem("selectedBook", JSON.stringify(selectedBook));

  // persist changes globally for dashboard reload
  const updates = JSON.parse(localStorage.getItem("catalogUpdates") || "{}");
  updates[selectedBook.id] = { count };
  localStorage.setItem("catalogUpdates", JSON.stringify(updates));
}

function editShelfLocation() {
  const newLoc = prompt("Enter new shelf location:");
  if (!newLoc) return;

  const shelfEl = document.getElementById("bookShelf");
  shelfEl.textContent = newLoc;

  const selectedBook = JSON.parse(localStorage.getItem("selectedBook") || "{}");
  selectedBook.shelfLocation = newLoc;
  localStorage.setItem("selectedBook", JSON.stringify(selectedBook));

  // persist to global catalog updates
  const updates = JSON.parse(localStorage.getItem("catalogUpdates") || "{}");
  if (!updates[selectedBook.id]) updates[selectedBook.id] = {};
  updates[selectedBook.id].shelfLocation = newLoc;
  localStorage.setItem("catalogUpdates", JSON.stringify(updates));
}

// ----------- INIT -----------
async function init() {
  const id = getParam("id");
  try {
    const data = await loadBooksJson();
    let book = findBookInData(data, id);

    if (!book) {
      const cached = JSON.parse(localStorage.getItem("selectedBook") || "null");
      book = cached || { title: "Book not found" };
    }

    // merge previous changes from localStorage
    const updates = JSON.parse(localStorage.getItem("catalogUpdates") || "{}");
    if (updates[book.id]) Object.assign(book, updates[book.id]);

    fillDetails(book);

    document.getElementById("addCopyBtn").addEventListener("click", () => updateBookCount(1));
    document.getElementById("removeCopyBtn").addEventListener("click", () => updateBookCount(-1));
    document.getElementById("editShelfBtn").addEventListener("click", editShelfLocation);
  } catch (e) {
    console.error(e);
    fillDetails({ title: "Book not found" });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
