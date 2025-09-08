import { rarityStyles } from '../app.js';

export function createPetCard(options) {
  const {
    pet, mutations,
    isPool = false,
    isInventory = false,
    count = 1,
    initialMutationId = null,
    weight = null,
    age = null,
    onAdd, onRemove, onSetMutation, onDelete, onSetWeight, onSetAge
  } = options;

  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.petId = pet.id;
  card.classList.add('rarity', `rarity-${pet.rarity}`);

  const thumb = document.createElement('img');
  thumb.className = 'thumb';
  thumb.loading = 'lazy';
  thumb.alt = pet.name;
  thumb.src = pet.image;

  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = pet.name;

  // Weight and Age badges for inventory items
  let petInfo = null;
  if (isInventory) {
    petInfo = document.createElement('div');
    petInfo.className = 'pet-info';

    const weightBadge = document.createElement('div');
    weightBadge.className = 'info-badge weight-badge';
    
    const weightLabel = document.createElement('span');
    weightLabel.className = 'info-label';
    weightLabel.textContent = 'Weight:';
    
    const weightInput = document.createElement('input');
    weightInput.type = 'number';
    weightInput.step = '0.01';
    weightInput.min = '0';
    weightInput.placeholder = 'kg';
    weightInput.className = 'info-input weight-input';
    weightInput.value = weight !== null ? weight : '';
    
    weightInput.addEventListener('change', (e) => {
      const value = e.target.value.trim();
      onSetWeight?.(pet.id, value === '' ? null : value);
    });
    
    weightBadge.append(weightLabel, weightInput);

    const ageBadge = document.createElement('div');
    ageBadge.className = 'info-badge age-badge';
    
    const ageLabel = document.createElement('span');
    ageLabel.className = 'info-label';
    ageLabel.textContent = 'Age:';
    
    const ageInput = document.createElement('input');
    ageInput.type = 'number';
    ageInput.min = '0';
    ageInput.step = '1';
    ageInput.placeholder = 'years';
    ageInput.className = 'info-input age-input';
    ageInput.value = age !== null ? age : '';
    
    ageInput.addEventListener('change', (e) => {
      const value = e.target.value.trim();
      onSetAge?.(pet.id, value === '' ? null : value);
    });
    
    ageBadge.append(ageLabel, ageInput);
    petInfo.append(weightBadge, ageBadge);
  }

  const meta = document.createElement('div');
  meta.className = 'meta';

  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.innerHTML = `<span class="dot" style="background:${rarityColorFor(pet.rarity)}"></span> ${pet.rarity}`;
  meta.appendChild(badge);

  if (isPool) {
    const addBtn = document.createElement('button');
    addBtn.className = 'pill add-btn';
    addBtn.innerHTML = '<span class="plus">+</span> Add';
    addBtn.addEventListener('click', e => {
      e.stopPropagation();
      onAdd?.(pet.id, getCurrentMutationId(card));
    });
    meta.appendChild(addBtn);
  }

  if (isInventory) {
    const controls = document.createElement('div');
    controls.className = 'inventory-controls';

    const minusBtn = document.createElement('button');
    minusBtn.className = 'pill minus-btn';
    minusBtn.innerHTML = '<span class="minus">−</span>';
    minusBtn.addEventListener('click', e => {
      e.stopPropagation();
      onRemove?.(pet.id);
    });

    const countSpan = document.createElement('span');
    countSpan.className = 'count';
    countSpan.textContent = count;

    const plusBtn = document.createElement('button');
    plusBtn.className = 'pill plus-btn';
    plusBtn.innerHTML = '<span class="plus">+</span>';
    plusBtn.addEventListener('click', e => {
      e.stopPropagation();
      onAdd?.(pet.id, getCurrentMutationId(card));
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'pill delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', e => {
      e.stopPropagation();
      onDelete?.(pet.id);
    });

    controls.append(minusBtn, countSpan, plusBtn, deleteBtn);
    meta.appendChild(controls);
  }

  const mutationRow = createMutationDropdown({
    currentId: initialMutationId,
    mutations,
    onChange: mutationId => {
      onSetMutation?.(pet.id, mutationId);
      applyMutationStyle(card, thumb, mutationId, mutations, pet);
    }
  });

  const rowTop = document.createElement('div');
  rowTop.className = 'row';
  rowTop.appendChild(name);

  // Assemble card
  card.append(thumb, rowTop);
  if (petInfo) card.appendChild(petInfo); // Add weight/age info for inventory items
  card.append(meta, mutationRow);

  applyMutationStyle(card, thumb, initialMutationId, mutations, pet);

  return card;
}

function createMutationDropdown({ currentId = null, mutations = [], onChange }) {
  const wrap = document.createElement('div');
  wrap.className = 'mutation-selector';

  const label = document.createElement('label');
  label.className = 'mutation-label';
  label.textContent = 'Mutation:';

  const select = document.createElement('select');
  select.className = 'mutation-select';

  const noneOption = document.createElement('option');
  noneOption.value = '';
  noneOption.textContent = 'No Mutation';
  if (!currentId) noneOption.selected = true;
  select.appendChild(noneOption);

  mutations.forEach(m => {
    const option = document.createElement('option');
    option.value = m.id;
    option.textContent = m.name;
    if (m.id === currentId) option.selected = true;
    select.appendChild(option);
  });

  select.addEventListener('change', e => onChange?.(e.target.value || null));

  wrap.append(label, select);
  return wrap;
}

function getCurrentMutationId(card) {
  const select = card.querySelector('.mutation-select');
  return select ? select.value || null : null;
}

function rarityColorFor(rarity) {
  const map = {
    Common: 'var(--r-common)',
    Uncommon: 'var(--r-uncommon)',
    Rare: 'var(--r-rare)',
    Legendary: 'var(--r-legendary)',
    Mythical: 'var(--r-mythical)',
    Divine: 'var(--r-divine)',
    Prismatic: 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)'
  };
  return map[rarity] || 'var(--r-common)';
}

