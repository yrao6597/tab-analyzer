// guilt-cleaner.js — Guilt Tab Cleaner feature; depends on utils.js + categories.js

let guiltCandidates = []; // [{ tabId, url, domain, activeRatio }]

async function openGuiltCleaner() {
  const [chromeTabs, { openVisits = [] }] = await Promise.all([
    chrome.tabs.query({}),
    chrome.runtime.sendMessage({ type: "GET_OPEN_TABS" }).catch(() => ({ openVisits: [] })),
  ]);

  const ratioByUrl = {};
  for (const v of openVisits) {
    if (v.url) ratioByUrl[v.url] = ratio(v);
  }

  guiltCandidates = chromeTabs
    .filter(t => t.url && !t.url.startsWith("chrome://") && t.url in ratioByUrl)
    .map(t => ({
      tabId:       t.id,
      url:         t.url,
      title:       t.title || "",
      domain:      new URL(t.url).hostname.replace(/^www\./, ""),
      activeRatio: ratioByUrl[t.url],
    }));

  document.getElementById("guilt-open-total").textContent = chromeTabs.filter(
    t => t.url && !t.url.startsWith("chrome://")
  ).length;

  updateGuiltCleanerPreview(parseInt(document.getElementById("guilt-slider").value));
  document.getElementById("guilt-cleaner-modal").style.display = "flex";
}

function updateGuiltCleanerPreview(threshold) {
  const thresholdRatio = threshold / 100;
  const qualifying     = guiltCandidates.filter(c => c.activeRatio < thresholdRatio);

  document.getElementById("guilt-qualify-count").textContent   = qualifying.length;
  document.getElementById("guilt-threshold-label").textContent = threshold;

  const catCounts = {};
  for (const c of qualifying) {
    const cat = categorizeDomain(c.domain);
    if (!catCounts[cat.name]) catCounts[cat.name] = { emoji: cat.emoji, count: 0 };
    catCounts[cat.name].count++;
  }

  const top3 = Object.entries(catCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([name, { emoji, count }]) => `${emoji} ${name} (${count})`)
    .join(", ");

  document.getElementById("guilt-top-domains").textContent =
    top3 ? `Top categories: ${top3}` : "";

  // Refresh the list if it's currently open
  const listEl = document.getElementById("guilt-tab-list");
  if (listEl.style.display !== "none") renderGuiltTabList();
}

function renderGuiltTabList() {
  const threshold  = parseInt(document.getElementById("guilt-slider").value) / 100;
  const qualifying = guiltCandidates
    .filter(c => c.activeRatio < threshold)
    .sort((a, b) => b.activeRatio - a.activeRatio); // highest → lowest engagement

  const listEl = document.getElementById("guilt-tab-list");

  if (qualifying.length === 0) {
    listEl.innerHTML = `<div class="guilt-tab-list-empty">No tabs qualify at this threshold.</div>`;
    return;
  }

  listEl.innerHTML = qualifying.map(c => {
    const { emoji } = categorizeDomain(c.domain);
    const title     = c.title || c.domain;
    return `
      <div class="guilt-tab-list-item">
        <span class="guilt-tab-list-emoji">${emoji}</span>
        <div class="guilt-tab-list-info">
          <div class="guilt-tab-list-title" title="${c.url}">${title}</div>
          <div class="guilt-tab-list-domain">${c.domain}</div>
        </div>
        <span class="guilt-badge red">${Math.round(c.activeRatio * 100)}%</span>
      </div>`;
  }).join("");
}

function toggleGuiltTabList() {
  const listEl = document.getElementById("guilt-tab-list");
  const btnEl  = document.getElementById("btn-view-guilt-tabs");
  const isOpen = listEl.style.display !== "none";

  if (isOpen) {
    listEl.style.display = "none";
    btnEl.textContent    = "👁 View Guilt Tabs";
  } else {
    listEl.style.display = "block";
    btnEl.textContent    = "👁 Hide Guilt Tabs";
    renderGuiltTabList();
  }
}

async function closeGuiltTabs() {
  const threshold  = parseInt(document.getElementById("guilt-slider").value) / 100;
  const qualifying = guiltCandidates.filter(c => c.activeRatio < threshold);
  const tabIds     = qualifying.map(c => c.tabId);

  if (tabIds.length === 0) return;

  await chrome.tabs.remove(tabIds);
  closeGuiltCleaner();
  setTimeout(initDashboard, 300);
}

function closeGuiltCleaner() {
  document.getElementById("guilt-cleaner-modal").style.display = "none";
  document.getElementById("guilt-tab-list").style.display      = "none";
  document.getElementById("btn-view-guilt-tabs").textContent   = "👁 View Guilt Tabs";
}
