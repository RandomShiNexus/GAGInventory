// Renders a single pet card and wires up interactions.
import { rarityRank } from '../app.js';
import { buildMutationControls } from './mutationSelector.js';

export function createPetCard(options) {
  const {
    pet, mutations, rarityStyles,
    selected = false,
    initialMutationId = null,
    onToggle, onSetMutation,
    compact = false,
    isInventory = false
  } = options;

  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.petId = pet.id;
  card.setAttribute('data-pet-id', pet.id);
  if (selected) card.classList.add('selected');

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

  const addRemove = document.createElement('button');
  addRemove.className = 'pill';
  addRemove.textContent = selected ? 'Remove' : 'Add';
  if (selected) addRemove.classList.add('remove');

  addRemove.addEventListener('click', (e) => {
    e.stopPropagation();
    onToggle?.(pet.id);
  });

  meta.appendChild(badge);
  meta.appendChild(addRemove);

  // Mutation controls
  const mutationsRow = buildMutationControls({
    currentId: initialMutationId,
    mutations,
    onChange: (mutationId) => onSetMutation?.(pet.id, mutationId)
  });

  const rowTop = document.createElement('div');
  rowTop.className = 'row';
  rowTop.appendChild(name);

  card.appendChild(thumb);
  card.appendChild(rowTop);
  card.appendChild(meta);
  card.appendChild(mutationsRow);

  // Clicking card toggles selection (but not when clicking a mutation pill)
  card.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('.mutations')) return;
    onToggle?.(pet.id);
  });

  // Apply initial mutation styling if present
  applyMutationStyle(card, thumb, initialMutationId, mutations, pet);

  // Observe mutation changes to re-style thumb/border without re-render
  card.addEventListener('mutationchange', (e) => {
    const mutationId = e.detail?.mutationId || null;
    applyMutationStyle(card, thumb, mutationId, mutations, pet);
  });

  return card;
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

  if (!mutationId) return;

  const m = allMutations.find(x => x.id === mutationId);
  if (!m) return;

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
