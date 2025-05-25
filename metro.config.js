// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': path.resolve(__dirname),
  '@components': path.resolve(__dirname, 'components'),
  '@constants': path.resolve(__dirname, 'constants'),
  '@hooks': path.resolve(__dirname, 'hooks'),
};

module.exports = config;
