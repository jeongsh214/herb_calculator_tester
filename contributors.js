const darkBtn = document.getElementById("darkBtn");
const contributorList = document.getElementById("contributorList");

function isDarkMode() {
  return document.documentElement.classList.contains("dark");
}

function applyDarkMode(enabled) {
  document.documentElement.classList.toggle("dark", enabled);
  if (darkBtn) {
    darkBtn.textContent = enabled ? "☀️" : "🌙";
  }
}

function loadDarkMode() {
  const savedTheme = localStorage.getItem("sharedDarkMode");
  applyDarkMode(savedTheme === "dark");
}

function toggleDarkMode() {
  const nextDark = !isDarkMode();
  localStorage.setItem("sharedDarkMode", nextDark ? "dark" : "light");
  applyDarkMode(nextDark);
}

function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    location.href = "index.html";
  }
}

function parseCSVLine(line) {
  return line.split(",").map((value) => value.trim());
}

async function loadContributors() {
  try {
    const response = await fetch("./contributors.csv");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
    const rows = lines.slice(1);

    contributorList.innerHTML = "";

    rows.forEach((line) => {
      const [markName, displayName] = parseCSVLine(line);
      if (!markName || !displayName) return;

      const card = document.createElement("div");
      card.className = "link-card";

      const title = document.createElement("div");
      title.className = "link-card-title";
      title.textContent = displayName;

      const sub = document.createElement("div");
      sub.className = "link-card-sub";
      sub.textContent = markName;

      card.appendChild(title);
      card.appendChild(sub);
      contributorList.appendChild(card);
    });

    if (!contributorList.children.length) {
      contributorList.innerHTML = `
        <div class="link-card">
          <div class="link-card-title">표시할 데이터 없음</div>
        </div>
      `;
    }
  } catch (error) {
    console.error("contributors.csv 로드 실패", error);
    contributorList.innerHTML = `
      <div class="link-card">
        <div class="link-card-title">CSV 로드 실패</div>
      </div>
    `;
  }
}

darkBtn?.addEventListener("click", toggleDarkMode);

loadDarkMode();
loadContributors();