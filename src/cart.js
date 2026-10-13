const KEY = 'lb-basket-v1';
const listeners = new Set();

let items = load();

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((fn) => fn(items));
}

export const cart = {
  get items() {
    return items;
  },
  get count() {
    return items.reduce((n, i) => n + i.qty, 0);
  },
  get subtotal() {
    return items.reduce((s, i) => s + i.qty * i.price, 0);
  },
  // Workshops are collected in person; everything else needs delivery or collection details.
  get needsDelivery() {
    return items.some((i) => i.kind !== 'workshop');
  },
  add(item) {
    const key = `${item.id}:${item.option}`;
    const existing = items.find((i) => i.key === key);
    if (existing) {
      existing.qty = Math.min(existing.max ?? 20, existing.qty + 1);
    } else {
      items.push({ ...item, key, qty: 1 });
    }
    save();
  },
  setQty(key, qty) {
    const it = items.find((i) => i.key === key);
    if (!it) return;
    const max = it.max ?? 20;
    it.qty = Math.max(0, Math.min(max, qty));
    if (it.qty === 0) items = items.filter((i) => i.key !== key);
    save();
  },
  remove(key) {
    items = items.filter((i) => i.key !== key);
    save();
  },
  clear() {
    items = [];
    save();
  },
  subscribe(fn) {
    listeners.add(fn);
    fn(items);
  },
};
