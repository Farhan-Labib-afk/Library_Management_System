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

// Swiper carousels
const newArrivalsSwiper = new Swiper(".new-arrivals", {
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

const likedBooksSwiper = new Swiper(".liked-books", {
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
