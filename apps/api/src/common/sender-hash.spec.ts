import { senderHasher } from './sender-hash';

const SECRET = 'test-jwt-secret';
const IP = '203.0.113.7';

describe('senderHasher', () => {
  it('Given the contact scope, When an address is hashed, Then the fingerprint is the one contact messages already carry', () => {
    // HMAC-SHA256(sha256("contact|test-jwt-secret"), "203.0.113.7"), calculé hors de ce code.
    expect(senderHasher(SECRET, 'contact')(IP)).toBe(
      '37689dce1bbb1b6191acbcbe4dc76da131fbef117b5b8a41fd14d23208da6b43',
    );
  });

  it('Given two scopes, When the same address is hashed, Then the fingerprints differ: a comment cannot be linked to a contact message', () => {
    expect(senderHasher(SECRET, 'comments')(IP)).not.toBe(
      senderHasher(SECRET, 'contact')(IP),
    );
  });

  it('Given two secrets, When the same address is hashed, Then the fingerprints differ', () => {
    expect(senderHasher(SECRET, 'comments')(IP)).not.toBe(
      senderHasher('un-autre-secret', 'comments')(IP),
    );
  });

  it('Given two addresses, When they are hashed, Then the result is 64 hex characters, distinct, and never contains the address', () => {
    const hash = senderHasher(SECRET, 'comments')(IP);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(IP);
    expect(senderHasher(SECRET, 'comments')('198.51.100.1')).not.toBe(hash);
  });
});
