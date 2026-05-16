const gallery = document.querySelector("#public-gallery");
const emptyState = document.querySelector("#empty-state");
const dialog = document.querySelector("#photo-dialog");
const dialogImage = document.querySelector("#dialog-image");
const closeDialog = document.querySelector("#close-dialog");
const prevPhoto = document.querySelector("#prev-photo");
const nextPhoto = document.querySelector("#next-photo");
const photoCounter = document.querySelector("#photo-counter");

let photos = [];
let currentIndex = 0;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadPhotos() {
  const response = await fetch("./photos.json", { cache: "no-store" });
  if (!response.ok) return [];
  return response.json();
}

async function renderPublicGallery() {
  photos = await loadPhotos();

  emptyState.classList.toggle("is-hidden", photos.length > 0);
  gallery.innerHTML = "";

  photos.forEach((photo, index) => {
    const item = document.createElement("button");
    item.className = "masonry-item";
    item.type = "button";
    item.dataset.index = String(index);
    item.innerHTML = `<img src="${photo.url}" alt="${escapeHtml(photo.title)}" />`;
    gallery.append(item);
  });
}

function updateLightbox() {
  const photo = photos[currentIndex];
  if (!photo) return;

  dialogImage.src = photo.url;
  dialogImage.alt = photo.title;
  photoCounter.textContent = `${currentIndex + 1} / ${photos.length}`;
  prevPhoto.disabled = photos.length <= 1;
  nextPhoto.disabled = photos.length <= 1;
}

function showPhoto(index) {
  if (photos.length === 0) return;

  currentIndex = (index + photos.length) % photos.length;
  updateLightbox();
}

gallery.addEventListener("click", (event) => {
  const item = event.target.closest(".masonry-item");
  if (!item) return;

  showPhoto(Number(item.dataset.index));
  dialog.showModal();
});

prevPhoto.addEventListener("click", () => {
  showPhoto(currentIndex - 1);
});

nextPhoto.addEventListener("click", () => {
  showPhoto(currentIndex + 1);
});

closeDialog.addEventListener("click", () => {
  dialog.close();
});

document.addEventListener("keydown", (event) => {
  if (!dialog.open) return;

  if (event.key === "ArrowLeft") {
    showPhoto(currentIndex - 1);
  }

  if (event.key === "ArrowRight") {
    showPhoto(currentIndex + 1);
  }
});

renderPublicGallery().catch(() => {
  emptyState.classList.remove("is-hidden");
});
