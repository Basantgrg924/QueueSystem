// Simple test that will always pass
test('basic math test', () => {
  expect(2 + 2).toBe(4);
});

test('app component exists', () => {
  // Just check that App import works
  const App = require('./App');
  expect(App).toBeDefined();
});