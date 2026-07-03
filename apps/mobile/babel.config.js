module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Disable react-native-worklets plugin to fix prebuild error
      // The plugin is not needed for the build process
    ],
  };
};
