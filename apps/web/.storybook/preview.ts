import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

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
        { name: 'brand-flame', value: '#EC691F' },
        { name: 'brand-green', value: '#10B981' },
      ],
    },
    a11y: {
      // 'todo' | 'error' | 'off'
      config: {},
      standards: [
        {
          id: 'color-contrast',
          enabled: true,
        },
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
        wide: {
          name: 'Wide',
          styles: { width: '1920px', height: '1080px' },
        },
      },
    },
    nextjs: {
      appDirectory: true,
    },
  },
};

export default preview;