function applyMutationStyle(card, thumbEl, mutationId, allMutations, pet) {
  // Reset thumb & card
  thumbEl.style.background = '';
  thumbEl.style.borderImage = '';
  thumbEl.style.borderColor = '';
  thumbEl.style.borderWidth = '3px';
  thumbEl.style.borderStyle = 'solid';
  thumbEl.style.borderRadius = '10px'; // rounded

  card.style.background = '';
  card.style.borderColor = '';
  card.style.borderImage = '';
  card.style.borderWidth = '2px';
  card.style.borderStyle = 'solid';
  card.style.borderRadius = '12px'; // rounded
  card.style.outline = '';

  // Base rarity style
  const rarityStyle = rarityStyles[pet.rarity] || {};
  card.style.background = rarityStyle.background || '#1b2030';
  card.style.borderColor = rarityStyle.borderColor || '#2a3246';

  // Prismatic default (if no mutation)
  if (pet.rarity === 'Prismatic' && !mutationId) {
    thumbEl.style.borderImage = 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet) 1';
    thumbEl.style.borderColor = ''; 
    thumbEl.style.background = '#0d1220';

    card.style.background = 'linear-gradient(135deg, rgba(255,0,0,.15), rgba(255,127,0,.15), rgba(255,255,0,.15), rgba(0,255,0,.15), rgba(0,0,255,.15), rgba(75,0,130,.15), rgba(148,0,211,.15))';
    card.style.borderImage = '';
    card.style.borderColor = '#fff3';
    card.style.borderRadius = '12px';
  }

  // Apply mutation if overrideRarity
  const mutation = mutationId ? allMutations.find(m => m.id === mutationId) : null;
  if (mutation && mutation.overrideRarity) {
    // Card background
    if (mutation.style?.background) card.style.background = mutation.style.background;

    // Thumb background
    if (mutation.style?.thumbBackground) thumbEl.style.background = mutation.style.thumbBackground;

    // Thumb & Card borders
    if (mutation.style?.borderImage) {
      thumbEl.style.borderImage = mutation.style.borderImage;
      thumbEl.style.borderColor = '';
      thumbEl.style.borderRadius = '10px'; // rounded

      card.style.borderImage = mutation.style.borderImage;
      card.style.borderColor = '';
      card.style.borderRadius = '12px'; // rounded

      thumbEl.style.borderWidth = '3px';
      card.style.borderWidth = '2px';
      thumbEl.style.borderStyle = 'solid';
      card.style.borderStyle = 'solid';
    } else if (mutation.style?.borderColor) {
      thumbEl.style.borderImage = '';
      thumbEl.style.borderColor = mutation.style.borderColor;
      thumbEl.style.borderRadius = '10px'; // rounded

      card.style.borderImage = '';
      card.style.borderColor = mutation.style.borderColor;
      card.style.borderRadius = '12px'; // rounded

      thumbEl.style.borderWidth = '3px';
      card.style.borderWidth = '2px';
      thumbEl.style.borderStyle = 'solid';
      card.style.borderStyle = 'solid';
    }
  }
}
