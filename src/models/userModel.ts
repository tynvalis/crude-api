import { User } from '../utils/user.interface';

import { v4 as uuid } from "uuid";

const localUsers = new Map<string, User>();

const isClusterWorker = Boolean(process.send);

function sendRequest<T>(type: string, payload?: any): Promise<T> {
  return new Promise((resolve) => {
    process.send?.({ type, payload });
    process.on("message", (message: any) => {
      if (message.type === `${type}:response`) resolve(message.data);
    });
  });
}

export async function getAllUserRecords(): Promise<User[]> {
  if (!isClusterWorker) {
    return Array.from(localUsers.values());
  }
  return sendRequest<User[]>("getAll");
}

export async function getUserRecordById(id: string): Promise<User | null> {
  if (!isClusterWorker) {
    return localUsers.get(id) ?? null;
  }
  return sendRequest<User | null>("getById", { id });
}

export async function createUserRecord(data: Omit<User, "id">): Promise<User> {
  const user: User = { id: uuid(), ...data };

  if (!isClusterWorker) {
    localUsers.set(user.id, user);
    return user;
  }
  return sendRequest<User>("create", { user });
}

export async function updateUserRecord(id: string, changes: Omit<User, "id">): Promise<User | null> {
  if (!isClusterWorker) {
    if (!localUsers.has(id)) return null;
    const updated = { id, ...changes };
    localUsers.set(id, updated);
    return updated;
  }
  return sendRequest<User | null>("update", { id, user: { id, ...changes } });
}

export async function deleteUserRecord(id: string): Promise<boolean> {
  if (!isClusterWorker) {
    return localUsers.delete(id);
  }
  await sendRequest("delete", { id });
  return true;
}
