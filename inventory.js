const STORAGE_KEY = "recipePlannerData_v1";
const DARK_KEY = "sharedDarkMode";
const LONG_PRESS_MS = 500;

let needMap = {};

const materialGroups = {
  A: { label: "A그룹", score: 1 },
  B: { label: "B그룹", score: 2 },
  C: { label: "C그룹", score: 3 },
  S: { label: "S그룹", score: 4 },
};

const materialsByGroup = {
  A: [
    { src: "items/a1.png", name: "녹태" },
    { src: "items/a2.png", name: "민들레" },
    { src: "items/a3.png", name: "생강" },
    { src: "items/a4.png", name: "영군버섯" },
    { src: "items/a5.png", name: "옥취엽" },
  ],
  B: [
    { src: "items/b1.png", name: "백향초" },
    { src: "items/b2.png", name: "자운초" },
    { src: "items/b3.png", name: "적주과" },
    { src: "items/b4.png", name: "황초" },
    { src: "items/b5.png", name: "흑성과" },
  ],
  C: [
    { src: "items/c1.png", name: "권엽" },
    { src: "items/c2.png", name: "금양광초" },
    { src: "items/c3.png", name: "옥향초" },
    { src: "items/c4.png", name: "인삼" },
  ],
  S: [
    { src: "items/s1.png", name: "금향과" },
    { src: "items/s2.png", name: "빙백설화" },
    { src: "items/s3.png", name: "월계엽" },
    { src: "items/s4.png", name: "철목영지" },
    { src: "items/s5.png", name: "홍련업화" },
  ],
};

const resultGroups = {
  "저등급 환": [
    { name: "황토환", src: "results/a.png" },
    { name: "활생환", src: "results/b1.png" },
    { name: "청심환", src: "results/c1.png" },
    { name: "대력환", src: "results/d1.png" },
    { name: "명목환", src: "results/e1.png" },
  ],
  "중등급 환": [
    { name: "회생환", src: "results/b2.png" },
    { name: "천심환", src: "results/c2.png" },
    { name: "강근환", src: "results/d2.png" },
    { name: "천목환", src: "results/e2.png" },
  ],
  "고등급 환": [
    { name: "만년환", src: "results/b3.png" },
    { name: "천세환", src: "results/c3.png" },
    { name: "용력환", src: "results/d3.png" },
    { name: "신목환", src: "results/e3.png" },
  ],
};

const scoreResultMap = {
  3: "황토환",
  4: "활생환",
  5: "청심환",
  6: "대력환",
  7: "명목환",
  8: "회생환",
  9: "강근환",
  10: "천심환",
  11: "천목환",
  12: "만년환",
  13: "천세환",
  14: "용력환",
  15: "신목환",
  16: "녹환단",
  17: "청환단",
  18: "흑환단",
  19: "황환단",
};

const RESULT_DISPLAY_ORDER = [
  "만년환",
  "천세환",
  "용력환",
  "신목환",
  "회생환",
  "천심환",
  "강근환",
  "천목환",
  "활생환",
  "청심환",
  "대력환",
  "명목환",
  "황토환",
];

const allMaterials = [];
const allResults = [];

for (const groupKey in materialsByGroup) {
  materialsByGroup[groupKey].forEach((item) => {
    allMaterials.push({
      ...item,
      group: groupKey,
      score: materialGroups[groupKey].score,
    });
  });
}

for (const groupName in resultGroups) {
  resultGroups[groupName].forEach((item) => {
    allResults.push({
      ...item,
      group: groupName,
    });
  });
}

let state = buildDefaultState();
let isDirty = false;

function isDarkMode() {
  return document.documentElement.classList.contains("dark");
}

function buildDefaultState() {
  const materials = {};
  const results = {};

  allMaterials.forEach((item) => {
    materials[item.name] = {
      enabled: false,
      count: 0,
      priority: false,
    };
  });

  allResults.forEach((item) => {
    results[item.name] = {
      enabled: false,
      count: 0,
      priority: false,
    };
  });

  return { materials, results };
}

