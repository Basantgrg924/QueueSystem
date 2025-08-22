describe('Backend Tests', () => {
  test('basic math test', () => {
    expect(2 + 2).toBe(4);
  });

  test('environment test', () => {
    expect(typeof process.env).toBe('object');
  });

  test('node environment test', () => {
    expect(process.version).toMatch(/^v\d+/);
  });
});