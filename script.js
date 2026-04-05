let total = 0;
let resultMap = {};
let needMap = {};

const IMG_PATH = "items/";
const DARK_MODE_KEY = "sharedDarkMode";

const scoreMap = {
  A: 1,
  B: 2,
  C: 3,
  S: 4,
};

const groupLabels = {
  A: "A그룹",
  B: "B그룹",
  C: "C그룹",
  S: "S그룹",
};

const items = {
  A: [
    { src: IMG_PATH + "a1.png", name: "녹태" },
    { src: IMG_PATH + "a2.png", name: "민들레" },
    { src: IMG_PATH + "a3.png", name: "생강" },
    { src: IMG_PATH + "a4.png", name: "영군버섯" },
    { src: IMG_PATH + "a5.png", name: "옥취엽" },
  ],
  B: [
    { src: IMG_PATH + "b1.png", name: "백향초" },
    { src: IMG_PATH + "b2.png", name: "자운초" },
    { src: IMG_PATH + "b3.png", name: "적주과" },
    { src: IMG_PATH + "b4.png", name: "황초" },
    { src: IMG_PATH + "b5.png", name: "흑성과" },
  ],
  C: [
    { src: IMG_PATH + "c1.png", name: "권엽" },
    { src: IMG_PATH + "c2.png", name: "금양광초" },
    { src: IMG_PATH + "c3.png", name: "옥향초" },
    { src: IMG_PATH + "c4.png", name: "인삼" },
    null,
  ],
  S: [
    { src: IMG_PATH + "s1.png", name: "금향과" },
    { src: IMG_PATH + "s2.png", name: "빙백설화" },
    { src: IMG_PATH + "s3.png", name: "월계엽" },
    { src: IMG_PATH + "s4.png", name: "철목영지" },
    { src: IMG_PATH + "s5.png", name: "홍련업화" },
  ],
};

const groupsContainer = document.getElementById("groupsContainer");
const totalEl = document.getElementById("total");
const resultEl = document.getElementById("result");
const needSelect = document.getElementById("needSelect");
const neededTotalsEl = document.getElementById("neededTotals");
const darkBtn = document.getElementById("darkBtn");
const resetBtn = document.getElementById("resetBtn");
const toggleHeader = document.getElementById("toggleGroupsHeader");
const groupsContent = document.getElementById("groupsContent");
const groupCollapseIcon = document.getElementById("groupCollapseIcon");

function isDarkMode() {
  return document.documentElement.classList.contains("dark");
}

function createGroupTitle(group) {
  const title = document.createElement("div");
  title.className = "group-title";

  const name = document.createElement("div");
  name.className = "group-name";
  name.innerText = groupLabels[group];

  const score = document.createElement("div");
  score.className = "group-score";
  score.innerText = `+${scoreMap[group]}`;

  title.appendChild(name);
  title.appendChild(score);
  return title;
}

function renderItems() {
  groupsContainer.innerHTML = "";

  for (const group in items) {
    const row = document.createElement("div");
    row.className = "group-row";

    const title = createGroupTitle(group);
    const itemArea = document.createElement("div");
    itemArea.className = "group-items";

    items[group].forEach((item) => {
      const wrapper = document.createElement("div");
      wrapper.className = "item";

      if (!item) {
        const empty = document.createElement("div");
        empty.className = "empty";
        wrapper.appendChild(empty);

        const emptyLabel = document.createElement("div");
        emptyLabel.className = "label";
        emptyLabel.innerText = "";
        wrapper.appendChild(emptyLabel);

        itemArea.appendChild(wrapper);
        return;
      }

      const imageBox = document.createElement("div");
      imageBox.className = "image-box";

      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.name;
      img.dataset.group = group;
      img.addEventListener("click", () => toggleItem(img));

      const label = document.createElement("div");
      label.className = "label";
      label.innerText = item.name;

      imageBox.appendChild(img);
      wrapper.appendChild(imageBox);
      wrapper.appendChild(label);
      itemArea.appendChild(wrapper);
    });

    row.appendChild(title);
    row.appendChild(itemArea);
    groupsContainer.appendChild(row);
  }
}

