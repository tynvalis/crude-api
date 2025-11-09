import { spawn } from 'node:child_process';

const PORT = process.env.PORT ?? '4000';
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess: any;
let createdUserId = '';

beforeAll(async () => {
  await new Promise((resolve, reject) => {
    const build = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      shell: true,
    });
    build.on('exit', (code) => (code === 0 ? resolve(null) : reject(code)));
  });

  serverProcess = spawn('node', ['dist/index.js'], {
    env: { ...process.env, PORT },
    stdio: 'inherit',
    shell: true,
  });

  await new Promise((res) => setTimeout(res, 400));
});

afterAll(() => {
  serverProcess.kill();
});

test('GET /api/users -> should return empty list', async () => {
  const res = await fetch(`${BASE_URL}/api/users`);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data).toEqual([]);
});

test('POST /api/users -> should create user', async () => {
  const res = await fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'John',
      age: 25,
      hobbies: ['music'],
    }),
  });

  expect(res.status).toBe(201);
  const data = await res.json();

  createdUserId = data.id;
  expect(createdUserId).toBeDefined();
  expect(data.username).toBe('John');
});

test('GET /api/users/{id} -> should return created user', async () => {
  const res = await fetch(`${BASE_URL}/api/users/${createdUserId}`);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.id).toBe(createdUserId);
  expect(data.username).toBe('John');
});

test('PUT /api/users/{id} -> should update existing user', async () => {
  const res = await fetch(`${BASE_URL}/api/users/${createdUserId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'John Updated',
      age: 30,
      hobbies: [],
    }),
  });

  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.username).toBe('John Updated');
});

test('DELETE /api/users/{id} -> should delete user', async () => {
  const res = await fetch(`${BASE_URL}/api/users/${createdUserId}`, {
    method: 'DELETE',
  });
  expect(res.status).toBe(204);
});

test('GET /api/users/{id} after delete -> should return 404', async () => {
  const res = await fetch(`${BASE_URL}/api/users/${createdUserId}`);
  expect(res.status).toBe(404);
});
