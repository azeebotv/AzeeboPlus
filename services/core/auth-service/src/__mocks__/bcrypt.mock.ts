export const hash = jest.fn().mockResolvedValue('hashed-password');
export const compare = jest.fn().mockResolvedValue(true);
export const genSalt = jest.fn().mockResolvedValue('$2b$10$');
export const genSaltSync = jest.fn().mockReturnValue('$2b$10$');
export const hashSync = jest.fn().mockReturnValue('hashed-password');
export const compareSync = jest.fn().mockReturnValue(true);
