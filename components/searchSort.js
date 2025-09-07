// Search & sort with separate filtering for pool and inventory
// Calls render functions to update content when filtering

import { rarityRank } from '../app.js';

export function attachSearchAndSort({ 
  searchInput, sortSelect, viewSelect, 
  poolGrid, inventoryGrid, poolEmpty, inventoryEmpty,
  onPoolFilter, onInventoryFilter 
}) {
  let originalPets = [];
  let originalInventory = null;
  
  // Store references to original data
  const storeOriginalData = () => {
    if (window.PETS_DATA && window.PETS_DATA.pets) {
      originalPets = window.PETS_DATA.pets;
    }
  };

  const applyFilters = () => {
    const query = (searchInput.value || '').trim().toLowerCase();
    const sortKey = sortSelect.value;

    // View toggle
    const view = viewSelect.value;
    document.getElementById('pool-panel').style.display = 
      (view === 'inventory') ? 'none' : '';
    document.getElementById('inventory-panel').style.display = 
      (view === 'pool') ? 'none' : '';

    // Filter and sort pool
    if (view !== 'inventory' && originalPets.length) {
      let filteredPets = originalPets.filter(pet => {
        const name = pet.name.toLowerCase();
        return !query || name.includes(query);
      });
      
      filteredPets = sortPets(filteredPets, sortKey);
      onPoolFilter?.(filteredPets);
    }

    // Filter and sort inventory
    if (view !== 'pool' && originalInventory) {
      let filteredItems = originalInventory.items.filter(item => {
        const name = item.pet.name.toLowerCase();
        return !query || name.includes(query);
      });
      
      filteredItems = sortInventoryItems(filteredItems, sortKey);
      onInventoryFilter?.(filteredItems);
    }
  };

  // Set up event listeners
  searchInput.addEventListener('input', applyFilters);
  sortSelect.addEventListener('change', applyFilters);
  viewSelect.addEventListener('change', applyFilters);

  // Store original data on first run
  storeOriginalData();

  // Update inventory reference when it changes
  const updateInventoryRef = (inventory) => {
    originalInventory = inventory;
    applyFilters();
  };

  // Export function to update inventory reference
  window.updateSearchInventoryRef = updateInventoryRef;

  // Initial run
  applyFilters();
}

function sortPets(pets, sortKey) {
  const [k, dir] = sortKey.split('-');
  const dirMul = dir === 'desc' ? -1 : 1;

  return pets.sort((a, b) => {
    if (k === 'name') {
      const va = a.name.toLowerCase();
      const vb = b.name.toLowerCase();
      return va < vb ? -1 * dirMul : va > vb ? 1 * dirMul : 0;
    }
    if (k === 'rarity') {
      const va = rarityRank[a.rarity] || 0;
      const vb = rarityRank[b.rarity] || 0;
      return (va - vb) * dirMul;
    }
    return 0;
  });
}

function sortInventoryItems(items, sortKey) {
  const [k, dir] = sortKey.split('-');
  const dirMul = dir === 'desc' ? -1 : 1;

  return items.sort((a, b) => {
    if (k === 'name') {
      const va = a.pet.name.toLowerCase();
      const vb = b.pet.name.toLowerCase();
      return va < vb ? -1 * dirMul : va > vb ? 1 * dirMul : 0;
    }
    if (k === 'rarity') {
      const va = rarityRank[a.pet.rarity] || 0;
      const vb = rarityRank[b.pet.rarity] || 0;
      return (va - vb) * dirMul;
    }
    if (k === 'mutation') {
      const va = getMutationName(a.mutationId).toLowerCase();
      const vb = getMutationName(b.mutationId).toLowerCase();
      return va < vb ? -1 * dirMul : va > vb ? 1 * dirMul : 0;
    }
    return 0;
  });
}

function getMutationName(mutationId) {
  if (!mutationId || !window.PETS_DATA) return '';
  const mutation = window.PETS_DATA.mutationMap.get(mutationId);
  return mutation ? mutation.name : '';
}
