require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
  },
  resolve: true,
});
require('./test-nest.ts');
