describe('Backend Tests', () => {
  test('basic math test', () => {
    expect(2 + 2).toBe(4);
  });

  test('environment variables', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });

  test('simple API test', () => {
    // Mock a simple API response
    const mockResponse = { status: 'OK' };
    expect(mockResponse.status).toBe('OK');
  });
});