// Offline tests for the email tools' MJML handling. Run with `npm test`
// (builds first, then runs these against build/). No Mautic needed: the API
// client is replaced by a fake that records requests and answers like Mautic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toolHandlers } from '../build/tools/emails.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MJML = text =>
  `<mjml><mj-body><mj-section><mj-column><mj-text>Hi {contactfield=firstname|there},</mj-text>` +
  `<mj-text>${text}</mj-text></mj-column></mj-section></mj-body></mjml>`;

/**
 * Fake Mautic API. Saves echo the body back, and like Mautic's serializer the
 * saved email carries grapesjsbuilder.customMjml when MJML was sent, unless
 * `storesMjml` is false (builder plugin unpublished).
 */
function fakeClient({ existingEmail = { id: 7 }, storesMjml = true, template = null } = {}) {
  const calls = [];
  const saved = body => {
    const { grapesjsbuilder, ...rest } = body;
    const email = { id: 7, template, ...rest };
    if (grapesjsbuilder && storesMjml) email.grapesjsbuilder = { customMjml: grapesjsbuilder.customMjml };
    return Promise.resolve({ data: { email } });
  };
  return {
    calls,
    v1: {
      get: url => { calls.push({ method: 'get', url }); return Promise.resolve({ data: { email: existingEmail } }); },
      post: (url, body) => { calls.push({ method: 'post', url, body }); return saved(body); },
      patch: (url, body) => { calls.push({ method: 'patch', url, body }); return saved(body); },
    },
  };
}

const text = result => result.content[0].text;
const methods = client => client.calls.map(c => c.method);

// ---------- create_email_template ----------

test('create with customMjml only compiles HTML and sends the builder payload', async () => {
  const client = fakeClient();
  const result = await toolHandlers.create_email_template(client, { name: 'n', subject: 's', customMjml: MJML('BODY') });
  assert.equal(result.isError, undefined);
  assert.equal(client.calls.length, 1);
  const { method, url, body } = client.calls[0];
  assert.equal(method, 'post');
  assert.equal(url, '/emails/new');
  assert.match(body.customHtml, /BODY/);
  assert.match(body.customHtml, /\{contactfield=firstname\|there\}/);
  assert.deepEqual(body.grapesjsbuilder, { customMjml: MJML('BODY') });
  assert.equal('customMjml' in body, false);
  assert.match(text(result), /compiled from customMjml/);
});

test('whitespace-only customHtml next to customMjml counts as missing', async () => {
  const client = fakeClient();
  await toolHandlers.create_email_template(client, { name: 'n', subject: 's', customHtml: '   ', customMjml: MJML('WS') });
  assert.match(client.calls[0].body.customHtml, /WS/);
});

test('explicit customHtml next to customMjml is kept, with a note', async () => {
  const client = fakeClient();
  const result = await toolHandlers.create_email_template(client, { name: 'n', subject: 's', customHtml: '<p>MINE</p>', customMjml: MJML('X') });
  assert.equal(client.calls[0].body.customHtml, '<p>MINE</p>');
  assert.deepEqual(client.calls[0].body.grapesjsbuilder, { customMjml: MJML('X') });
  assert.match(text(result), /stored as given/);
});

test('create without customMjml passes fields through unchanged', async () => {
  const client = fakeClient();
  await toolHandlers.create_email_template(client, { name: 'n', subject: 's', customHtml: '<p>H</p>' });
  assert.deepEqual(client.calls[0].body, { name: 'n', subject: 's', customHtml: '<p>H</p>' });
});

// ---------- guards shared by both tools ----------

for (const tool of ['create_email_template', 'update_email']) {
  for (const key of ['grapesjsbuilder', 'emailform']) {
    test(`${tool} refuses a raw ${key} argument`, async () => {
      const client = fakeClient();
      const raw = key === 'emailform' ? { customHtml: '' } : { customMjml: MJML('X') };
      const result = await toolHandlers[tool](client, { id: 7, name: 'n', subject: 's', customMjml: MJML('Y'), [key]: raw });
      assert.equal(result.isError, true);
      assert.match(text(result), new RegExp(key));
      assert.equal(client.calls.length, 0);
    });
  }

  test(`${tool} rejects empty or unparseable MJML before any request, even with customHtml`, async () => {
    for (const customHtml of [undefined, '<p>x</p>']) {
      for (const customMjml of ['', '   ', 42, 'not mjml at all']) {
        const client = fakeClient();
        const result = await toolHandlers[tool](client, { id: 7, name: 'n', subject: 's', customHtml, customMjml });
        assert.equal(result.isError, true, `customMjml=${JSON.stringify(customMjml)} customHtml=${customHtml}`);
        assert.equal(client.calls.length, 0);
      }
    }
  });

  test(`${tool} reports an error when Mautic does not store the MJML`, async () => {
    const client = fakeClient({ storesMjml: false });
    const result = await toolHandlers[tool](client, { id: 7, name: 'n', subject: 's', customMjml: MJML('X') });
    assert.equal(result.isError, true);
    assert.match(text(result), /did not store the MJML/);
  });

  test(`${tool} notes the code-mode theme`, async () => {
    const client = fakeClient({ template: 'mautic_code_mode' });
    const result = await toolHandlers[tool](client, { id: 7, name: 'n', subject: 's', customMjml: MJML('X') });
    assert.equal(result.isError, undefined);
    assert.match(text(result), /code-mode theme/);
  });
}

