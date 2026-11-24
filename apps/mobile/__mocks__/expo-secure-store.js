const store = new Map();

module.exports = {
  getItemAsync: jest.fn(async (key) => store.get(key) ?? null),
  setItemAsync: jest.fn(async (key, val) => { store.set(key, String(val)); }),
  deleteItemAsync: jest.fn(async (key) => { store.delete(key); }),
  isAvailableAsync: jest.fn(async () => true),
};
