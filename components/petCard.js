// Renders a single pet card and wires up interactions.
import { rarityRank } from '../app.js';

export function createPetCard(options) {
  const {
    pet, mutations, rarityStyles,
    isPool = false,
    isInventory = false,
    count = 1,
    initialMutationId = null,
    onAdd, onRemove, onSetMutation, onDelete
  } = options;

  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.petId = pet.id;
  card.setAttribute('data-pet-id', pet.id);

  // Base rarity styling (will be overridden by mutation style when applicable)
  card.classList.add('rarity', `rarity-${pet.rarity}`);

  const thumb = document.createElement('img');
  thumb.className = 'thumb';
  thumb.loading = 'lazy';
  thumb.alt = `${pet.name}`;
  thumb.src = pet.image;

  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = pet.name;

  const meta = document.createElement('div');
  meta.className = 'meta';

  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.innerHTML = `<span class="dot" style="background:${
    rarityColorFor(pet.rarity)
  }"></span> ${pet.rarity}`;

  meta.appendChild(badge);

  // Different controls for pool vs inventory
  if (isPool) {
    const addBtn = document.createElement('button');
    addBtn.className = 'pill add-btn';
    addBtn.innerHTML = '<span class="plus">+</span> Add';
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const mutationId = getCurrentMutationId(card);
      onAdd?.(pet.id, mutationId);
    });
    meta.appendChild(addBtn);
  }

  if (isInventory) {
    const controls = document.createElement('div');
    controls.className = 'inventory-controls';
    
    const minusBtn = document.createElement('button');
    minusBtn.className = 'pill minus-btn';
    minusBtn.innerHTML = '<span class="minus">−</span>';
    minusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onRemove?.(pet.id);
    });
    
    const countSpan = document.createElement('span');
    countSpan.className = 'count';
    countSpan.textContent = count;
    
    const plusBtn = document.createElement('button');
    plusBtn.className = 'pill plus-btn';
    plusBtn.innerHTML = '<span class="plus">+</span>';
    plusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const mutationId = getCurrentMutationId(card);
      onAdd?.(pet.id, mutationId);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'pill delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onDelete?.(pet.id);
    });
    
    controls.appendChild(minusBtn);
    controls.appendChild(countSpan);
    controls.appendChild(plusBtn);
    controls.appendChild(deleteBtn);
    meta.appendChild(controls);
  }

  // Mutation dropdown
  const mutationRow = createMutationDropdown({
    currentId: initialMutationId,
    mutations,
    onChange: (mutationId) => {
      onSetMutation?.(pet.id, mutationId);
      applyMutationStyle(card, thumb, mutationId, mutations, pet);
    }
  });

  const rowTop = document.createElement('div');
  rowTop.className = 'row';
  rowTop.appendChild(name);

  card.appendChild(thumb);
  card.appendChild(rowTop);
  card.appendChild(meta);
  card.appendChild(mutationRow);

  // Apply initial mutation styling if present
  applyMutationStyle(card, thumb, initialMutationId, mutations, pet);

  return card;
}

function createMutationDropdown({ currentId = null, mutations = [], onChange }) {
  const wrap = document.createElement('div');
  wrap.className = 'mutation-selector';
  
  const label = document.createElement('label');
  label.textContent = 'Mutation:';
  label.className = 'mutation-label';
  
  const select = document.createElement('select');
  select.className = 'mutation-select';
  
  // Add "No Mutation" option
  const noneOption = document.createElement('option');
  noneOption.value = '';
  noneOption.textContent = 'No Mutation';
  if (!currentId) noneOption.selected = true;
  select.appendChild(noneOption);
  
  // Add mutation options
  mutations.forEach(m => {
    const option = document.createElement('option');
    option.value = m.id;
    option.textContent = m.name;
    if (m.id === currentId) option.selected = true;
    select.appendChild(option);
  });
  
  select.addEventListener('change', (e) => {
    const mutationId = e.target.value || null;
    onChange?.(mutationId);
  });
  
  wrap.appendChild(label);
  wrap.appendChild(select);
  
  return wrap;
}

function getCurrentMutationId(card) {
  const select = card.querySelector('.mutation-select');
  return select ? (select.value || null) : null;
}

function rarityColorFor(rarity) {
  const map = {
    Common: 'var(--r-common)',
    Uncommon: 'var(--r-uncommon)',
    Rare: 'var(--r-rare)',
    Legendary: 'var(--r-legendary)',
    Divine: 'var(--r-divine)'
  };
  return map[rarity] || 'var(--r-common)';
}

/* Apply mutation style; if mutation.overrideRarity === true, it visually overrides rarity styling */
function applyMutationStyle(card, thumbEl, mutationId, allMutations, pet) {
  // Reset
  thumbEl.style.borderImage = '';
  thumbEl.style.backgroundImage = '';
  thumbEl.style.background = '';

  // Reset card border to rarity baseline
  card.style.borderColor = '';
  card.style.background = '';

  if (!mutationId) {
    // Restore rarity styling
    card.classList.add('rarity', `rarity-${pet.rarity}`);
    return;
  }

  const m = allMutations.find(x => x.id === mutationId);
  if (!m) {
    card.classList.add('rarity', `rarity-${pet.rarity}`);
    return;
  }

  const style = m.style || {};

  // When mutation overrides rarity, we don't show rarity border color
  if (m.overrideRarity) {
    card.classList.remove('rarity', `rarity-${pet.rarity}`);
  } else {
    card.classList.add('rarity', `rarity-${pet.rarity}`);
  }

  // Apply style keys safely
  if (style.borderColor) {
    card.style.borderColor = style.borderColor;
  }
  if (style.background) {
    card.style.background = style.background;
  }
  if (style.borderImage) {
    thumbEl.style.borderImage = style.borderImage;
  }
  if (style.thumbBackground) {
    thumbEl.style.background = style.thumbBackground;
  }
}
