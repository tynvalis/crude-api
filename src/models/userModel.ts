import { User } from "../utils/user.interface";


const users = new Map<string, User>();

export async function getAllUserRecords(): Promise<User[]> {
  return Array.from(users.values());
}

export async function getUserRecordById(id: string): Promise<User | null> {
  return users.get(id) ?? null;
}
