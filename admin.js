const form = document.querySelector("#photo-form");
const input = document.querySelector("#photo-input");
const titleInput = document.querySelector("#photo-title");
const noteInput = document.querySelector("#photo-note");
const searchInput = document.querySelector("#search-input");
const clearButton = document.querySelector("#clear-button");
const grid = document.querySelector("#gallery-grid");
const emptyState = document.querySelector("#empty-state");
const photoCount = document.querySelector("#photo-count");
const dialog = document.querySelector("#photo-dialog");
const dialogImage = document.querySelector("#dialog-image");
const dialogTitle = document.querySelector("#dialog-title");
const dialogNote = document.querySelector("#dialog-note");
const closeDialog = document.querySelector("#close-dialog");

let photos = [];

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getFilteredPhotos() {
  const keyword = searchInput.value.trim().toLowerCase();
  if (!keyword) return photos;

  return photos.filter((photo) => {
    return `${photo.title} ${photo.note}`.toLowerCase().includes(keyword);
  });
}

async function loadPhotos() {
  const response = await fetch("/api/photos");
  photos = await response.json();
  renderGallery();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderGallery() {
  const visiblePhotos = getFilteredPhotos();

  photoCount.textContent = `등록된 사진 ${photos.length}장`;
  emptyState.classList.toggle("is-hidden", photos.length > 0);
  grid.innerHTML = "";

  visiblePhotos.forEach((photo) => {
    const card = document.createElement("article");
    card.className = "photo-card";
    card.innerHTML = `
      <img src="${photo.url}" alt="${escapeHtml(photo.title)}" />
      <div class="photo-card-body">
        <div>
          <h3>${escapeHtml(photo.title)}</h3>
          <p>${escapeHtml(photo.note || formatDate(photo.createdAt))}</p>
        </div>
        <div class="card-actions">
          <button type="button" data-action="view" data-id="${photo.id}">보기</button>
          <button class="delete" type="button" data-action="delete" data-id="${photo.id}">삭제</button>
        </div>
      </div>
    `;
    grid.append(card);
  });
}

function openPhoto(photo) {
  dialogImage.src = photo.url;
  dialogImage.alt = photo.title;
  dialogTitle.textContent = photo.title;
  dialogNote.textContent = photo.note || formatDate(photo.createdAt);
  dialog.showModal();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const files = Array.from(input.files).filter((file) => file.type.startsWith("image/"));
  if (files.length === 0) {
    input.click();
    return;
  }

  const title = titleInput.value.trim();
  const note = noteInput.value.trim();
  const formData = new FormData();
  files.forEach((file) => formData.append("photos", file));
  formData.append("title", title);
  formData.append("note", note);

  const response = await fetch("/api/photos", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    alert("사진 등록에 실패했습니다.");
    return;
  }

  form.reset();
  await loadPhotos();
});

grid.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const photo = photos.find((item) => item.id === button.dataset.id);
  if (!photo) return;

  if (button.dataset.action === "delete") {
    await fetch(`/api/photos/${photo.id}`, { method: "DELETE" });
    await loadPhotos();
    return;
  }

  openPhoto(photo);
});

searchInput.addEventListener("input", renderGallery);

clearButton.addEventListener("click", async () => {
  if (photos.length === 0) return;
  const shouldClear = confirm("등록된 사진을 모두 삭제할까요?");
  if (!shouldClear) return;

  await fetch("/api/photos", { method: "DELETE" });
  await loadPhotos();
});

closeDialog.addEventListener("click", () => {
  dialog.close();
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    dialog.close();
  }
});

loadPhotos();
