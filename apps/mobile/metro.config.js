const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro know where to resolve packages from monorepo
// IMPORTANT: mobile node_modules FIRST so its versions take priority
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force critical packages to resolve from correct locations
// react 19.1.0 & react-dom 19.1.0 are in mobile workspace
// react-native 0.81.5 is hoisted to root
config.resolver.extraNodeModules = {
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(monorepoRoot, 'node_modules/react-native'),
  'react-native-web': path.resolve(projectRoot, 'node_modules/react-native-web'),
};

// Block root's react and react-dom to prevent version conflicts
// Root has React 18.3.1 (for Next.js backend), mobile needs React 19.1.0
const escapeRegex = (str) => str.replace(/[/\\]/g, '[/\\\\]');
const rootModules = escapeRegex(path.resolve(monorepoRoot, 'node_modules'));

config.resolver.blockList = [
  new RegExp(`${rootModules}[/\\\\]react[/\\\\].*`),
  new RegExp(`${rootModules}[/\\\\]react-dom[/\\\\].*`),
];

module.exports = config;
