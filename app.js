// Core app wiring: loads JSON, state management, URL encoding, and rendering orchestration.

import { createPetCard } from './components/petCard.js';
import { attachSearchAndSort } from './components/searchSort.js';
import { Inventory } from './components/inventory.js';

// Global rarity styles (contributors can tweak here)
export const rarityStyles = {
  Common:    { borderColor: '#808080', background: '#404040' },
  Uncommon:  { borderColor: '#008000', background: '#104010' },
  Rare:      { borderColor: '#0000ff', background: '#101040' },
  Legendary: { borderColor: '#ffd700', background: '#403200' },
  Mythical:  { borderColor: '#800080', background: '#301030' },
  Divine:    { borderColor: '#ff8c00', background: '#402600' },
  Prismatic: { borderColor: 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)', background: '#400000' }
};


// Rarity ordering for sorting (low -> high)
export const rarityRank = { Common: 1, Uncommon: 2, Rare: 3, Legendary: 4, Mythical: 5, Divine: 6, Prismatic: 7 };

const DATA = {
  pets: [],
  mutations: [],
  mutationMap: new Map(),   // id -> mutation object
  mutationCodeToId: new Map(), // short code -> id
  petMap: new Map()         // id -> pet object for quick lookup
};

const UI = {
  poolGrid: null,
  poolEmpty: null,
  inventoryGrid: null,
  inventoryEmpty: null,
  searchInput: null,
  sortSelect: null,
  viewSelect: null,
  shareBtn: null,
  resetLink: null
};

export async function initApp() {
  bindUI();

  await loadData();

  const inventory = new Inventory();

  // If URL has inventory hash, hydrate it
  const parsed = parseHashInventory();
  if (parsed.length) {
    inventory.replaceAll(parsed);
  }

  renderPool(DATA.pets, DATA.mutations, inventory);
  renderInventory(inventory);

  attachSearchAndSort({
    searchInput: UI.searchInput,
    sortSelect: UI.sortSelect,
    viewSelect: UI.viewSelect,
    poolGrid: UI.poolGrid,
    inventoryGrid: UI.inventoryGrid,
    poolEmpty: UI.poolEmpty,
    inventoryEmpty: UI.inventoryEmpty,
    onPoolFilter: (pets) => renderPool(pets, DATA.mutations, inventory),
    onInventoryFilter: (items) => renderInventoryFiltered(inventory, items)
  });

  // Set initial inventory reference for search system
  if (window.setInitialSearchInventoryRef) {
    window.setInitialSearchInventoryRef(inventory);
  }

  // Share link (copies to clipboard)
  UI.shareBtn.addEventListener('click', async () => {
    const link = currentShareUrl(inventory.items);
    try {
      await navigator.clipboard.writeText(link);
      UI.shareBtn.textContent = 'Copied!';
      setTimeout(() => UI.shareBtn.textContent = 'Share', 1200);
    } catch {
      prompt('Copy this link:', link);
    }
  });

  // Reset
  UI.resetLink.addEventListener('click', (e) => {
    e.preventDefault();
    inventory.clear();
    updateHashFromInventory([]);
    renderInventory(inventory);
    renderPool(DATA.pets, DATA.mutations, inventory);
  });

  // When inventory changes -> update hash & inventory panel
  inventory.onChange = () => {
    updateHashFromInventory(inventory.items);
    renderInventory(inventory);
    // Update search system with new inventory data
    if (window.updateSearchInventoryRef) {
      window.updateSearchInventoryRef(inventory);
    }
  };
}

/* ---------- Data Loading ---------- */
async function loadData() {
  const [pets, mutations] = await Promise.all([
    fetch('./data/pets.json').then(r => r.json()),
    fetch('./data/mutations.json').then(r => r.json())
  ]);

  DATA.pets = pets;
  DATA.mutations = mutations;

  pets.forEach(pet => DATA.petMap.set(pet.id, pet));

  mutations.forEach((m, i) => {
    const id = m.id;
    const code = (m.code && String(m.code)) || i.toString(36);
    DATA.mutationMap.set(id, { ...m, code });
    DATA.mutationCodeToId.set(code, id);
  });
}

/* ---------- Rendering ---------- */
function renderPool(pets, mutations, inventory) {
  UI.poolGrid.innerHTML = '';
  const frag = document.createDocumentFragment();

  pets.forEach(pet => {
    const card = createPetCard({
      pet,
      mutations: DATA.mutations.map(m => DATA.mutationMap.get(m.id) || m),
      rarityStyles,
      isPool: true,
      onAdd: (petId, mutationId = null) => {
        const pet = DATA.petMap.get(petId);
        inventory.add(petId, mutationId, pet);
      },
      onSetMutation: (petId, mutationId) => {}
    });
    frag.appendChild(card);
  });

  UI.poolGrid.appendChild(frag);
  UI.poolEmpty.classList.toggle('hidden', !!pets.length);
}

