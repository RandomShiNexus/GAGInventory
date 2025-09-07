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
  Divine:    { borderColor: '#8a2be2', background: '#e6ccff'   },
  Prismatic:    { borderColor: '#8a2be2', background: '#e6ccff'   },
};

// Rarity ordering for sorting (low -> high)
export const rarityRank = { Common: 1, Uncommon: 2, Rare: 3, Legendary: 4, Divine: 5 };

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

  // Build pet lookup map
  pets.forEach(pet => {
    DATA.petMap.set(pet.id, pet);
  });

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
      isPool: true,
      onAdd: (petId, mutationId = null) => {
        const pet = DATA.petMap.get(petId);
        inventory.add(petId, mutationId, pet);
      },
      onSetMutation: (petId, mutationId) => {
        // For pool cards, we don't store mutations unless they're in inventory
        // This is just for preview purposes
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

  items.forEach(({ id, mutationId, pet, count }) => {
    const card = createPetCard({
      pet,
      mutations: DATA.mutations.map(m => DATA.mutationMap.get(m.id) || m),
      rarityStyles,
      isInventory: true,
      count: count,
      initialMutationId: mutationId,
      onRemove: (petId) => { 
        inventory.remove(petId); 
      },
      onAdd: (petId, mutationId) => {
        const pet = DATA.petMap.get(petId);
        inventory.add(petId, mutationId, pet);
      },
      onSetMutation: (petId, mId) => { 
        inventory.setMutation(petId, mId); 
      },
      onDelete: (petId) => {
        inventory.deleteAll(petId);
      }
    });
    frag.appendChild(card);
  });

  UI.inventoryGrid.appendChild(frag);
}

function renderInventoryFiltered(inventory, filteredItems) {
  UI.inventoryGrid.innerHTML = '';
  const frag = document.createDocumentFragment();

  if (!filteredItems.length) {
    UI.inventoryEmpty.classList.remove('hidden');
  } else {
    UI.inventoryEmpty.classList.add('hidden');
  }

  filteredItems.forEach(({ id, mutationId, pet, count }) => {
    const card = createPetCard({
      pet,
      mutations: DATA.mutations.map(m => DATA.mutationMap.get(m.id) || m),
      rarityStyles,
      isInventory: true,
      count: count,
      initialMutationId: mutationId,
      onRemove: (petId) => { 
        inventory.remove(petId); 
      },
      onAdd: (petId, mutationId) => {
        const pet = DATA.petMap.get(petId);
        inventory.add(petId, mutationId, pet);
      },
      onSetMutation: (petId, mId) => { 
        inventory.setMutation(petId, mId); 
      },
      onDelete: (petId) => {
        inventory.deleteAll(petId);
      }
    });
    frag.appendChild(card);
  });

  UI.inventoryGrid.appendChild(frag);
}

/* ---------- URL Encoding / Decoding ---------- */
/*
 URL hash format:
   #inv=<entries>
   entries = comma-separated tokens
   token = id[:code][:count]
   id = numeric pet id
   code = short mutation code (from mutations.json "code" or auto-generated base36 index)
   count = number of this pet (defaults to 1)

 Example:
   #inv=1:r:3,2:g:1,5::2

 Rules:
   - Order preserved (for nicer UX when sharing)
   - Unknown mutation codes are ignored gracefully
*/
function currentShareUrl(items) {
  const entries = items.map(({ id, mutationId, count }) => {
    let token = String(id);
    const m = mutationId ? DATA.mutationMap.get(mutationId) : null;
    const code = m ? m.code : '';
    
    if (code || count > 1) {
      token += ':' + (code || '');
    }
    if (count > 1) {
      token += ':' + count;
    }
    
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
    out.push({ id, mutationId, pet, count });
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

  // Export DATA for use in other modules
  window.PETS_DATA = DATA;
}
