// Metro config: NativeWind + access to the monorepo's Shared/ package (types, constants, zod validation).
// The mobile app is a standalone npm project (Expo pins its own React / React Native), so bare imports made
// from inside Shared/ (e.g. `zod`) are resolved from THIS app's node_modules — one copy of every dependency.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, '../../Shared');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), sharedRoot];
config.resolver.extraNodeModules = { ...(config.resolver.extraNodeModules ?? {}), '@ecommerce/shared': sharedRoot };

const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = upstream ?? context.resolveRequest;
  const fromShared = context.originModulePath.startsWith(sharedRoot + path.sep);
  if (fromShared && !moduleName.startsWith('.') && !path.isAbsolute(moduleName)) {
    return resolve({ ...context, originModulePath: path.join(projectRoot, 'index.js') }, moduleName, platform);
  }
  return resolve(context, moduleName, platform);
};

// Staff UI kit and server code in Shared/ are not for the mobile bundle.
const escape = (p) => p.replace(/[/\\]/g, '[/\\\\]');
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList ?? []),
  new RegExp(`${escape(path.join(sharedRoot, 'web'))}[/\\\\].*`),
  new RegExp(`${escape(path.join(sharedRoot, 'server'))}[/\\\\].*`),
  new RegExp(`${escape(path.join(sharedRoot, 'node_modules'))}[/\\\\].*`),
];

module.exports = withNativeWind(config, { input: './src/global.css' });
