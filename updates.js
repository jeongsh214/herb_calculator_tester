const darkBtn = document.getElementById("darkBtn");
const updateList = document.getElementById("updateList");

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

function compareVersionsDesc(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  const maxLen = Math.max(pa.length, pb.length);

  for (let i = 0; i < maxLen; i += 1) {
    const av = pa[i] || 0;
    const bv = pb[i] || 0;
    if (av !== bv) return bv - av;
  }

  return 0;
}

async function loadUpdates() {
  try {
    const response = await fetch("./updates.csv");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
    const rows = lines.slice(1);

    const versionMap = {};

    rows.forEach((line) => {
      const [version, content] = parseCSVLine(line);
      if (!version || !content) return;

      if (!versionMap[version]) {
        versionMap[version] = [];
      }

      versionMap[version].push(content);
    });

    updateList.innerHTML = "";

    Object.keys(versionMap)
      .sort(compareVersionsDesc)
      .forEach((version) => {
        const versionTitle = document.createElement("div");
        versionTitle.className = "update-version";
        versionTitle.textContent = `VER.${version}`;

        const itemsWrap = document.createElement("div");
        itemsWrap.className = "update-items";

        versionMap[version].forEach((content) => {
          const item = document.createElement("div");
          item.className = "update-item";
          item.textContent = `※ ${content}`;
          itemsWrap.appendChild(item);
        });

        updateList.appendChild(versionTitle);
        updateList.appendChild(itemsWrap);
      });

    if (!updateList.children.length) {
      updateList.innerHTML = `
        <div class="update-item">표시할 데이터 없음</div>
      `;
    }
  } catch (error) {
    console.error("updates.csv 로드 실패", error);
    updateList.innerHTML = `
      <div class="update-item">CSV 로드 실패</div>
    `;
  }
}

darkBtn?.addEventListener("click", toggleDarkMode);

loadDarkMode();
loadUpdates();