import { IncomingMessage, ServerResponse } from "http";
import { v4 as uuidv4, validate as uuidValidate } from "uuid";
import {
  createUserRecord,
  deleteUserRecord,
  getAllUserRecords,
  getUserRecordById,
  updateUserRecord,

} from "../models/userModel";

import { User } from "../utils/user.interface";
import { isValidUserPayload } from "../utils/validators";

function json(res: ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

export async function getAllUsers(_req: IncomingMessage, res: ServerResponse) {
  const users = await getAllUserRecords();
  json(res, 200, users);
}

export async function getUserById(_req: IncomingMessage, res: ServerResponse, userId: string) {
  if (!uuidValidate(userId)) {
    json(res, 400, { message: "Invalid userId format (not uuid)" });
    return;
  }
  const user = await getUserRecordById(userId);
  if (!user) {
    json(res, 404, { message: "User not found" });
    return;
  }
  json(res, 200, user);
}

export async function createUser(_req: IncomingMessage, res: ServerResponse, body: any) {
  const validation = isValidUserPayload(body);
  if (!validation.valid) {
    json(res, 400, { message: validation.message });
    return;
  }

  const newUser: User = {
    id: uuidv4(),
    username: body.username,
    age: body.age,
    hobbies: Array.isArray(body.hobbies) ? body.hobbies : []
  };

  const created = await createUserRecord(newUser);
  json(res, 201, created);
}

export async function updateUser(_req: IncomingMessage, res: ServerResponse, userId: string, body: any) {
  if (!uuidValidate(userId)) {
    json(res, 400, { message: "Invalid userId format (not uuid)" });
    return;
  }

  const existing = await getUserRecordById(userId);
  if (!existing) {
    json(res, 404, { message: "User not found" });
    return;
  }

  const validation = isValidUserPayload(body);
  if (!validation.valid) {
    json(res, 400, { message: validation.message });
    return;
  }

  const updated: User = {
    id: userId,
    username: body.username,
    age: body.age,
    hobbies: Array.isArray(body.hobbies) ? body.hobbies : []
  };

  const result = await updateUserRecord(userId, updated);
  json(res, 200, result);
}

export async function deleteUser(_req: IncomingMessage, res: ServerResponse, userId: string) {
  if (!uuidValidate(userId)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Invalid userId format (not uuid)" }));
    return;
  }
  const existing = await getUserRecordById(userId);
  if (!existing) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "User not found" }));
    return;
  }
  await deleteUserRecord(userId);
  res.writeHead(204);
  res.end();
}