// ---------- update_email ----------

test('update with customMjml recompiles HTML and clears the editor state', async () => {
  const client = fakeClient();
  const result = await toolHandlers.update_email(client, { id: 7, customMjml: MJML('NEW') });
  assert.equal(result.isError, undefined);
  assert.deepEqual(methods(client), ['get', 'patch']);
  const { url, body } = client.calls[1];
  assert.equal(url, '/emails/7/edit');
  assert.match(body.customHtml, /NEW/);
  assert.deepEqual(body.grapesjsbuilder, { customMjml: MJML('NEW'), editorState: null });
});

test('update with only customHtml on a builder email is refused', async () => {
  const client = fakeClient({ existingEmail: { id: 7, grapesjsbuilder: { customMjml: MJML('OLD') } } });
  const result = await toolHandlers.update_email(client, { id: 7, customHtml: '<p>X</p>' });
  assert.equal(result.isError, true);
  assert.match(text(result), /allowMjmlDesync/);
  assert.deepEqual(methods(client), ['get']);
});

test('allowMjmlDesync: true lets an HTML-only update through and is not sent to Mautic', async () => {
  const client = fakeClient({ existingEmail: { id: 7, grapesjsbuilder: { customMjml: MJML('OLD') } } });
  const result = await toolHandlers.update_email(client, { id: 7, customHtml: '<p>X</p>', allowMjmlDesync: true });
  assert.equal(result.isError, undefined);
  assert.deepEqual(methods(client), ['get', 'patch']);
  assert.deepEqual(client.calls[1].body, { customHtml: '<p>X</p>' });
});

test('allowMjmlDesync must be a real boolean', async () => {
  for (const allowMjmlDesync of ['false', 'true', 1, 0]) {
    const client = fakeClient({ existingEmail: { id: 7, grapesjsbuilder: { customMjml: MJML('OLD') } } });
    const result = await toolHandlers.update_email(client, { id: 7, customHtml: '<p>X</p>', allowMjmlDesync });
    assert.equal(result.isError, true, `allowMjmlDesync=${JSON.stringify(allowMjmlDesync)}`);
    assert.equal(client.calls.length, 0);
  }
});

test('update refuses to blank the HTML', async () => {
  for (const customHtml of [null, '', '   ']) {
    const client = fakeClient();
    const result = await toolHandlers.update_email(client, { id: 7, customHtml });
    assert.equal(result.isError, true, `customHtml=${JSON.stringify(customHtml)}`);
    assert.equal(client.calls.length, 0);
  }
});

test('update with only customHtml on a plain HTML email goes through', async () => {
  const client = fakeClient({ existingEmail: { id: 7 } });
  const result = await toolHandlers.update_email(client, { id: 7, customHtml: '<p>X</p>' });
  assert.equal(result.isError, undefined);
  assert.deepEqual(methods(client), ['get', 'patch']);
});

test('update of other fields sends no builder payload', async () => {
  const client = fakeClient();
  await toolHandlers.update_email(client, { id: '7', subject: 'New' });
  assert.deepEqual(client.calls[1], { method: 'patch', url: '/emails/7/edit', body: { subject: 'New' } });
});

test('update resends the dynamic content and translation parent Mautic 6 would reset', async () => {
  const dynamicContent = [{ tokenName: 'Dynamic Content 1', content: 'D', filters: [{ content: 'V', filters: [] }] }];
  const template = fakeClient({ existingEmail: { id: 7, emailType: 'template', dynamicContent, translationParent: { id: 3 } } });
  await toolHandlers.update_email(template, { id: 7, subject: 'New' });
  assert.deepEqual(template.calls[1].body, { subject: 'New', dynamicContent, emailType: 'template', templateTranslationParent: 3 });

  const segment = fakeClient({ existingEmail: { id: 7, emailType: 'list', translationParent: { id: 4 } } });
  await toolHandlers.update_email(segment, { id: 7, subject: 'New' });
  assert.deepEqual(segment.calls[1].body, { subject: 'New', emailType: 'list', segmentTranslationParent: 4 });

  const given = fakeClient({ existingEmail: { id: 7, emailType: 'template', dynamicContent, translationParent: { id: 3 } } });
  await toolHandlers.update_email(given, { id: 7, dynamicContent: [], templateTranslationParent: null });
  assert.deepEqual(given.calls[1].body, { dynamicContent: [], templateTranslationParent: null });
});