function sanitizeInt(value) {
  const num = parseInt(value, 10);
  if (Number.isNaN(num) || num < 0) return 0;
  return num;
}

function normalizeState(raw) {
  const fresh = buildDefaultState();

  if (!raw || typeof raw !== "object") {
    return fresh;
  }

  if (raw.materials && typeof raw.materials === "object") {
    Object.keys(fresh.materials).forEach((name) => {
      if (raw.materials[name]) {
        fresh.materials[name] = {
          enabled: !!raw.materials[name].enabled,
          count: sanitizeInt(raw.materials[name].count),
          priority: !!raw.materials[name].priority,
        };
      }
    });
  }

  if (raw.results && typeof raw.results === "object") {
    Object.keys(fresh.results).forEach((name) => {
      if (raw.results[name]) {
        fresh.results[name] = {
          enabled: !!raw.results[name].enabled,
          count: sanitizeInt(raw.results[name].count),
          priority: !!raw.results[name].priority,
        };
      }
    });
  }

  return fresh;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    state = buildDefaultState();
    isDirty = false;
    return;
  }

  try {
    state = normalizeState(JSON.parse(saved));
  } catch (error) {
    console.error("저장 데이터 로드 실패", error);
    state = buildDefaultState();
  }

  isDirty = false;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  isDirty = false;
  updateSaveStatus();
}

function markDirty() {
  isDirty = true;
  updateSaveStatus();
}

function updateSaveStatus() {
  const el = document.getElementById("saveStatus");
  el.textContent = isDirty ? "저장 안됨" : "저장됨";
  el.className = isDirty ? "unsaved" : "saved";
}

function applyDarkMode(enabled) {
  document.documentElement.classList.toggle("dark", enabled);
  const btn = document.getElementById("darkModeBtn");
  if (btn) {
    btn.textContent = enabled ? "☀️" : "🌙";
  }
}

function loadDarkMode() {
  const saved = localStorage.getItem(DARK_KEY);
  applyDarkMode(saved === "dark");
}

function toggleDarkMode() {
  const nextDark = !isDarkMode();
  localStorage.setItem(DARK_KEY, nextDark ? "dark" : "light");
  applyDarkMode(nextDark);
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

    rows.forEach((line) => {
      const [name, need] = line.split(",");
      if (!name || !need) return;

      const rawName = name.trim();
      const trimmedNeed = need.trim();

      const baseName = rawName.replace(/\(.*?\)/, "").trim();
      const effectMatch = rawName.match(/\((.*?)\)/);
      const effectText = effectMatch ? effectMatch[1].trim() : "";

      needMap[baseName] = {
        need: trimmedNeed,
        effect: effectText,
      };
    });
  } catch (error) {
    console.error("need.csv 로드 실패", error);
    needMap = {};
  }
}

function createFallback(text) {
  const div = document.createElement("div");
  div.className = "fallback";
  div.textContent = text;
  return div;
}

function createImageOrFallback(item) {
  if (!item.src) {
    return createFallback(item.name);
  }

  const img = document.createElement("img");
  img.src = item.src;
  img.alt = item.name;
  img.draggable = false;
  img.setAttribute("draggable", "false");
  img.onerror = () => {
    img.replaceWith(createFallback(item.name));
  };
  return img;
}

function attachPressEvents(target, clickHandler, longHandler) {
  let timer = null;
  let longPressed = false;
  let pressStarted = false;

  const clearPress = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const start = (e) => {
    e.preventDefault();
    clearPress();
    longPressed = false;
    pressStarted = true;

    timer = setTimeout(() => {
      longPressed = true;
      timer = null;
      longHandler();
    }, LONG_PRESS_MS);
  };

  const end = (e) => {
    e.preventDefault();

    if (!pressStarted) return;
    pressStarted = false;

    const wasLongPressed = longPressed;
    clearPress();

    if (!wasLongPressed) {
      clickHandler();
    }

    longPressed = false;
  };

  const cancel = () => {
    pressStarted = false;
    longPressed = false;
    clearPress();
  };

  target.addEventListener("pointerdown", start);
  target.addEventListener("pointerup", end);
  target.addEventListener("pointerleave", cancel);
  target.addEventListener("pointercancel", cancel);
  target.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
}

