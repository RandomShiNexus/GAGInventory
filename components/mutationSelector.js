// Enhanced inventory store with individual pet instances, using in-memory state.
// (No localStorage needed because state lives in the shareable URL.)

export class Inventory {
  constructor() {
    this.instances = []; // [{ id, petId, mutationId, pet, weight, age }]
    this.nextId = 1;
    this.onChange = null;
  }

  replaceAll(entries) {
    this.instances = entries.map(entry => ({
      id: this.nextId++,
      petId: entry.petId,
      mutationId: entry.mutationId,
      pet: entry.pet,
      weight: entry.weight || null,
      age: entry.age || null
    }));
    this._emit();
  }

  clear()// Enhanced inventory store with counts, using in-memory state.
// (No localStorage needed because state lives in the shareable URL.)

export class Inventory {
  constructor() {
    this.items = []; // [{ id, mutationId, pet, count }]
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

  getCount(id) {
    const item = this.items.find(x => x.id === id);
    return item ? item.count : 0;
  }

  getMutation(id) {
    return (this.items.find(x => x.id === id) || {}).mutationId || null;
  }

  add(id, mutationId, pet) {
    const existing = this.items.find(x => x.id === id);
    if (existing) {
      existing.count += 1;
      // Update mutation if provided
      if (mutationId !== undefined) {
        existing.mutationId = mutationId;
      }
    } else {
      const item = { 
        id, 
        mutationId: mutationId || null, 
        pet: pet || this._lookupPet(id),
        count: 1 
      };
      this.items.push(item);
    }
    this._emit();
  }

  remove(id) {
    const existing = this.items.find(x => x.id === id);
    if (!existing) return;
    
    if (existing.count > 1) {
      existing.count -= 1;
    } else {
      this.items = this.items.filter(x => x.id !== id);
    }
    this._emit();
  }

  deleteAll(id) {
    this.items = this.items.filter(x => x.id !== id);
    this._emit();
  }

  setMutation(id, mutationId) {
    const item = this.items.find(x => x.id === id);
    if (item) {
      item.mutationId = mutationId || null;
      this._emit();
    }
  }

  _lookupPet(id) {
    // Try to get pet from global data if available
    if (window.PETS_DATA && window.PETS_DATA.petMap) {
      return window.PETS_DATA.petMap.get(id);
    }
    // Fallback
    return { id, name: `Pet ${id}`, rarity: 'Common', image: '' };
  }

  _emit() {
    if (this.onChange) {
      this.onChange();
    }
  }
}
