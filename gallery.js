const gallery = document.querySelector("#public-gallery");
const emptyState = document.querySelector("#empty-state");
const dialog = document.querySelector("#photo-dialog");
const dialogImage = document.querySelector("#dialog-image");
const closeDialog = document.querySelector("#close-dialog");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadPhotos() {
  const response = await fetch("/api/photos");
  return response.json();
}

async function renderPublicGallery() {
  const photos = await loadPhotos();

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

gallery.addEventListener("click", async (event) => {
  const item = event.target.closest(".masonry-item");
  if (!item) return;

  const photos = await loadPhotos();
  const photo = photos[Number(item.dataset.index)];
  if (!photo) return;

  dialogImage.src = photo.url;
  dialogImage.alt = photo.title;
  dialog.showModal();
});

closeDialog.addEventListener("click", () => {
  dialog.close();
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    dialog.close();
  }
});

renderPublicGallery();
