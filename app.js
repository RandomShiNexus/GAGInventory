// Core app wiring: loads JSON, state management, URL encoding, and rendering orchestration.

import { createPetCard } from './components/petCard.js';
import { attachSearchAndSort } from './components/searchSort.js';
import { Inventory } from './components/inventory.js';

// Global rarity styles (contributors can tweak here)
export const rarityStyles = {
  Common:    { borderColor: '#bbb',    background: '#eee'      },
  Uncommon:  { borderColor: '#3cb371', background: '#d0f0c0'   },
  Rare:      { borderColor: '#4169e1', background: '#c6d8ff'   },
  Legendary: { borderColor: '#ff8c00', background: '#ffe4b5'   },
  Divine:    { borderColor: '#8a2be2', background: '#e6ccff'   }
};

// Rarity ordering for sorting (low -> high)
export const rarityRank = { Common: 1, Uncommon: 2, Rare: 3, Legendary: 4, Divine: 5 };

const DATA = {
  pets: [],
  mutations: [],
  mutationMap: new Map(),   // id -> mutation object
  mutationCodeToId: new Map() // short code -> id
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
    inventoryEmpty: UI.inventoryEmpty
  });

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
    // Re-render pool to remove selected state
    renderPool(DATA.pets, DATA.mutations, inventory);
  });

  // When inventory changes -> update hash & inventory panel
  inventory.onChange = () => {
    updateHashFromInventory(inventory.items);
    renderInventory(inventory);
    // Mirror selected states in pool
    mirrorSelectionsInPool(inventory);
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

  // Normalize mutation codes; allow short "code" in JSON to keep URLs tiny
  mutations.forEach((m, i) => {
    const id = m.id;
    const code = (m.code && String(m.code)) || i.toString(36); // base36 fallback
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
      selected: inventory.has(pet.id),
      initialMutationId: inventory.getMutation(pet.id),
      onToggle: (petId) => {
        // Toggle add/remove
        if (inventory.has(petId)) inventory.remove(petId);
        else inventory.add(petId, null);
      },
      onSetMutation: (petId, mutationId) => {
        inventory.setMutation(petId, mutationId);
      }
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

  if (!items.length) {
    UI.inventoryEmpty.classList.remove('hidden');
  } else {
    UI.inventoryEmpty.classList.add('hidden');
  }

  items.forEach(({ id, mutationId, pet }) => {
    const card = createPetCard({
      pet,
      mutations: DATA.mutations.map(m => DATA.mutationMap.get(m.id) || m),
      rarityStyles,
      selected: true,
      initialMutationId: mutationId,
      compact: false,
      onToggle: () => { inventory.remove(id); },
      onSetMutation: (petId, mId) => { inventory.setMutation(petId, mId); },
      isInventory: true
    });
    frag.appendChild(card);
  });

  UI.inventoryGrid.appendChild(frag);
}

/* Keep pool selection visuals in sync after inventory change without full re-render */
function mirrorSelectionsInPool(inventory) {
  UI.poolGrid.querySelectorAll('[data-pet-id]').forEach(card => {
    const petId = Number(card.getAttribute('data-pet-id'));
    const selected = inventory.has(petId);
    card.classList.toggle('selected', selected);

    const mutationId = inventory.getMutation(petId);
    card.setAttribute('data-mutation-id', mutationId || '');
    // Update visible mutation pill states
    card.querySelectorAll('.pill').forEach(p => {
      const mid = p.getAttribute('data-mutation-id');
      p.classList.toggle('active', mid === mutationId);
    });
  });
}

/* ---------- URL Encoding / Decoding ---------- */
/*
 URL hash format:
   #inv=<entries>
   entries = comma-separated tokens
   token = id[:code]
   id = numeric pet id
   code = short mutation code (from mutations.json "code" or auto-generated base36 index)

 Example:
   #inv=1:r,2,5:g

 Rules:
   - Order preserved (for nicer UX when sharing)
   - Unknown mutation codes are ignored gracefully
*/
function currentShareUrl(items) {
  const entries = items.map(({ id, mutationId }) => {
    if (!mutationId) return String(id);
    const m = DATA.mutationMap.get(mutationId);
    if (!m) return String(id);
    return `${id}:${m.code}`;
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
    const [idStr, code] = tok.split(':');
    const id = Number(idStr);
    if (!Number.isFinite(id)) return;

    const pet = DATA.pets.find(p => p.id === id);
    if (!pet) return;

    let mutationId = null;
    if (code) {
      const mid = DATA.mutationCodeToId.get(code);
      if (mid) mutationId = mid;
    }
    out.push({ id, mutationId, pet });
  });
  return out;
}

function updateHashFromInventory(items) {
  const link = currentShareUrl(items);
  // Replace without scrolling; only update hash portion
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
}
