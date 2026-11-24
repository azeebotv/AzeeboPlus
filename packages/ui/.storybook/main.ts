import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/postcss';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  /* Vite compiles CSS on its own and does not read `apps/web/postcss.config.js`,
     so without this the `@import 'tailwindcss'` in preview.css ships as an
     literal unresolved import: the tokens are defined, the utilities never are.
     Declared inline rather than as a `.storybook/postcss.config.js` because Vite
     only searches for that file from its own root, which Storybook sets per
     invocation. */
  viteFinal: (config) => {
    config.css = { ...config.css, postcss: { plugins: [tailwindcss()] } };
    return config;
  },
};

export default config;
