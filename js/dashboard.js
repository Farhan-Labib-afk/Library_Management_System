// Sidebar toggle
const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");
menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));

// Profile dropdown
const profileBtn = document.getElementById("profileMenuBtn");
const dropdown = document.getElementById("profileDropdown");

profileBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdown.classList.toggle("show");
});

document.addEventListener("click", (e) => {
  if (!sidebar.contains(e.target) && !menuBtn.contains(e.target))
    sidebar.classList.remove("open");
  if (!profileBtn.contains(e.target)) dropdown.classList.remove("show");
});

// Logout logic
const logoutBtn = document.querySelector(".logout-option");
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("loggedInEmployee");
  window.location.href = "login.html";
});

// Swiper carousels will be created after data render
let newArrivalsSwiper, likedBooksSwiper;
function createSwipers() {
  if (newArrivalsSwiper) newArrivalsSwiper.destroy(true, true);
  if (likedBooksSwiper) likedBooksSwiper.destroy(true, true);

  newArrivalsSwiper = new Swiper(".new-arrivals", {
    slidesPerView: 6,
    spaceBetween: 20,
    loop: false,
    centeredSlides: true,
    centeredSlidesBounds: true,
    centerInsufficientSlides: true,
    grabCursor: true,
    speed: 500,
    navigation: {
      nextEl: ".new-arrivals-next",
      prevEl: ".new-arrivals-prev",
    },
    pagination: {
      el: ".new-arrivals-pagination",
      enabled: false,
    },
    breakpoints: {
      0: { slidesPerView: 2 },
      600: { slidesPerView: 3 },
      900: { slidesPerView: 5 },
      1200: { slidesPerView: 6 },
    },
  });

  likedBooksSwiper = new Swiper(".liked-books", {
    slidesPerView: 6,
    spaceBetween: 20,
    loop: false,
    centeredSlides: true,
    centeredSlidesBounds: true,
    centerInsufficientSlides: true,
    grabCursor: true,
    speed: 500,
    navigation: {
      nextEl: ".liked-books-next",
      prevEl: ".liked-books-prev",
    },
    pagination: {
      el: ".liked-books-pagination",
      enabled: false,
    },
    breakpoints: {
      0: { slidesPerView: 2 },
      600: { slidesPerView: 3 },
      900: { slidesPerView: 5 },
      1200: { slidesPerView: 6 },
    },
  });
}

// ---------- OPEN LIBRARY COVER RESOLUTION ----------
const buildCoverUrl = (type, id) => `https://covers.openlibrary.org/b/${type}/${encodeURIComponent(id)}-L.jpg?default=false`;

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
    const olid = doc?.cover_edition_key || (Array.isArray(doc?.edition_key) ? doc.edition_key[0] : null);
    return olid || null;
  } catch (_) {
    return null;
  }
}

async function resolveCoverForImage(img) {
  const original = img.getAttribute("src");
  const { isbn, olid, title, author } = img.dataset;

  if (isbn) {
    const u = await urlIfExists(buildCoverUrl("isbn", isbn));
    if (u) { img.src = u; return; }
  }

  if (olid) {
    const u = await urlIfExists(buildCoverUrl("olid", olid));
    if (u) { img.src = u; return; }
  }

  if (title) {
    const foundOlid = await fetchOlidByQuery(title, author);
    if (foundOlid) {
      const u = await urlIfExists(buildCoverUrl("olid", foundOlid));
      if (u) { img.src = u; return; }
    }
  }

  // Fallback image
  if (title) {
    img.alt = title + (author ? ` by ${author}` : "");
  }
  img.src = "assets/images/book_fb.png";
}

async function enhanceBookCovers() {
  const selector = [
    ".book-carousel img[data-isbn], .book-carousel img[data-olid], .book-carousel img[data-title]",
    ".new-arrivals .swiper-slide img[data-isbn], .new-arrivals .swiper-slide img[data-olid], .new-arrivals .swiper-slide img[data-title]",
    ".liked-books .swiper-slide img[data-isbn], .liked-books .swiper-slide img[data-olid], .liked-books .swiper-slide img[data-title]",
  ].join(", ");

  const imgs = document.querySelectorAll(selector);
  await Promise.all(Array.from(imgs).map(resolveCoverForImage));
}

// ---------- DATA-DRIVEN RENDERING ----------
function bookCardHTML(b) {
  const attrs = [
    b.isbn ? `data-isbn="${b.isbn}"` : "",
    b.olid ? `data-olid="${b.olid}"` : "",
    b.title ? `data-title="${b.title}"` : "",
    b.author ? `data-author="${b.author}"` : "",
  ].filter(Boolean).join(" ");
  const safeAlt = b.title ? `${b.title}` : "Book";
  const genre = b.genre || "";
  return `
    <div class="book-card" data-id="${b.id || ''}" data-genre="${genre}">
      <img src="assets/images/book_fb.png" alt="${safeAlt}" ${attrs} />
      <div class="book-meta">
        <div class="book-title">${b.title || "Untitled"}</div>
        <div class="book-sub">${b.author || "Unknown"}${genre ? " • " + genre : ""}</div>
      </div>
    </div>`;
}

function renderFromData(data) {
  // Catalog
  const catalogEl = document.querySelector(".book-carousel");
  if (catalogEl && Array.isArray(data.catalog)) {
    catalogEl.innerHTML = data.catalog.map(bookCardHTML).join("");
  }

  // Swipers
  const renderSwiper = (rootSelector, arr) => {
    const root = document.querySelector(rootSelector);
    if (!root) return;
    const wrapper = root.querySelector(".swiper-wrapper");
    if (!wrapper) return;
    const slides = (arr || []).map(b => `<div class="swiper-slide">${bookCardHTML(b)}</div>`).join("");
    wrapper.innerHTML = slides;
  };

  renderSwiper(".new-arrivals", data.newArrivals);
  renderSwiper(".liked-books", data.liked);
}

async function initDashboardFromJson() {
  try {
    const res = await fetch("data/books.json");
    const data = await res.json();
    renderFromData(data);
    createSwipers();
    await enhanceBookCovers();
    enableBookClicks();
  } catch (e) {
    console.error("Failed loading books.json", e);
    // Still initialize swipers so UI works
    createSwipers();
    await enhanceBookCovers();
    enableBookClicks();
  }
}

// Kick off after DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboardFromJson);
} else {
  initDashboardFromJson();
}

// ---------- CLICK TO DETAILS ----------
function enableBookClicks() {
  const root = document.querySelector(".content") || document;
  root.addEventListener("click", (e) => {
    const card = e.target.closest('.book-card');
    if (!card) return;
    const id = card.dataset.id;
    const img = card.querySelector('img');
    const payload = {
      id,
      title: img?.dataset.title || card.querySelector('.book-title')?.textContent || '',
      author: img?.dataset.author || '',
      isbn: img?.dataset.isbn || '',
      olid: img?.dataset.olid || '',
      genre: card.dataset.genre || ''
    };
    try {
      localStorage.setItem('selectedBook', JSON.stringify(payload));
    } catch (_) {}
    if (id) {
      window.location.href = `book_details.html?id=${encodeURIComponent(id)}`;
    } else {
      window.location.href = `book_details.html`;
    }
  });
}

// using PNG fallback instead
