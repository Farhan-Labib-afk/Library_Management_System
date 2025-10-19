// Parse query params
function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// Cover helpers (same logic as dashboard)
const buildCoverUrl = (type, id) => `https://covers.openlibrary.org/b/${type}/${encodeURIComponent(id)}-L.jpg?default=false`;

async function urlIfExists(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok ? url : null;
  } catch (_) { return null; }
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
    const olid = doc?.cover_edition_key || (Array.isArray(doc?.edition_key) ? doc.edition_key[0] : null);
    return olid || null;
  } catch (_) { return null; }
}

async function resolveCover(imgEl, meta) {
  if (meta.isbn) {
    const u = await urlIfExists(buildCoverUrl('isbn', meta.isbn));
    if (u) { imgEl.src = u; return; }
  }
  if (meta.olid) {
    const u = await urlIfExists(buildCoverUrl('olid', meta.olid));
    if (u) { imgEl.src = u; return; }
  }
  if (meta.title) {
    const olid = await fetchOlidByQuery(meta.title, meta.author);
    if (olid) {
      const u = await urlIfExists(buildCoverUrl('olid', olid));
      if (u) { imgEl.src = u; return; }
    }
  }
  imgEl.src = 'assets/images/book_fb.png';
}

async function loadBooksJson() {
  const res = await fetch('data/books.json');
  if (!res.ok) throw new Error('books.json load failed');
  return res.json();
}

function fillDetails(book) {
  const titleEl = document.getElementById('bookTitle');
  const authorEl = document.getElementById('bookAuthor');
  const genreEl = document.getElementById('bookGenre');
  const isbnEl = document.getElementById('bookIsbn');
  const olidEl = document.getElementById('bookOlid');
  const coverEl = document.getElementById('bookCover');
  const olLink = document.getElementById('openLibraryLink');

  titleEl.textContent = book.title || 'Untitled';
  authorEl.textContent = book.author || 'Unknown';
  genreEl.textContent = book.genre || '';
  isbnEl.textContent = book.isbn || '—';
  olidEl.textContent = book.olid || '—';
  coverEl.alt = book.title ? `${book.title} cover` : 'Book cover';
  olLink.href = book.isbn
    ? `https://openlibrary.org/isbn/${encodeURIComponent(book.isbn)}`
    : (book.olid ? `https://openlibrary.org/books/${encodeURIComponent(book.olid)}` : '#');

  // Resolve cover
  resolveCover(coverEl, book);
}

function findBookInData(data, id) {
  if (!id) return null;
  const all = [ ...(data.catalog||[]), ...(data.newArrivals||[]), ...(data.liked||[]) ];
  return all.find(b => String(b.id) === String(id)) || null;
}

async function init() {
  const id = getParam('id');
  try {
    const data = await loadBooksJson();
    let book = findBookInData(data, id);
    if (!book) {
      // Fallback from localStorage
      try {
        const cached = JSON.parse(localStorage.getItem('selectedBook') || 'null');
        if (cached) book = cached;
      } catch (_) {}
    }
    if (!book) throw new Error('Book not found');
    fillDetails(book);
  } catch (e) {
    // Minimal error state
    fillDetails({ title: 'Book not found', author: '', genre: '', isbn: '', olid: '' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else { init(); }