function toggleEnabled(bucket, name) {
  const itemState = state[bucket][name];
  itemState.enabled = !itemState.enabled;

  if (!itemState.enabled) {
    itemState.priority = false;
  }

  markDirty();
  renderAll();
}

function togglePriority(bucket, name) {
  const itemState = state[bucket][name];

  if (!itemState.enabled) {
    itemState.enabled = true;
  }

  itemState.priority = !itemState.priority;
  markDirty();
  renderAll();
}

function updateCount(bucket, name, value) {
  state[bucket][name].count = sanitizeInt(value);
  markDirty();
}

function createCard(item, itemState, bucket, name) {
  const wrapper = document.createElement("div");
  wrapper.className = "item";

  const card = document.createElement("div");
  card.className = "item-card";
  if (itemState.enabled) card.classList.add("enabled");
  if (itemState.priority) card.classList.add("priority");

  const imageBox = document.createElement("div");
  imageBox.className = "image-box";
  imageBox.appendChild(createImageOrFallback(item));

  attachPressEvents(
    imageBox,
    () => toggleEnabled(bucket, name),
    () => togglePriority(bucket, name)
  );

  const badgeRow = document.createElement("div");
  badgeRow.className = "badge-row";

  if (itemState.enabled) {
    const badge = document.createElement("span");
    badge.className = "badge enabled";
    badge.textContent = bucket === "materials" ? "사용" : "목표";
    badgeRow.appendChild(badge);
  }

  if (itemState.priority) {
    const badge = document.createElement("span");
    badge.className = "badge priority";
    badge.textContent = "우선";
    badgeRow.appendChild(badge);
  }

  const label = document.createElement("div");
  label.className = "label";
  label.textContent = name;

  card.appendChild(imageBox);
  card.appendChild(badgeRow);
  card.appendChild(label);

if (bucket === "results") {
  const needInfo = needMap[name];

  const effectText = document.createElement("div");
  effectText.className = "effect-text";
  effectText.textContent = needInfo?.effect || "-";
  card.appendChild(effectText);

  const needText = document.createElement("div");
  needText.className = "need-text";
  needText.textContent = `필요 수치: ${needInfo?.need || "-"}`;
  card.appendChild(needText);
}

  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.step = "1";
  input.className = "count-input";
  input.value = itemState.count;
  input.addEventListener("input", () => {
    updateCount(bucket, name, input.value);
  });

  card.appendChild(input);
  wrapper.appendChild(card);

  return wrapper;
}

function renderMaterialSection() {
  const container = document.getElementById("materialContainer");
  container.innerHTML = "";

  for (const groupKey in materialsByGroup) {
    const row = document.createElement("div");
    row.className = "group-row";

    const title = document.createElement("div");
    title.className = "group-title";
    title.innerHTML = `
      <div class="group-name">${materialGroups[groupKey].label}</div>
      <div class="group-score">+${materialGroups[groupKey].score}</div>
    `;

    const itemArea = document.createElement("div");
    itemArea.className = "group-items";

    materialsByGroup[groupKey].forEach((item) => {
      itemArea.appendChild(createCard(item, state.materials[item.name], "materials", item.name));
    });

    row.appendChild(title);
    row.appendChild(itemArea);
    container.appendChild(row);
  }
}

function renderResultSection() {
  const container = document.getElementById("resultContainer");
  container.innerHTML = "";

  for (const groupName in resultGroups) {
    const row = document.createElement("div");
    row.className = "group-row";

    const title = document.createElement("div");
    title.className = "group-title";
    title.innerHTML = `
      <div class="group-name">${groupName}</div>
      <div class="group-score">결과</div>
    `;

    const itemArea = document.createElement("div");
    itemArea.className = "group-items";

    resultGroups[groupName].forEach((item) => {
      itemArea.appendChild(createCard(item, state.results[item.name], "results", item.name));
    });

    row.appendChild(title);
    row.appendChild(itemArea);
    container.appendChild(row);
  }
}

