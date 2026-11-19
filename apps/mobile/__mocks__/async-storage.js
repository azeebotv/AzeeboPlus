const store = new Map();

const AsyncStorage = {
  getItem: jest.fn(async (key) => store.get(key) ?? null),
  setItem: jest.fn(async (key, val) => { store.set(key, String(val)); }),
  removeItem: jest.fn(async (key) => { store.delete(key); }),
  clear: jest.fn(async () => { store.clear(); }),
  getAllKeys: jest.fn(async () => Array.from(store.keys())),
  multiGet: jest.fn(async (keys) => keys.map((k) => [k, store.get(k) ?? null])),
  multiSet: jest.fn(async (pairs) => { pairs.forEach(([k, v]) => store.set(k, String(v))); }),
  multiRemove: jest.fn(async (keys) => { keys.forEach((k) => store.delete(k)); }),
};

module.exports = AsyncStorage;
module.exports.default = AsyncStorage;
