import { rarityStyles } from '../app.js';

// Renders a single pet card
export function createPetCard(options) {
  const {
    pet, mutations, rarityStyles,
    isPool = false, isInventory = false,
    count = 1, initialMutationId = null,
    onAdd, onRemove, onSetMutation, onDelete
  } = options;

  const card = document.createElement('article');
  card.className = 'card';

  // Remove old rarity classes, then add new
  card.classList.remove('rarity-Common','rarity-Uncommon','rarity-Rare','rarity-Legendary','rarity-Mythical','rarity-Divine','rarity-Prismatic');
  card.classList.add('rarity', `rarity-${pet.rarity}`);

  const thumb = document.createElement('img');
  thumb.className = 'thumb';
  thumb.loading = 'lazy';
  thumb.alt = pet.name;
  thumb.src = pet.image;

  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = pet.name;

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
    minusBtn.addEventListener('click', e => { e.stopPropagation(); onRemove?.(pet.id); });

    const countSpan = document.createElement('span');
    countSpan.className = 'count';
    countSpan.textContent = count;

    const plusBtn = document.createElement('button');
    plusBtn.className = 'pill plus-btn';
    plusBtn.innerHTML = '<span class="plus">+</span>';
    plusBtn.addEventListener('click', e => {
      e.stopPropagation();
      const mutationId = getCurrentMutationId(card);
      onAdd?.(pet.id, mutationId);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'pill delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', e => { e.stopPropagation(); onDelete?.(pet.id); });

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

  card.append(thumb, rowTop, meta, mutationRow);

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
  return select ? (select.value || null) : null;
}

function rarityColorFor(rarity) {
  const map = {
    Common: 'var(--r-common)',
    Uncommon: 'var(--r-uncommon)',
    Rare: 'var(--r-rare)',
    Legendary: 'var(--r-legendary)',
    Mythical: 'var(--r-mythical)',
    Divine: 'var(--r-divine)',
    Prismatic: 'var(--r-prismatic)'
  };
  return map[rarity] || 'var(--r-common)';
}

function applyMutationStyle(card, thumbEl, mutationId, allMutations, pet) {
  // Clear inline styles
  card.style.borderColor = '';
  card.style.background = '';
  thumbEl.style.borderImage = '';
  thumbEl.style.background = '';

  // Remove all previous rarity classes
  card.classList.remove('rarity-Common','rarity-Uncommon','rarity-Rare','rarity-Legendary','rarity-Mythical','rarity-Divine','rarity-Prismatic');

  const m = allMutations.find(x => x.id === mutationId);

  if (!mutationId || !m) {
    // Apply normal rarity
    card.classList.add('rarity', `rarity-${pet.rarity}`);
    const style = rarityStyles[pet.rarity] || {};
    card.style.borderColor = style.borderColor || 'var(--card-border)';
    card.style.background = style.background || 'var(--card-bg)';
    return;
  }

  const style = m.style || {};

  if (style.background) card.style.background = style.background;

  if (m.overrideRarity) {
    if (style.borderColor) card.style.borderColor = style.borderColor;
    else card.style.borderColor = '#888';
  } else {
    card.classList.add('rarity', `rarity-${pet.rarity}`);
    if (style.borderColor) card.style.borderColor = style.borderColor;
  }

  if (style.borderImage) thumbEl.style.borderImage = style.borderImage;
  if (style.thumbBackground) thumbEl.style.background = style.thumbBackground;
}
