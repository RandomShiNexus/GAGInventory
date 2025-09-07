// Builds the mutation selector row with toggle pills.
// Emits a custom "mutationchange" event on the card when a mutation is changed.

export function buildMutationControls({ currentId = null, mutations = [], onChange }) {
  const wrap = document.createElement('div');
  wrap.className = 'mutations';

  // "None" pill
  const none = document.createElement('button');
  none.className = 'pill' + (currentId ? '' : ' active');
  none.textContent = 'No Mutation';
  none.setAttribute('data-mutation-id', '');
  none.addEventListener('click', (e) => {
    e.stopPropagation();
    selectMutation(wrap, '');
    onChange?.(null);
    dispatchMutationChange(wrap, null);
  });
  wrap.appendChild(none);

  mutations.forEach(m => {
    const pill = document.createElement('button');
    pill.className = 'pill';
    pill.setAttribute('title', m.name);
    pill.setAttribute('data-mutation-id', m.id);
    pill.innerHTML = `<span class="icon" style="${inlineIconStyle(m)}"></span>${m.name}`;
    if (m.id === currentId) pill.classList.add('active');

    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = pill.classList.contains('active');
      // Toggle behavior: clicking active mutation -> clears it
      if (isActive) {
        selectMutation(wrap, '');
        onChange?.(null);
        dispatchMutationChange(wrap, null);
      } else {
        selectMutation(wrap, m.id);
        onChange?.(m.id);
        dispatchMutationChange(wrap, m.id);
      }
    });
    wrap.appendChild(pill);
  });

  return wrap;
}

function selectMutation(container, id) {
  container.querySelectorAll('.pill').forEach(el => {
    const mid = el.getAttribute('data-mutation-id');
    el.classList.toggle('active', mid === id);
  });
}

function inlineIconStyle(mutation) {
  const s = mutation.style || {};
  const bg = s.background || s.thumbBackground || '#333';
  const border = s.borderColor ? `border-color:${s.borderColor};` : '';
  return `background:${bg};${border}`;
}

function dispatchMutationChange(container, mutationId) {
  const card = container.closest('.card');
  if (!card) return;
  card.dispatchEvent(new CustomEvent('mutationchange', { detail: { mutationId } }));
}