function getEnabledTargets() {
  return allResults.filter((item) => state.results[item.name].enabled && state.results[item.name].count > 0);
}

function getEnabledMaterials() {
  return allMaterials.filter((item) => state.materials[item.name].enabled && state.materials[item.name].count > 0);
}

function getResultOrderIndex(name) {
  const index = RESULT_DISPLAY_ORDER.indexOf(name);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function getCombinationResult(comboItems) {
  const score = comboItems.reduce((sum, item) => sum + item.score, 0);
  return scoreResultMap[score] || "-";
}

function getAllowedRunsForCombo(comboItems, targetNeedCount) {
  return Math.min(
    targetNeedCount,
    ...comboItems.map((item) => state.materials[item.name].count)
  );
}

function buildCombos(items, minLength = 3, maxLength = 5) {
  const results = [];

  function dfs(startIndex, current) {
    if (current.length >= minLength && current.length <= maxLength) {
      results.push([...current]);
    }

    if (current.length === maxLength) {
      return;
    }

    for (let i = startIndex; i < items.length; i += 1) {
      current.push(items[i]);
      dfs(i + 1, current);
      current.pop();
    }
  }

  dfs(0, []);
  return results;
}

function getRecipeSortValue(recipe) {
  const priorityCount = recipe.comboItems.filter((item) => state.materials[item.name].priority).length;
  const totalCountScore = recipe.comboItems.reduce(
    (sum, item) => sum + state.materials[item.name].count,
    0
  );

  return {
    priorityCount,
    materialLength: recipe.comboItems.length,
    totalCountScore,
  };
}

function compareRecipes(a, b) {
  const aValue = getRecipeSortValue(a);
  const bValue = getRecipeSortValue(b);

  if (aValue.priorityCount !== bValue.priorityCount) {
    return bValue.priorityCount - aValue.priorityCount;
  }

  if (aValue.materialLength !== bValue.materialLength) {
    return bValue.materialLength - aValue.materialLength;
  }

  if (a.allowedRuns !== b.allowedRuns) {
    return b.allowedRuns - a.allowedRuns;
  }

  if (aValue.totalCountScore !== bValue.totalCountScore) {
    return bValue.totalCountScore - aValue.totalCountScore;
  }

  return a.comboItems
    .map((item) => item.name)
    .join(",")
    .localeCompare(
      b.comboItems.map((item) => item.name).join(","),
      "ko"
    );
}

function buildImpossibleRecipe(target, reason) {
  return {
    targetName: target.name,
    predictedResult: "조합 불가",
    comboItems: [],
    allowedRuns: 0,
    targetPriority: state.results[target.name].priority,
    isPossible: false,
    failReason: reason,
  };
}

function buildRecipeCandidates() {
  const targets = getEnabledTargets();
  const enabledMaterials = getEnabledMaterials();

  if (!targets.length) {
    return [];
  }

  const allCombos = buildCombos(enabledMaterials, 3, 5);
  const candidates = [];

  targets.forEach((target) => {
    const targetState = state.results[target.name];
    const matchedRecipes = [];

    allCombos.forEach((comboItems) => {
      const predicted = getCombinationResult(comboItems);

      if (predicted !== target.name) {
        return;
      }

      const allowedRuns = getAllowedRunsForCombo(comboItems, targetState.count);

      if (allowedRuns <= 0) {
        return;
      }

      matchedRecipes.push({
        targetName: target.name,
        predictedResult: predicted,
        comboItems: [...comboItems],
        allowedRuns,
        targetPriority: targetState.priority,
        isPossible: true,
      });
    });

    if (!matchedRecipes.length) {
      let reason = "선택한 재료로 만들 수 있는 조합이 없다";

      if (enabledMaterials.length < 3) {
        reason = "선택된 재료가 3개 미만이다";
      } else {
        const anyMatchedIgnoringCount = allCombos.some((comboItems) => {
          return getCombinationResult(comboItems) === target.name;
        });

        if (!anyMatchedIgnoringCount) {
          reason = "선택한 재료 조합 중 해당 환이 나오는 조합이 없다";
        } else {
          reason = "재료 개수가 부족해 현재 조합할 수 없다";
        }
      }

      candidates.push(buildImpossibleRecipe(target, reason));
      return;
    }

    matchedRecipes.sort(compareRecipes);
    candidates.push(matchedRecipes[0]);
  });

  candidates.sort((a, b) => {
    if (a.targetPriority !== b.targetPriority) {
      return a.targetPriority ? -1 : 1;
    }

    const orderDiff = getResultOrderIndex(a.targetName) - getResultOrderIndex(b.targetName);
    if (orderDiff !== 0) {
      return orderDiff;
    }

    if (a.isPossible !== b.isPossible) {
      return a.isPossible ? -1 : 1;
    }

    return compareRecipes(a, b);
  });

  return candidates;
}

function createRecipeCard(recipe) {
  const card = document.createElement("div");
  card.className = "recipe-card";

  const title = document.createElement("div");
  title.className = "recipe-card-title";
  title.textContent = recipe.targetName;

  const sub = document.createElement("div");
  sub.className = "recipe-card-sub";
  sub.textContent = recipe.isPossible
    ? `예상 결과: ${recipe.predictedResult}`
    : "상태: 조합 불가";

  card.appendChild(title);
  card.appendChild(sub);

  if (recipe.comboItems.length) {
    const itemsWrap = document.createElement("div");
    itemsWrap.className = "recipe-items";

    recipe.comboItems.forEach((item) => {
      const itemWrap = document.createElement("div");
      itemWrap.className = "recipe-item";
      if (state.materials[item.name].priority) itemWrap.classList.add("priority");

      const image = document.createElement("div");
      image.className = "recipe-image";
      image.appendChild(createImageOrFallback(item));

      const name = document.createElement("div");
      name.className = "recipe-item-name";
      name.textContent = item.name;

      itemWrap.appendChild(image);
      itemWrap.appendChild(name);

      if (state.materials[item.name].priority) {
        const priority = document.createElement("div");
        priority.className = "recipe-item-priority";
        priority.textContent = "우선";
        itemWrap.appendChild(priority);
      }

      itemsWrap.appendChild(itemWrap);
    });

    card.appendChild(itemsWrap);
  }

  const info = document.createElement("div");
  info.className = "recipe-info";

  if (recipe.isPossible) {
    const priorityCount = recipe.comboItems.filter((item) => state.materials[item.name].priority).length;

    info.innerHTML = `
      목표 환: <strong>${recipe.targetName}</strong><br>
      예상 조합 결과:
      <span class="recipe-ok">${recipe.predictedResult}</span><br>
      우선 사용 재료 수: <strong>${priorityCount}</strong>개<br>
      사용 재료 수: <strong>${recipe.comboItems.length}</strong>개<br>
      실행 가능 횟수: <strong>${recipe.allowedRuns}</strong>회
    `;
  } else {
    info.innerHTML = `
      목표 환: <strong>${recipe.targetName}</strong><br>
      상태:
      <span class="recipe-bad">조합 불가</span><br>
      사유: <strong>${recipe.failReason}</strong>
    `;
  }

  card.appendChild(info);

  const controls = document.createElement("div");
  controls.className = "recipe-controls";

  const label = document.createElement("label");
  label.textContent = "조합 횟수";

  const input = document.createElement("input");
  input.type = "number";
  input.min = "1";
  input.step = "1";
  input.value = recipe.allowedRuns > 0 ? "1" : "0";
  input.className = "recipe-run-input";
  input.disabled = !recipe.isPossible;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "recipe-run-btn";
  button.textContent = recipe.isPossible ? "조합하기" : "조합 불가";
  button.disabled = !recipe.isPossible || recipe.allowedRuns <= 0;

  button.addEventListener("click", () => {
    executeRecipe(recipe, input);
  });

  controls.appendChild(label);
  controls.appendChild(input);
  controls.appendChild(button);

  card.appendChild(controls);

  return card;
}

function renderRecipes() {
  const recipeList = document.getElementById("recipeList");
  recipeList.innerHTML = "";

  const recipes = buildRecipeCandidates();

  if (!recipes.length) {
    const empty = document.createElement("div");
    empty.className = "recipe-empty";
    empty.textContent = "추천 결과 없음";
    recipeList.appendChild(empty);
    return;
  }

  recipes.forEach((recipe) => {
    recipeList.appendChild(createRecipeCard(recipe));
  });
}

function executeRecipe(recipe, inputEl) {
  const runCount = sanitizeInt(inputEl.value);

  if (runCount <= 0) {
    alert("1 이상 입력해야 한다.");
    return;
  }

  const allowedRuns = recipe.allowedRuns;
  const targetState = state.results[recipe.targetName];

  if (allowedRuns <= 0) {
    alert("현재 조합할 수 없다.");
    return;
  }

  if (runCount > allowedRuns) {
    alert(`현재 ${allowedRuns}회까지만 조합할 수 있다.`);
    return;
  }

  recipe.comboItems.forEach((item) => {
    state.materials[item.name].count = Math.max(0, state.materials[item.name].count - runCount);
  });

  targetState.count = Math.max(0, targetState.count - runCount);

  if (targetState.count === 0) {
    targetState.enabled = false;
    targetState.priority = false;
  }

  markDirty();
  renderAll();
  renderRecipes();
}

function resetMaterials() {
  const confirmed = window.confirm("재료를 초기화할까요?");
  if (!confirmed) return;

  Object.keys(state.materials).forEach((name) => {
    state.materials[name] = {
      enabled: false,
      count: 0,
      priority: false,
    };
  });

  markDirty();
  renderAll();
  renderRecipes();
}

function resetResults() {
  const confirmed = window.confirm("원하는 환을 초기화할까요?");
  if (!confirmed) return;

  Object.keys(state.results).forEach((name) => {
    state.results[name] = {
      enabled: false,
      count: 0,
      priority: false,
    };
  });

  markDirty();
  renderAll();
  renderRecipes();
}

function toggleSection(containerId, iconId) {
  const container = document.getElementById(containerId);
  const icon = document.getElementById(iconId);

  if (!container || !icon) return;

  const isCollapsed = container.classList.toggle("collapsed");
  icon.textContent = isCollapsed ? "+" : "−";
}

function bindCollapsibleHeaders() {
  document.querySelectorAll(".collapsible-header").forEach((header) => {
    header.addEventListener("click", (e) => {
      if (e.target.closest(".section-reset-btn")) return;
      toggleSection(header.dataset.target, header.dataset.icon);
    });
  });
}

function renderAll() {
  renderMaterialSection();
  renderResultSection();
  updateSaveStatus();
}

function bindGlobalEvents() {
  document.addEventListener("contextmenu", (e) => {
    if (e.target.closest(".image-box") || e.target.closest(".recipe-image")) {
      e.preventDefault();
    }
  });

  document.getElementById("saveBtn").addEventListener("click", saveState);
  document.getElementById("darkModeBtn").addEventListener("click", toggleDarkMode);
  document.getElementById("resetMaterialsBtn").addEventListener("click", resetMaterials);
  document.getElementById("resetResultsBtn").addEventListener("click", resetResults);
  document.getElementById("recommendBtn").addEventListener("click", renderRecipes);
}

async function initInventory() {
  loadDarkMode();
  loadState();
  await loadNeedCSV();
  renderAll();
  bindCollapsibleHeaders();
  bindGlobalEvents();
  renderRecipes();
}

initInventory();