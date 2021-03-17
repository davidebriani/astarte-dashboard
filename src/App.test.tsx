import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders Standalone Editor without config', () => {
  const { container } = render(<App config={null} />);
  const title = container.querySelector('h2');
  expect(title).toBeInTheDocument();
  expect(title).toHaveTextContent('Interface Editor');
});
