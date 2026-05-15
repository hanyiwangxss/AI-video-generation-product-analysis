const dataUrl = "data/products_seed.json";

const state = {
  products: [],
  filtered: [],
  compare: new Set(),
  lang: "en",
  overlay: false,
};

const queryInput = document.getElementById("query");
const languageSelect = document.getElementById("language");
const statusSelect = document.getElementById("status");
const categorySelect = document.getElementById("category");
const sortSelect = document.getElementById("sort");
const cardsContainer = document.getElementById("cards");
const compareRow = document.getElementById("compare-row");
const radarBoard = document.getElementById("radar-board");
const overlayToggle = document.getElementById("overlay-toggle");
const dimensionHelp = document.getElementById("dimension-help");
const productCount = document.getElementById("product-count");
const sourceCount = document.getElementById("source-count");
const lastUpdated = document.getElementById("last-updated");
const scrollButton = document.getElementById("scroll-to-results");

const SCORE_DIMENSIONS = [
  { key: "quality", label: { en: "Output quality", zh: "画质表现" } },
  { key: "control", label: { en: "Control", zh: "可控性" } },
  { key: "speed", label: { en: "Speed", zh: "速度" } },
  { key: "cost", label: { en: "Cost efficiency", zh: "成本效率" } },
  { key: "ecosystem", label: { en: "Ecosystem", zh: "生态与集成" } },
  { key: "availability", label: { en: "Availability", zh: "可用性" } },
];
const SCORE_DIMENSION_HELP = [
  {
    key: "quality",
    text: {
      en: "Visual fidelity, motion coherence, and artifact control.",
      zh: "画面细节、运动连贯性与伪影控制。",
    },
  },
  {
    key: "control",
    text: {
      en: "Prompt following, editability, and fine-grained controls.",
      zh: "提示词遵循、可编辑性与细粒度控制能力。",
    },
  },
  {
    key: "speed",
    text: {
      en: "Generation latency and overall throughput.",
      zh: "生成时延与整体产出效率。",
    },
  },
  {
    key: "cost",
    text: {
      en: "Price relative to quality and output volume.",
      zh: "成本与质量/产出效率的匹配度。",
    },
  },
  {
    key: "ecosystem",
    text: {
      en: "Integrations, workflows, and product ecosystem fit.",
      zh: "工具链集成、流程支持与生态适配。",
    },
  },
  {
    key: "availability",
    text: {
      en: "Access, regional coverage, and waitlist constraints.",
      zh: "可获得性、地区覆盖与排队限制。",
    },
  },
];
const UX_DIMENSIONS = [
  { key: "motion_realism", label: { en: "Motion realism", zh: "运动真实感" } },
  { key: "prompt_adherence", label: { en: "Prompt adherence", zh: "提示词一致性" } },
  { key: "control_tools", label: { en: "Control tools", zh: "控制工具" } },
  { key: "stability_consistency", label: { en: "Stability", zh: "稳定性" } },
  { key: "speed_queue", label: { en: "Speed & queue", zh: "速度与排队" } },
  { key: "pricing_value", label: { en: "Value for money", zh: "性价比" } },
];
const UX_SECTION_LABEL = {
  en: "User experience (last 6 months)",
  zh: "用户体验（近 6 个月）",
};
const UX_COMPARE_LABEL = {
  en: "User experience (6 months)",
  zh: "用户体验（近 6 个月）",
};
const MAX_SCORE = 5;
const RADAR_COLORS = ["#d36b2c", "#2c5ad3", "#2c8f6b"];

const pickLang = (field, lang) => {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (field[lang]) return field[lang];
  return field.en || field.zh || "";
};

const joinList = (values) => (values && values.length ? values.join("; ") : "—");
const formatRating = (value) =>
  typeof value === "number" && !Number.isNaN(value) ? `${value}/${MAX_SCORE}` : "—";

const getSourceCount = (product) => {
  const base = (product.sources || []).length;
  const ux = (product.user_experience && product.user_experience.sources) || [];
  return base + ux.length;
};

