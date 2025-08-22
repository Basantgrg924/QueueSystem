test('basic math test', () => {
  expect(2 + 2).toBe(4);
});

test('string manipulation test', () => {
  expect('hello'.toUpperCase()).toBe('HELLO');
});

test('array test', () => {
  const arr = [1, 2, 3];
  expect(arr.length).toBe(3);
});