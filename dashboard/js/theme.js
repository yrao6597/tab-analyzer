// theme.js — Theme toggle; depends on renderers.js (renderHourlyChart, renderStats)

function initTheme() {
  const btn    = document.getElementById("btn-theme");
  const btnZen = document.getElementById("btn-zen");

  // Restore saved theme
  const saved = localStorage.getItem("theme");
  if (saved === "light") {
    document.body.classList.add("light");
    btn.textContent = "🌙 Dark";
  } else if (saved === "zen") {
    document.body.classList.add("zen");
    btnZen.classList.add("active");
  }

  // Light / dark toggle — exits zen if active
  btn.addEventListener("click", () => {
    document.body.classList.remove("zen");
    btnZen.classList.remove("active");
    const isLight = document.body.classList.toggle("light");
    btn.textContent = isLight ? "🌙 Dark" : "☀ Light";
    localStorage.setItem("theme", isLight ? "light" : "dark");
    renderHourlyChart(cachedVisits);
    renderStats(cachedVisits);
  });

  // Zen toggle — mutually exclusive with light/dark
  btnZen.addEventListener("click", () => {
    const isZen = document.body.classList.toggle("zen");
    btnZen.classList.toggle("active", isZen);
    if (isZen) {
      document.body.classList.remove("light");
      btn.textContent = "☀ Light";
      localStorage.setItem("theme", "zen");
    } else {
      localStorage.setItem("theme", "dark");
    }
    renderHourlyChart(cachedVisits);
    renderStats(cachedVisits);
  });
}
