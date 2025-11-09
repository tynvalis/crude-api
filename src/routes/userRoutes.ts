import { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import { parseJsonBody } from '../utils/httpHelpers';

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const url = req.url
    ? new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
    : null;
  const pathname = url?.pathname ?? '/';
  const method = req.method ?? 'GET';

  try {
    if (pathname === '/api/users' && method === 'GET') {
      await getAllUsers(req, res);
      return;
    }

    if (pathname === '/api/users' && method === 'POST') {
      const body = await parseJsonBody(req, res);
      if (body === null) return;
      await createUser(req, res, body);
      return;
    }

    const userIdMatch = pathname.match(/^\/api\/users\/([0-9a-fA-F-]{36})$/);
    if (userIdMatch) {
      const userId = userIdMatch[1];

      if (method === 'GET') {
        await getUserById(req, res, userId);
        return;
      }
      if (method === 'PUT') {
        const body = await parseJsonBody(req, res);
        if (body === null) return;
        await updateUser(req, res, userId, body);
        return;
      }
      if (method === 'DELETE') {
        await deleteUser(req, res, userId);
        return;
      }
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Resource not found' }));
  } catch (err) {
    console.error('Route handler error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Internal Server Error' }));
  }
}
