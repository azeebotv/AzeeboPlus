import type { Preview } from '@storybook/react';
import './preview.css';

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
        // The az surface layers, so the toggle previews a component against the
        // backgrounds it will actually sit on. These used to be Tailwind's
        // `gray-800/900/700`, which the library never renders against.
        { name: 'dark', value: '#0F0F0F' },
        { name: 'light', value: '#ffffff' },
        { name: 'surface', value: '#141414' },
        { name: 'card', value: '#1F1F1F' },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '812px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
        },
      },
    },
    a11y: {
      config: {},
    },
    docs: {
      autodocs: 'tag',
    },
  },
};

export default preview;
