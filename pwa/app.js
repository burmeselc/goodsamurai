const els = {
  dateTitle: document.querySelector("#dateTitle"),
  datePicker: document.querySelector("#datePicker"),
  prevDay: document.querySelector("#prevDay"),
  nextDay: document.querySelector("#nextDay"),
  todayButton: document.querySelector("#todayButton"),
  memoList: document.querySelector("#memoList"),
  emptyState: document.querySelector("#emptyState"),
  composer: document.querySelector("#composer"),
  submitMemo: document.querySelector("#submitMemo"),
  draftStatus: document.querySelector("#draftStatus"),
  editDialog: document.querySelector("#editDialog"),
  editText: document.querySelector("#editText"),
  saveEdit: document.querySelector("#saveEdit"),
  deleteMemo: document.querySelector("#deleteMemo"),
  settingsButton: document.querySelector("#settingsButton"),
  settingsDialog: document.querySelector("#settingsDialog"),
  exportJson: document.querySelector("#exportJson"),
  importJson: document.querySelector("#importJson"),
  persistStatus: document.querySelector("#persistStatus"),
  requestPersist: document.querySelector("#requestPersist"),
  largeTextToggle: document.querySelector("#largeTextToggle"),
};

let currentDate = startOfDay(new Date());
let editingId = null;
let draftTimer = null;

function pad(n) {
  return String(n).padStart(2, "0");
}

function localDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameLocalDay(iso, date) {
  const d = new Date(iso);
  return localDateKey(d) === localDateKey(date);
}

function formatTitle(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatTime(iso) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function render() {
  els.dateTitle.textContent = formatTitle(currentDate);
  els.datePicker.value = localDateKey(currentDate);

  const all = await DiaryDB.getAllMemos();
  const memos = all
    .filter(m => !m.deleted && sameLocalDay(m.createdAt, currentDate))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  els.memoList.innerHTML = "";
  els.emptyState.style.display = memos.length ? "none" : "block";

  for (const memo of memos) {
    const card = document.createElement("article");
    card.className = "memo-card";
    card.dataset.id = memo.id;

    const updated =
      memo.updatedAt && memo.updatedAt !== memo.createdAt
        ? `<div class="memo-updated">編集 ${formatTime(memo.updatedAt)}</div>`
        : "";

    card.innerHTML = `
      <div class="memo-time">${formatTime(memo.createdAt)}</div>
      <div class="memo-text">${escapeHtml(memo.text)}</div>
      ${updated}
    `;
    card.addEventListener("click", () => openEdit(memo.id));
    els.memoList.appendChild(card);
  }
}

async function createMemo() {
  const text = els.composer.value.trim();
  if (!text) return;

  const now = new Date().toISOString();
  const memo = {
    id: crypto.randomUUID(),
    text,
    createdAt: now,
    updatedAt: now,
    tags: [],
    pinned: false,
    deleted: false,
  };

  await DiaryDB.putMemo(memo);
  els.composer.value = "";
  localStorage.removeItem("sekikana-draft");
  els.draftStatus.textContent = "保存しました";
  currentDate = startOfDay(new Date());
  await render();

  setTimeout(() => {
    els.draftStatus.textContent = "下書き自動保存";
  }, 1200);
}

async function openEdit(id) {
  const all = await DiaryDB.getAllMemos();
  const memo = all.find(m => m.id === id);
  if (!memo) return;

  editingId = id;
  els.editText.value = memo.text;
  els.editDialog.showModal();
}

async function saveEdit() {
  if (!editingId) return;
  const all = await DiaryDB.getAllMemos();
  const memo = all.find(m => m.id === editingId);
  if (!memo) return;

  const text = els.editText.value.trim();
  if (!text) return;

  memo.text = text;
  memo.updatedAt = new Date().toISOString();
  await DiaryDB.putMemo(memo);
  editingId = null;
  els.editDialog.close();
  await render();
}

async function deleteEditingMemo() {
  if (!editingId) return;
  const ok = confirm("この記録を削除しますか？");
  if (!ok) return;

  const all = await DiaryDB.getAllMemos();
  const memo = all.find(m => m.id === editingId);
  if (!memo) return;

  memo.deleted = true;
  memo.updatedAt = new Date().toISOString();
  await DiaryDB.putMemo(memo);
  editingId = null;
  els.editDialog.close();
  await render();
}

function shiftDay(amount) {
  currentDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate() + amount
  );
  render();
}