const renderScoreHelp = () => {
  if (!dimensionHelp) return;
  dimensionHelp.innerHTML = SCORE_DIMENSIONS.map((dimension) => {
    const help = SCORE_DIMENSION_HELP.find((item) => item.key === dimension.key);
    const label = pickLang(dimension.label, state.lang);
    const desc = pickLang(help && help.text, state.lang);
    return `<div class="dimension-item"><strong>${label}:</strong> ${desc}</div>`;
  }).join("");
};

const renderUxRatings = (ratings) => {
  const data = ratings || {};
  return UX_DIMENSIONS.map((dimension) => {
    const label = pickLang(dimension.label, state.lang);
    const value = formatRating(data[dimension.key]);
    return `<div class="ux-item"><span>${label}</span><strong>${value}</strong></div>`;
  }).join("");
};

const updateFilters = () => {
  const statuses = new Set();
  const categories = new Set();
  state.products.forEach((product) => {
    if (product.status) statuses.add(product.status);
    (product.category || []).forEach((cat) => categories.add(cat));
  });

  const fillSelect = (select, items) => {
    const current = select.value;
    select.innerHTML = '<option value="all">All</option>';
    Array.from(items)
      .sort()
      .forEach((item) => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
      });
    if (Array.from(select.options).some((opt) => opt.value === current)) {
      select.value = current;
    }
  };

  fillSelect(statusSelect, statuses);
  fillSelect(categorySelect, categories);
};

const matchQuery = (product, query) => {
  if (!query) return true;
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const blob = [
    pickLang(product.name, state.lang),
    product.vendor,
    product.status,
    joinList(product.category),
    pickLang(product.capabilities, state.lang),
    pickLang(product.pricing, state.lang),
    joinList(product.limitations),
    joinList(product.use_cases),
    pickLang(product.notes, state.lang),
    pickLang(product.user_experience && product.user_experience.summary, state.lang),
  ]
    .join(" ")
    .toLowerCase();

  return tokens.every((token) => blob.includes(token));
};

const applyFilters = () => {
  const query = queryInput.value.trim();
  const status = statusSelect.value;
  const category = categorySelect.value;

  state.filtered = state.products.filter((product) => {
    if (!matchQuery(product, query)) return false;
    if (status !== "all" && product.status !== status) return false;
    if (category !== "all" && !(product.category || []).includes(category)) return false;
    return true;
  });

  const sortMode = sortSelect.value;
  state.filtered.sort((a, b) => {
    if (sortMode === "sources") {
      return getSourceCount(b) - getSourceCount(a);
    }
    return (pickLang(a.name, state.lang) || "").localeCompare(
      pickLang(b.name, state.lang) || ""
    );
  });

  renderCards();
  renderCompare();
};

const toggleCompare = (id) => {
  if (state.compare.has(id)) {
    state.compare.delete(id);
  } else if (state.compare.size < 3) {
    state.compare.add(id);
  }
  renderCards();
  renderCompare();
};

