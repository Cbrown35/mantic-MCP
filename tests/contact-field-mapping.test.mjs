import test from 'node:test';
import assert from 'node:assert/strict';
import { toolHandlers } from '../build/tools/contacts.js';

function makeClient() {
  const calls = [];
  return {
    calls,
    v1: {
      async post(url, payload) {
        calls.push({ method: 'post', url, payload });
        return { data: { contact: payload } };
      },
      async patch(url, payload) {
        calls.push({ method: 'patch', url, payload });
        return { data: { contact: payload } };
      },
    },
  };
}

test('create_contact maps camelCase names and flattens customFields into Mautic aliases', async () => {
  const client = makeClient();

  await toolHandlers.create_contact(client, {
    email: 'test@example.com',
    firstName: 'Hermes',
    lastName: 'Agent',
    company: 'Nous',
    customFields: {
      firstname: 'Override First',
      lastname: 'Override Last',
      favorite_color: 'blue',
    },
  });

  assert.equal(client.calls.length, 1);
  assert.deepEqual(client.calls[0], {
    method: 'post',
    url: '/contacts/new',
    payload: {
      email: 'test@example.com',
      firstname: 'Override First',
      lastname: 'Override Last',
      company: 'Nous',
      favorite_color: 'blue',
    },
  });
});

test('update_contact maps camelCase names and flattens customFields into Mautic aliases', async () => {
  const client = makeClient();

  await toolHandlers.update_contact(client, {
    id: 42,
    firstName: 'Hermes',
    lastName: 'Agent',
    customFields: {
      firstname: 'Override First',
      lastname: 'Override Last',
      timezone: 'UTC',
    },
  });

  assert.equal(client.calls.length, 1);
  assert.deepEqual(client.calls[0], {
    method: 'patch',
    url: '/contacts/42/edit',
    payload: {
      firstname: 'Override First',
      lastname: 'Override Last',
      timezone: 'UTC',
    },
  });
});
