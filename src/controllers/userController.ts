import { IncomingMessage, ServerResponse } from 'http';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { getAllUserRecords, getUserRecordById } from '../models/userModel';
import { User } from '../utils/user.interface';

function json(res: ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

export async function getAllUsers(_req: IncomingMessage, res: ServerResponse) {
  const users = await getAllUserRecords();
  json(res, 200, users);
}

export async function getUserById(
  _req: IncomingMessage,
  res: ServerResponse,
  userId: string,
) {
  if (!uuidValidate(userId)) {
    json(res, 400, { message: 'Invalid userId format (not uuid)' });
    return;
  }
  const user = await getUserRecordById(userId);
  if (!user) {
    json(res, 404, { message: 'User not found' });
    return;
  }
  json(res, 200, user);
}