async function loadCSV() {
  try {
    const response = await fetch("./results.csv");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
    const rows = lines.slice(1);

    resultMap = {};

    rows.forEach((line) => {
      const [score, result, color] = line.split(",");
      if (score && result) {
        resultMap[score.trim()] = {
          text: result.trim(),
          color: (color || "#000000").trim(),
        };
      }
    });

    updateResult();
  } catch (error) {
    console.error("CSV 로드 실패:", error);
    resultEl.innerText = "CSV 오류";
    resultEl.style.color = "#dc2626";
  }
}

async function loadNeedCSV() {
  try {
    const response = await fetch("./need.csv");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
    const rows = lines.slice(1);

    needMap = {};
    needSelect.innerHTML = '<option value="">환 선택</option>';

    rows.forEach((line) => {
      const [name, need] = line.split(",");
      if (name && need) {
        const trimmedName = name.trim();
        needMap[trimmedName] = need.trim();

        const option = document.createElement("option");
        option.value = trimmedName;
        option.innerText = trimmedName;
        needSelect.appendChild(option);
      }
    });
  } catch (error) {
    console.error("need.csv 로드 실패", error);
  }
}

function getSelectedImages() {
  return document.querySelectorAll("#groupsContainer img.selected");
}

function toggleItem(element) {
  const group = element.dataset.group;
  const score = scoreMap[group];
  const selectedCount = getSelectedImages().length;
  const wrapper = element.closest(".item");
  const imageBox = element.closest(".image-box");

  if (element.classList.contains("selected")) {
    element.classList.remove("selected");
    wrapper.classList.remove("selected-item");
    imageBox.classList.remove("selected");
    total -= score;
  } else {
    if (selectedCount >= 5) return;

    element.classList.add("selected");
    wrapper.classList.add("selected-item");
    imageBox.classList.add("selected");
    total += score;
  }

  totalEl.innerText = total;
  updateResult();
}

function updateResult() {
  const selectedCount = getSelectedImages().length;

  if (selectedCount < 3) {
    resultEl.innerText = "-";
    resultEl.style.color = isDarkMode() ? "#f9fafb" : "#000000";
    return;
  }

  const data = resultMap[String(total)];

  if (data) {
    resultEl.innerText = data.text;
    resultEl.style.color = data.color;
  } else {
    resultEl.innerText = "-";
    resultEl.style.color = isDarkMode() ? "#f9fafb" : "#000000";
  }
}

function reset() {
  total = 0;
  totalEl.innerText = total;

  resultEl.innerText = "-";
  resultEl.style.color = isDarkMode() ? "#f9fafb" : "#000000";

  document.querySelectorAll("#groupsContainer img").forEach((img) => {
    img.classList.remove("selected");
  });

  document.querySelectorAll("#groupsContainer .item").forEach((item) => {
    item.classList.remove("selected-item");
  });

  document.querySelectorAll("#groupsContainer .image-box").forEach((box) => {
    box.classList.remove("selected");
  });
}

function toggleGroups() {
  const collapsed = groupsContent.classList.toggle("collapsed");
  groupCollapseIcon.innerText = collapsed ? "+" : "−";
  toggleHeader.setAttribute("aria-expanded", String(!collapsed));
}

function applyDarkMode(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  darkBtn.innerText = isDark ? "☀️" : "🌙";
  updateResult();
}

function loadDarkMode() {
  const saved = localStorage.getItem(DARK_MODE_KEY);
  applyDarkMode(saved === "dark");
}

function toggleDarkMode() {
  const nextDark = !isDarkMode();
  localStorage.setItem(DARK_MODE_KEY, nextDark ? "dark" : "light");
  applyDarkMode(nextDark);
}

function bindEvents() {
  needSelect.addEventListener("change", () => {
    const selected = needSelect.value;
    neededTotalsEl.innerText = selected && needMap[selected] ? needMap[selected] : "-";
  });

  darkBtn.addEventListener("click", toggleDarkMode);
  resetBtn.addEventListener("click", reset);

  toggleHeader.addEventListener("click", toggleGroups);
  toggleHeader.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleGroups();
    }
  });
}

async function init() {
  renderItems();
  loadDarkMode();
  bindEvents();
  await Promise.all([loadCSV(), loadNeedCSV()]);
}

init();