function saveDraftSoon() {
  clearTimeout(draftTimer);
  els.draftStatus.textContent = "入力中……";
  draftTimer = setTimeout(() => {
    localStorage.setItem("sekikana-draft", els.composer.value);
    els.draftStatus.textContent = "下書き保存済み";
  }, 500);
}

function restoreDraft() {
  const draft = localStorage.getItem("sekikana-draft");
  if (draft) els.composer.value = draft;
}

async function exportData() {
  const memos = await DiaryDB.getAllMemos();
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: "sekikana-local-journal",
    memos,
  };

  const blob = new Blob(
    [JSON.stringify(payload, null, 2)],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sekikana-journal-${localDateKey(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function importData(file) {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    alert("JSONを読み取れませんでした。");
    return;
  }

  if (!data || !Array.isArray(data.memos)) {
    alert("このファイルは日録のバックアップではないやうです。");
    return;
  }

  const ok = confirm(
    `現在の記録を ${data.memos.length} 件のバックアップで置き換へます。よろしいですか？`
  );
  if (!ok) return;

  await DiaryDB.replaceAll(data.memos);
  await render();
  alert("復元しました。");
}

async function updatePersistStatus() {
  if (!navigator.storage?.persisted) {
    els.persistStatus.textContent = "この環境では永続保存状態を確認できません。";
    els.requestPersist.disabled = true;
    return;
  }

  const persisted = await navigator.storage.persisted();
  els.persistStatus.textContent = persisted
    ? "永続保存として扱はれてゐます。"
    : "通常のブラウザー保存領域です。定期的なJSON書出しを推奨します。";
}

async function requestPersist() {
  if (!navigator.storage?.persist) return;
  const granted = await navigator.storage.persist();
  await updatePersistStatus();
  alert(granted ? "永続保存が許可されました。" : "永続保存は許可されませんでした。");
}

function loadPrefs() {
  const large = localStorage.getItem("sekikana-large-text") === "1";
  els.largeTextToggle.checked = large;
  document.body.classList.toggle("large-text", large);
}

function registerEvents() {
  els.submitMemo.addEventListener("click", createMemo);
  els.composer.addEventListener("input", saveDraftSoon);
  els.composer.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      createMemo();
    }
  });

  els.prevDay.addEventListener("click", () => shiftDay(-1));
  els.nextDay.addEventListener("click", () => shiftDay(1));
  els.todayButton.addEventListener("click", () => {
    currentDate = startOfDay(new Date());
    render();
  });

  els.datePicker.addEventListener("change", () => {
    currentDate = parseDateKey(els.datePicker.value);
    render();
  });

  els.saveEdit.addEventListener("click", saveEdit);
  els.deleteMemo.addEventListener("click", deleteEditingMemo);

  els.settingsButton.addEventListener("click", async () => {
    await updatePersistStatus();
    els.settingsDialog.showModal();
  });

  els.exportJson.addEventListener("click", exportData);
  els.importJson.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) importData(file);
    e.target.value = "";
  });

  els.requestPersist.addEventListener("click", requestPersist);

  els.largeTextToggle.addEventListener("change", () => {
    const on = els.largeTextToggle.checked;
    document.body.classList.toggle("large-text", on);
    localStorage.setItem("sekikana-large-text", on ? "1" : "0");
  });
}

async function init() {
  registerEvents();
  restoreDraft();
  loadPrefs();
  await render();

  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
    } catch (err) {
      console.warn("Service Worker registration failed:", err);
    }
  }
}

init();
