import { genSaltSync, hashSync, compareSync } from 'bcrypt';
export const genHash = (string: string) => {
  const salt = genSaltSync(10);
  return hashSync(string, salt);
};

export const compareHash = (string: string, hashedString: string) => {
  return compareSync(string, hashedString || '');
};
