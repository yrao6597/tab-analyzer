// drag.js — Widget-style drag-and-drop rearrangement for dashboard cards
// Uses SortableJS. Layout is persisted to localStorage.

const STORAGE_KEY = "tabaholics-layout";

function saveLayout() {
  const left  = [...document.querySelectorAll(".col-left  > .card")].map(el => el.dataset.id);
  const right = [...document.querySelectorAll(".col-right > .card")].map(el => el.dataset.id);
  const stats = [...document.querySelectorAll(".stats-row > .stat-card")].map(el => el.dataset.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ left, right, stats }));
}

function restoreLayout() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  const { left = [], right = [], stats = [] } = JSON.parse(saved);
  const colLeft  = document.querySelector(".col-left");
  const colRight = document.querySelector(".col-right");
  const statsRow = document.querySelector(".stats-row");

  for (const id of left) {
    const card = document.querySelector(`.card[data-id="${id}"]`);
    if (card) colLeft.appendChild(card);
  }
  for (const id of right) {
    const card = document.querySelector(`.card[data-id="${id}"]`);
    if (card) colRight.appendChild(card);
  }
  for (const id of stats) {
    const card = document.querySelector(`.stat-card[data-id="${id}"]`);
    if (card) statsRow.appendChild(card);
  }
}

function initDrag() {
  const colLeft  = document.querySelector(".col-left");
  const colRight = document.querySelector(".col-right");
  const statsRow = document.querySelector(".stats-row");

  const cardOptions = {
    group:       "cards",   // allows dragging between columns
    animation:   180,
    ghostClass:  "card-ghost",
    chosenClass: "card-chosen",
    dragClass:   "card-dragging",
    handle:      ".drag-handle",
    onEnd:       saveLayout,
  };

  Sortable.create(colLeft,  cardOptions);
  Sortable.create(colRight, cardOptions);

  // Stats row is its own group — stat cards stay within the row
  Sortable.create(statsRow, {
    animation:   180,
    ghostClass:  "card-ghost",
    chosenClass: "card-chosen",
    dragClass:   "card-dragging",
    handle:      ".drag-handle",
    onEnd:       saveLayout,
  });

  restoreLayout();
}

initDrag();