function renderInventory(inventory) {
  UI.inventoryGrid.innerHTML = '';
  const frag = document.createDocumentFragment();
  const items = inventory.items;

  if (!items.length) UI.inventoryEmpty.classList.remove('hidden');
  else UI.inventoryEmpty.classList.add('hidden');

  items.forEach(({ id, mutationId, pet, count }) => {
    const card = createPetCard({
      pet,
      mutations: DATA.mutations.map(m => DATA.mutationMap.get(m.id) || m),
      rarityStyles,
      isInventory: true,
      count,
      initialMutationId: mutationId,
      onRemove: (petId) => inventory.remove(petId),
      onAdd: (petId, mutationId) => {
        const pet = DATA.petMap.get(petId);
        inventory.add(petId, mutationId, pet);
      },
      onSetMutation: (petId, mId) => inventory.setMutation(petId, mId),
      onDelete: (petId) => inventory.deleteAll(petId)
    });
    frag.appendChild(card);
  });

  UI.inventoryGrid.appendChild(frag);
}

function renderInventoryFiltered(inventory, filteredItems) {
  UI.inventoryGrid.innerHTML = '';
  const frag = document.createDocumentFragment();

  if (!filteredItems.length) UI.inventoryEmpty.classList.remove('hidden');
  else UI.inventoryEmpty.classList.add('hidden');

  filteredItems.forEach(({ id, mutationId, pet, count }) => {
    const card = createPetCard({
      pet,
      mutations: DATA.mutations.map(m => DATA.mutationMap.get(m.id) || m),
      rarityStyles,
      isInventory: true,
      count,
      initialMutationId: mutationId,
      onRemove: (petId) => inventory.remove(petId),
      onAdd: (petId, mutationId) => {
        const pet = DATA.petMap.get(petId);
        inventory.add(petId, mutationId, pet);
      },
      onSetMutation: (petId, mId) => inventory.setMutation(petId, mId),
      onDelete: (petId) => inventory.deleteAll(petId)
    });
    frag.appendChild(card);
  });

  UI.inventoryGrid.appendChild(frag);
}

/* ---------- URL Encoding / Decoding ---------- */
function currentShareUrl(items) {
  const entries = items.map(({ id, mutationId, count }) => {
    let token = String(id);
    const m = mutationId ? DATA.mutationMap.get(mutationId) : null;
    const code = m ? m.code : '';

    if (code || count > 1) token += ':' + (code || '');
    if (count > 1) token += ':' + count;

    return token;
  }).join(',');
  const url = new URL(location.href);
  url.hash = `inv=${entries}`;
  return url.toString();
}

function parseHashInventory() {
  const hash = (location.hash || '').replace(/^#/, '');
  const params = new URLSearchParams(hash);
  const raw = params.get('inv');
  if (!raw) return [];
  const tokens = raw.split(',').map(s => s.trim()).filter(Boolean);

  const out = [];
  tokens.forEach(tok => {
    const parts = tok.split(':');
    const idStr = parts[0];
    const code = parts[1] || null;
    const countStr = parts[2] || '1';
    const weightStr = parts[3] || null;
    const ageStr = parts[4] || null;

    const id = Number(idStr);
    const count = Number(countStr) || 1;
    if (!Number.isFinite(id)) return;

    const pet = DATA.petMap.get(id);
    if (!pet) return;

    let mutationId = null;
    if (code) {
      const mid = DATA.mutationCodeToId.get(code);
      if (mid) mutationId = mid;
    }

    // Parse weight and age
    const weight = (weightStr && weightStr !== '') ? parseFloat(weightStr) : null;
    const age = (ageStr && ageStr !== '') ? parseInt(ageStr) : null;

    out.push({ 
      id, 
      mutationId, 
      pet, 
      count,
      weight: (weight !== null && !isNaN(weight)) ? Math.round(weight * 100) / 100 : null,
      age: (age !== null && !isNaN(age) && age >= 0) ? age : null
    });
  });
  return out;
}

function updateHashFromInventory(items) {
  const link = currentShareUrl(items);
  const u = new URL(link);
  location.replace(`#${u.hash.slice(1)}`);
}

/* ---------- UI helpers ---------- */
function bindUI() {
  UI.poolGrid = document.getElementById('pool-grid');
  UI.poolEmpty = document.getElementById('pool-empty');
  UI.inventoryGrid = document.getElementById('inventory-grid');
  UI.inventoryEmpty = document.getElementById('inventory-empty');

  UI.searchInput = document.getElementById('search-input');
  UI.sortSelect = document.getElementById('sort-select');
  UI.viewSelect = document.getElementById('view-select');

  UI.shareBtn = document.getElementById('btn-share');
  UI.resetLink = document.getElementById('btn-reset');

  window.PETS_DATA = DATA;
}
