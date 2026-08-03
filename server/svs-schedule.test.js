const test = require('node:test');
const assert = require('node:assert/strict');
const { scheduledSvsHistory } = require('./svs-schedule');

test('SVS history updates on the fortnightly Monday cadence only', () => {
  const august3 = scheduledSvsHistory(new Date('2026-08-03T16:00:00Z'));
  const august16 = scheduledSvsHistory(new Date('2026-08-16T16:00:00Z'));
  const august17 = scheduledSvsHistory(new Date('2026-08-17T16:00:00Z'));

  assert.equal(august3[0].date.toISOString().slice(0, 10), '2026-08-03');
  assert.equal(august3[0].week, '2026-W31');
  assert.equal(august3[1].week, '2026-W29');
  assert.equal(august16[0].date.toISOString().slice(0, 10), '2026-08-03');
  assert.equal(august17[0].date.toISOString().slice(0, 10), '2026-08-17');
  assert.equal(august17[0].week, '2026-W33');
});

test('SVS history never contains a future date', () => {
  const now = new Date('2026-08-03T16:00:00Z');
  const today = Date.UTC(2026, 7, 3);
  assert.ok(scheduledSvsHistory(now).every((entry) => entry.date.getTime() <= today));
});

test('SVS history rolls into the next year with the correct ISO week', () => {
  const december21 = scheduledSvsHistory(new Date('2026-12-21T16:00:00Z'));
  const january4 = scheduledSvsHistory(new Date('2027-01-04T16:00:00Z'));

  assert.equal(december21[0].date.toISOString().slice(0, 10), '2026-12-21');
  assert.equal(december21[0].week, '2026-W51');
  assert.equal(january4[0].date.toISOString().slice(0, 10), '2027-01-04');
  assert.equal(january4[0].week, '2026-W53');
});
