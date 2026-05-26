import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#111827' },
        { name: 'light', value: '#ffffff' },
        { name: 'surface', value: '#1F2937' },
        { name: 'card', value: '#374151' },
      ],
    },
  },
};

export default preview;