const renderCards = () => {
  cardsContainer.innerHTML = "";
  if (!state.filtered.length) {
    cardsContainer.innerHTML = '<div class="card">No matching products.</div>';
    return;
  }

  state.filtered.forEach((product) => {
    const card = document.createElement("div");
    card.className = "card";

    const name = pickLang(product.name, state.lang) || product.id;
    const capabilities = pickLang(product.capabilities, state.lang) || "—";
    const pricing = pickLang(product.pricing, state.lang) || "—";
    const notes = pickLang(product.notes, state.lang) || "—";
    const uxSummary = pickLang(
      product.user_experience && product.user_experience.summary,
      state.lang
    );
    const uxRatings = renderUxRatings(
      product.user_experience && product.user_experience.ratings
    );

    const badges = (product.category || [])
      .map((cat) => `<span class="badge">${cat}</span>`)
      .join("");

    const sources = (product.sources || [])
      .map(
        (src) =>
          `<a href="${src.url}" target="_blank" rel="noreferrer">${src.title} (${src.date})</a>`
      )
      .join("");

    const uxSources = ((product.user_experience && product.user_experience.sources) || [])
      .map(
        (src) =>
          `<a href="${src.url}" target="_blank" rel="noreferrer">${src.title} (${src.date})</a>`
      )
      .join("");

    card.innerHTML = `
      <div>
        <h3>${name}</h3>
        <div class="card-section"><strong>${product.vendor}</strong> · ${product.status}</div>
      </div>
      <div class="badges">${badges}</div>
      <div class="card-section"><strong>Capabilities:</strong> ${capabilities}</div>
      <div class="card-section"><strong>Pricing:</strong> ${pricing}</div>
      <div class="card-section"><strong>Limitations:</strong> ${joinList(
        product.limitations
      )}</div>
      <div class="card-section"><strong>Use cases:</strong> ${joinList(product.use_cases)}</div>
      <div class="card-section"><strong>Notes:</strong> ${notes}</div>
      <div class="card-section"><strong>${pickLang(
        UX_SECTION_LABEL,
        state.lang
      )}:</strong> ${uxSummary || "—"}</div>
      <div class="ux-grid">${uxRatings}</div>
      <div class="card-section"><strong>UX sources:</strong></div>
      <div class="sources">${uxSources || "—"}</div>
      <div class="card-section"><strong>Product sources:</strong></div>
      <div class="sources">${sources || "—"}</div>
      <div class="card-actions">
        <span>${getSourceCount(product)} sources</span>
        <button class="compare-btn" data-id="${product.id}">Compare</button>
      </div>
    `;

    const compareButton = card.querySelector(".compare-btn");
    const selected = state.compare.has(product.id);
    compareButton.textContent = selected ? "Remove" : "Compare";
    compareButton.disabled = !selected && state.compare.size >= 3;
    compareButton.addEventListener("click", () => toggleCompare(product.id));

    cardsContainer.appendChild(card);
  });
};

const renderCompare = () => {
  compareRow.innerHTML = "";
  const selected = state.products.filter((product) => state.compare.has(product.id));

  if (!selected.length) {
    compareRow.innerHTML = '<div class="compare-card">Select products to compare.</div>';
    radarBoard.innerHTML = '<div class="radar-card">Select products to view radar.</div>';
    return;
  }

  renderRadarBoard(selected);

  selected.forEach((product) => {
    const card = document.createElement("div");
    card.className = "compare-card";
    const uxSummary = pickLang(
      product.user_experience && product.user_experience.summary,
      state.lang
    );
    const uxRatings = renderUxRatings(
      product.user_experience && product.user_experience.ratings
    );
    card.innerHTML = `
      <h3>${pickLang(product.name, state.lang) || product.id}</h3>
      <div class="meta">${product.vendor} · ${product.status}</div>
      <div class="meta">Categories: ${joinList(product.category)}</div>
      <div>${pickLang(product.capabilities, state.lang) || "—"}</div>
      <div class="meta">Pricing: ${pickLang(product.pricing, state.lang) || "—"}</div>
      <div class="meta">Limitations: ${joinList(product.limitations)}</div>
      <div class="meta">Use cases: ${joinList(product.use_cases)}</div>
      <div class="meta">${pickLang(UX_COMPARE_LABEL, state.lang)}: ${
        uxSummary || "—"
      }</div>
      <div class="ux-grid">${uxRatings}</div>
    `;
    compareRow.appendChild(card);
  });
};

