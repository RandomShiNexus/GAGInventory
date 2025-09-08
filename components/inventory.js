// Enhanced inventory store with counts, weight, age, using in-memory state.
// (No localStorage needed because state lives in the shareable URL.)

export class Inventory {
  constructor() {
    this.items = []; // [{ id, mutationId, pet, count, weight, age }]
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
        count: 1,
        weight: null, // No default value
        age: null     // No default value
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

  setWeight(id, weight) {
    const item = this.items.find(x => x.id === id);
    if (item) {
      // Parse and validate weight (2 decimal places)
      const parsed = weight === '' || weight === null ? null : parseFloat(weight);
      item.weight = (parsed !== null && !isNaN(parsed)) ? Math.round(parsed * 100) / 100 : null;
      this._emit();
    }
  }

  setAge(id, age) {
    const item = this.items.find(x => x.id === id);
    if (item) {
      // Parse and validate age (whole years)
      const parsed = age === '' || age === null ? null : parseInt(age);
      item.age = (parsed !== null && !isNaN(parsed) && parsed >= 0) ? parsed : null;
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