test('update rejects bad ids and empty updates without a request', async () => {
  for (const id of [undefined, null, 0, -1, 1.5, '1/send', '../contacts', 'abc']) {
    const client = fakeClient();
    const result = await toolHandlers.update_email(client, { id, subject: 'x' });
    assert.equal(result.isError, true, `id=${JSON.stringify(id)}`);
    assert.equal(client.calls.length, 0);
  }
  const client = fakeClient();
  const result = await toolHandlers.update_email(client, { id: 7, allowMjmlDesync: true });
  assert.equal(result.isError, true);
  assert.match(text(result), /Nothing to update/);
  assert.equal(client.calls.length, 0);
});

test('Mautic API errors propagate to the server error handler', async () => {
  const client = fakeClient();
  const apiError = Object.assign(new Error('Request failed with status code 404'), { isAxiosError: true });
  client.v1.patch = () => Promise.reject(apiError);
  client.v1.get = () => Promise.reject(apiError);
  await assert.rejects(toolHandlers.update_email(client, { id: 7, customMjml: MJML('X') }), apiError);
  await assert.rejects(toolHandlers.update_email(client, { id: 7, customHtml: '<p>X</p>' }), apiError);
});

// ---------- MJML compilation safety ----------

test('MJML warnings are reported without the server path', async () => {
  const client = fakeClient();
  const mjml = '<mjml><mj-body><mj-section><mj-column><mj-text foo="1">W</mj-text></mj-column></mj-section></mj-body></mjml>';
  const result = await toolHandlers.create_email_template(client, { name: 'n', subject: 's', customMjml: mjml });
  assert.equal(result.isError, undefined);
  assert.match(text(result), /Line 1 \(mj-text\): Attribute foo is illegal/);
  assert.equal(text(result).includes(process.cwd()), false);
});

/** Run a small ES module in `cwd` and return its stdout (one JSON line). */
function runIn(cwd, code) {
  return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', code], { cwd, encoding: 'utf8' }).trim());
}

test('mj-include is never resolved (a relative include that mjml would otherwise read)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mjml-include-'));
  try {
    fs.writeFileSync(path.join(dir, 'secret.mjml'), '<mj-text>SECRET-FILE</mj-text>');
    const mjml = '<mjml><mj-body><mj-section><mj-column><mj-include path="./secret.mjml" /><mj-text>INC</mj-text></mj-column></mj-section></mj-body></mjml>';
    const ours = runIn(dir, `
      const { compileMjml } = await import(${JSON.stringify(path.join(ROOT, 'build/utils/mjml.js'))});
      const r = await compileMjml(${JSON.stringify(mjml)});
      console.log(JSON.stringify({ leaked: r.html.includes('SECRET-FILE'), ok: r.html.includes('INC') }));`);
    assert.deepEqual(ours, { leaked: false, ok: true });
    // Control: the same MJML with includes on does read the file, so this test can fail.
    const control = runIn(dir, `
      const { createRequire } = await import('node:module');
      const mjml2html = createRequire(${JSON.stringify(path.join(ROOT, 'package.json'))})('mjml');
      const r = await mjml2html(${JSON.stringify(mjml)}, { ignoreIncludes: false });
      console.log(JSON.stringify({ leaked: r.html.includes('SECRET-FILE') }));`);
    assert.deepEqual(control, { leaked: true });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a .mjmlconfig in the working directory cannot make the server load code', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mjml-config-'));
  const marker = path.join(dir, 'ran.txt');
  try {
    fs.writeFileSync(path.join(dir, '.mjmlconfig'), JSON.stringify({ packages: ['./evil.cjs'] }));
    fs.writeFileSync(path.join(dir, 'evil.cjs'), `require('fs').writeFileSync(${JSON.stringify(marker)}, 'x'); module.exports = [];`);
    runIn(dir, `
      const { compileMjml } = await import(${JSON.stringify(path.join(ROOT, 'build/utils/mjml.js'))});
      await compileMjml('<mjml><mj-body></mj-body></mjml>');
      console.log(JSON.stringify({ env: process.env.MJML_BROWSER ?? null }));`);
    assert.equal(fs.existsSync(marker), false, 'the .mjmlconfig package was loaded');
    // Control: loading mjml plainly from that folder does run it, so this test can fail.
    runIn(dir, `
      const { createRequire } = await import('node:module');
      createRequire(${JSON.stringify(path.join(ROOT, 'package.json'))})('mjml');
      console.log('{}');`);
    assert.equal(fs.existsSync(marker), true, 'control: plain mjml should have loaded it');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
