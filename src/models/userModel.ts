import { User } from '../utils/user.interface';

const users = new Map<string, User>();

export async function getAllUserRecords(): Promise<User[]> {
  return Array.from(users.values());
}

export async function getUserRecordById(id: string): Promise<User | null> {
  return users.get(id) ?? null;
}

export async function createUserRecord(user: User): Promise<User> {
  users.set(user.id, user);
  return user;
}

export async function updateUserRecord(id: string, user: User): Promise<User> {
  users.set(id, user);
  return user;
}

export async function deleteUserRecord(id: string): Promise<void> {
  users.delete(id);
}