const buildRadarSvg = (products, overlay) => {
  const size = 240;
  const center = size / 2;
  const radius = 80;
  const levels = MAX_SCORE;
  const dims = SCORE_DIMENSIONS.length;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("class", "radar-svg");

  const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  gridGroup.setAttribute("fill", "none");
  gridGroup.setAttribute("stroke", "#e4d8c8");
  gridGroup.setAttribute("stroke-width", "1");

  for (let level = 1; level <= levels; level += 1) {
    const r = (radius * level) / levels;
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", center.toString());
    circle.setAttribute("cy", center.toString());
    circle.setAttribute("r", r.toString());
    gridGroup.appendChild(circle);
  }

  SCORE_DIMENSIONS.forEach((dimension, index) => {
    const angle = (Math.PI * 2 * index) / dims - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    const axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    axis.setAttribute("x1", center.toString());
    axis.setAttribute("y1", center.toString());
    axis.setAttribute("x2", x.toString());
    axis.setAttribute("y2", y.toString());
    axis.setAttribute("stroke", "#d9cbbb");
    axis.setAttribute("stroke-width", "1");
    gridGroup.appendChild(axis);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const labelOffset = 16;
    label.setAttribute("x", (center + (radius + labelOffset) * Math.cos(angle)).toString());
    label.setAttribute("y", (center + (radius + labelOffset) * Math.sin(angle)).toString());
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    label.setAttribute("font-size", "10");
    label.setAttribute("fill", "#5b5146");
    label.textContent = pickLang(dimension.label, state.lang);
    gridGroup.appendChild(label);
  });

  svg.appendChild(gridGroup);

  products.forEach((entry, index) => {
    const product = entry.product;
    const scores = product.scores || {};
    const points = SCORE_DIMENSIONS.map((dimension, dimIndex) => {
      const angle = (Math.PI * 2 * dimIndex) / dims - Math.PI / 2;
      const raw = Number(scores[dimension.key] || 0);
      const score = Math.min(MAX_SCORE, Math.max(0, raw));
      const r = (radius * score) / MAX_SCORE;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");

    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", points);
    polygon.setAttribute("fill", entry.color);
    polygon.setAttribute("stroke", entry.color);
    polygon.setAttribute("stroke-width", "2");
    polygon.setAttribute("fill-opacity", overlay ? "0.18" : "0.35");
    svg.appendChild(polygon);
  });

  return svg;
};

const renderRadarBoard = (selected) => {
  radarBoard.innerHTML = "";
  const entries = selected.map((product, index) => ({
    product,
    color: RADAR_COLORS[index % RADAR_COLORS.length],
  }));

  if (state.overlay && entries.length > 1) {
    const card = document.createElement("div");
    card.className = "radar-card overlay";
    card.innerHTML = `<h3>Overlay radar</h3>`;
    card.appendChild(buildRadarSvg(entries, true));

    const legend = document.createElement("div");
    legend.className = "radar-legend";
    entries.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "legend-item";
      item.innerHTML = `<span class="legend-swatch" style="background:${entry.color}"></span>${
        pickLang(entry.product.name, state.lang) || entry.product.id
      }`;
      legend.appendChild(item);
    });
    card.appendChild(legend);
    radarBoard.appendChild(card);
    return;
  }

  entries.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "radar-card";
    card.innerHTML = `<h3>${pickLang(entry.product.name, state.lang) || entry.product.id}</h3>`;
    card.appendChild(buildRadarSvg([entry], false));
    radarBoard.appendChild(card);
  });
};

const updateStats = () => {
  productCount.textContent = state.products.length;
  const sources = state.products.reduce(
    (total, product) => total + getSourceCount(product),
    0
  );
  sourceCount.textContent = sources;
  lastUpdated.textContent = `Last updated: ${new Date().toISOString().slice(0, 10)}`;
};

const init = async () => {
  const response = await fetch(dataUrl);
  const payload = await response.json();
  state.products = payload.products || [];
  state.filtered = [...state.products];
  updateStats();
  updateFilters();
  renderScoreHelp();
  applyFilters();
};

queryInput.addEventListener("input", applyFilters);
languageSelect.addEventListener("change", (event) => {
  state.lang = event.target.value;
  renderScoreHelp();
  applyFilters();
});
overlayToggle.addEventListener("change", (event) => {
  state.overlay = event.target.checked;
  renderCompare();
});
statusSelect.addEventListener("change", applyFilters);
categorySelect.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);
scrollButton.addEventListener("click", () => {
  document.getElementById("results").scrollIntoView({ behavior: "smooth" });
});

init();
