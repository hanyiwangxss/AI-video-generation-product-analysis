const dataUrl = "data/products_seed.json";

const state = {
  products: [],
  filtered: [],
  compare: new Set(),
  lang: "en",
};

const queryInput = document.getElementById("query");
const languageSelect = document.getElementById("language");
const statusSelect = document.getElementById("status");
const categorySelect = document.getElementById("category");
const sortSelect = document.getElementById("sort");
const cardsContainer = document.getElementById("cards");
const compareRow = document.getElementById("compare-row");
const productCount = document.getElementById("product-count");
const sourceCount = document.getElementById("source-count");
const lastUpdated = document.getElementById("last-updated");
const scrollButton = document.getElementById("scroll-to-results");

const pickLang = (field, lang) => {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (field[lang]) return field[lang];
  return field.en || field.zh || "";
};

const joinList = (values) => (values && values.length ? values.join("; ") : "—");

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
      return (b.sources || []).length - (a.sources || []).length;
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

    const badges = (product.category || [])
      .map((cat) => `<span class="badge">${cat}</span>`)
      .join("");

    const sources = (product.sources || [])
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
      <div class="sources">${sources || "—"}</div>
      <div class="card-actions">
        <span>${(product.sources || []).length} sources</span>
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
    return;
  }

  selected.forEach((product) => {
    const card = document.createElement("div");
    card.className = "compare-card";
    card.innerHTML = `
      <h3>${pickLang(product.name, state.lang) || product.id}</h3>
      <div class="meta">${product.vendor} · ${product.status}</div>
      <div class="meta">Categories: ${joinList(product.category)}</div>
      <div>${pickLang(product.capabilities, state.lang) || "—"}</div>
      <div class="meta">Pricing: ${pickLang(product.pricing, state.lang) || "—"}</div>
      <div class="meta">Limitations: ${joinList(product.limitations)}</div>
      <div class="meta">Use cases: ${joinList(product.use_cases)}</div>
    `;
    compareRow.appendChild(card);
  });
};

const updateStats = () => {
  productCount.textContent = state.products.length;
  const sources = state.products.reduce(
    (total, product) => total + (product.sources || []).length,
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
  applyFilters();
};

queryInput.addEventListener("input", applyFilters);
languageSelect.addEventListener("change", (event) => {
  state.lang = event.target.value;
  applyFilters();
});
statusSelect.addEventListener("change", applyFilters);
categorySelect.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);
scrollButton.addEventListener("click", () => {
  document.getElementById("results").scrollIntoView({ behavior: "smooth" });
});

init();
