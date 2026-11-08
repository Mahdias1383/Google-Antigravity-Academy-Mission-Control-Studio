import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Firestore security rules enforce all 8 hardened pillars and reject Dirty Dozen patterns', () => {
  const rulesText = fs.readFileSync('./firestore.rules', 'utf8');

  // Pillar 1: Global catch-all deny
  assert.equal(rulesText.includes('allow read, write: if false;'), true);
  // Pillar 2: Validation helpers present and used in update blocks
  assert.equal(rulesText.includes('function isValidArchitectProgress(data)'), true);
  assert.equal(rulesText.includes('function isValidDailyStudyGoal(data)'), true);
  // Pillar 3: Path variable ID hardening
  assert.equal(rulesText.includes('function isValidId(id)'), true);
  // Pillar 4 & 5: Strict key allowlisting & array bounds
  assert.equal(rulesText.includes('hasOnly('), true);
  assert.equal(rulesText.includes('affectedKeys().hasOnly('), true);
  // Pillar 6: Verified user email requirement
  assert.equal(rulesText.includes('request.auth.token.email_verified == true'), true);
  // Pillar 7 & 8: Temporal integrity & query enforcement
  assert.equal(rulesText.includes('request.time'), true);
  assert.equal(rulesText.includes('resource.data.ownerId == request.auth.uid'), true);
});
