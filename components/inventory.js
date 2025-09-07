// Minimal inventory store with callbacks, using in-memory state.
// (No localStorage needed because state lives in the shareable URL.)

export class Inventory {
  constructor() {
    this.items = []; // [{ id, mutationId, pet }]
    this.onChange = null;
  }

  replaceAll(entries) {
    this.items = entries.slice();
    this._emit();
  }

  clear() {
    this.items = [];
    this._emit();
  }

  has(id) {
    return this.items.some(x => x.id === id);
  }

  getMutation(id) {
    return (this.items.find(x => x.id === id) || {}).mutationId || null;
  }

  add(id, mutationId, pet) {
    if (this.has(id)) return;
    const item = pet ? { id, mutationId, pet } : { id, mutationId, pet: lookupPet(id) };
    this.items.push(item);
    this._emit();
  }

  remove(id) {
    this.items = this.items.filter(x => x.id !== id);
    this._emit();
  }

  setMutation(id, mutationId) {
    const it = this.items.find(x => x.id === id);
    if (it) {
      it.mutationId = mutationId || null;
      this._emit();
    }
  }

  // Helper used in app.js when first loading from hash (pet injected there),
  // but for interactions from the pool we may need to resolve the pet again.
}

// In this minimal version, app.js injects pet objects. This is a placeholder in case of refactor.
function lookupPet(id) {
  // Intentionally left blank; we rely on app.js providing 'pet' objects.
  return { id, name: `Pet ${id}`, rarity: 'Common', image: '' };
}

Inventory.prototype._emit = function() {
  this.onChange && this.onChange();
};
