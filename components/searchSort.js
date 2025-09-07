// Search & sort without re-rendering cards; just hide/show and reorder via DOM.
// Works for both pool and inventory grids.

import { rarityRank } from '../app.js';

export function attachSearchAndSort({ searchInput, sortSelect, viewSelect, poolGrid, inventoryGrid, poolEmpty, inventoryEmpty }) {
  const applyFilters = () => {
    const query = (searchInput.value || '').trim().toLowerCase();

    // View toggle
    const view = viewSelect.value;
    document.getElementById('pool-panel').style.display = (view === 'pool') ? '' : (view === 'both' ? '' : 'none');
    document.getElementById('inventory-panel').style.display = (view === 'inventory') ? '' : (view === 'both' ? '' : 'none');

    // Filter function for a grid
    const filterGrid = (grid, emptyEl) => {
      if (!grid) return;
      const cards = Array.from(grid.children);
      let visibleCount = 0;

      cards.forEach(card => {
        const name = (card.querySelector('.name')?.textContent || '').toLowerCase();
        const show = !query || name.includes(query);
        card.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });

      if (emptyEl) emptyEl.classList.toggle('hidden', visibleCount > 0);
    };

    filterGrid(poolGrid, poolEmpty);
    filterGrid(inventoryGrid, inventoryEmpty);

    sortGrid(poolGrid, sortSelect.value);
    sortGrid(inventoryGrid, sortSelect.value);
  };

  searchInput.addEventListener('input', applyFilters);
  sortSelect.addEventListener('change', applyFilters);
  viewSelect.addEventListener('change', applyFilters);

  // Initial run
  applyFilters();
}

function sortGrid(grid, sortKey) {
  if (!grid) return;
  const cards = Array.from(grid.children).filter(el => el.style.display !== 'none');

  const getMutationName = (card) => {
    const active = card.querySelector('.mutations .pill.active');
    if (!active) return '';
    const id = active.getAttribute('data-mutation-id');
    return id ? active.textContent.trim() : '';
  };

  const getRarity = (card) => {
    const badge = card.querySelector('.badge');
    return badge ? badge.textContent.trim().replace(/^[^\s]+\s/, '') : 'Common';
  };

  const getName = (card) => (card.querySelector('.name')?.textContent || '').toLowerCase();

  const [k, dir] = sortKey.split('-'); // e.g., name-asc
  const dirMul = dir === 'desc' ? -1 : 1;

  cards.sort((a, b) => {
    let va, vb;
    if (k === 'name') {
      va = getName(a); vb = getName(b);
      if (va < vb) return -1 * dirMul;
      if (va > vb) return 1 * dirMul;
      return 0;
    }
    if (k === 'rarity') {
      va = rarityRank[getRarity(a)] || 0;
      vb = rarityRank[getRarity(b)] || 0;
      return (va - vb) * dirMul;
    }
    if (k === 'mutation') {
      va = getMutationName(a).toLowerCase();
      vb = getMutationName(b).toLowerCase();
      if (va < vb) return -1 * dirMul;
      if (va > vb) return 1 * dirMul;
      return 0;
    }
    return 0;
  });

  // Re-append in new order
  const frag = document.createDocumentFragment();
  cards.forEach(c => frag.appendChild(c));
  grid.appendChild(frag);
}
