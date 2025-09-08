// Search & sort with unified filtering for both pool and inventory
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

    // View toggle - controls visibility
    const view = viewSelect.value;
    document.getElementById('pool-panel').style.display = 
      (view === 'inventory') ? 'none' : '';
    document.getElementById('inventory-panel').style.display = 
      (view === 'pool') ? 'none' : '';

    // Always filter both sections if they have data and are visible
    // Filter and sort pool (when visible)
    if (view !== 'inventory' && originalPets.length) {
      let filteredPets = originalPets.filter(pet => {
        return matchesSearch(pet, query);
      });
      
      filteredPets = sortPets(filteredPets, sortKey);
      onPoolFilter?.(filteredPets);
    }

    // Filter and sort inventory (when visible)
    if (view !== 'pool' && originalInventory) {
      let filteredItems = originalInventory.items.filter(item => {
        return matchesSearchInventory(item, query);
      });
      
      filteredItems = sortInventoryItems(filteredItems, sortKey);
      onInventoryFilter?.(filteredItems);
    }
  };

  // Enhanced search matching for pets
  const matchesSearch = (pet, query) => {
    if (!query) return true;
    
    const name = pet.name.toLowerCase();
    const rarity = pet.rarity.toLowerCase();
    
    return name.includes(query) || rarity.includes(query);
  };

  // Enhanced search matching for inventory items
  const matchesSearchInventory = (item, query) => {
    if (!query) return true;
    
    const name = item.pet.name.toLowerCase();
    const rarity = item.pet.rarity.toLowerCase();
    
    // Check mutation name if present
    let mutationName = '';
    if (item.mutationId && window.PETS_DATA) {
      const mutation = window.PETS_DATA.mutationMap.get(item.mutationId);
      if (mutation) {
        mutationName = mutation.name.toLowerCase();
      }
    }
    
    return name.includes(query) || 
           rarity.includes(query) || 
           (mutationName && mutationName.includes(query));
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

  // Export function to set initial inventory reference
  window.setInitialSearchInventoryRef = (inventory) => {
    originalInventory = inventory;
    // Apply filters immediately after setting inventory reference
    applyFilters();
  };

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
