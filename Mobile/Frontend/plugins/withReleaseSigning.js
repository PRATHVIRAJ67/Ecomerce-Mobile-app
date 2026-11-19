/**
 * Signs Android release builds with the URU upload key instead of the shared debug key.
 * The keystore and passwords live OUTSIDE the repo, in ~/.gradle/gradle.properties:
 *   URU_UPLOAD_STORE_FILE=C:/Users/<you>/.uru-keys/uru-release.jks
 *   URU_UPLOAD_KEY_ALIAS=uru
 *   URU_UPLOAD_STORE_PASSWORD=…
 *   URU_UPLOAD_KEY_PASSWORD=…
 * If they're missing, release builds fall back to debug signing (fine for local testing only).
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const RELEASE_CONFIG = `
        release {
            if (project.hasProperty('URU_UPLOAD_STORE_FILE')) {
                storeFile file(URU_UPLOAD_STORE_FILE)
                storePassword URU_UPLOAD_STORE_PASSWORD
                keyAlias URU_UPLOAD_KEY_ALIAS
                keyPassword URU_UPLOAD_KEY_PASSWORD
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (!gradle.includes('URU_UPLOAD_STORE_FILE')) {
      gradle = gradle.replace(/signingConfigs\s*\{/, (m) => `${m}${RELEASE_CONFIG}`);
      // In the release buildType, swap the debug signing config for the release one.
      gradle = gradle.replace(/(release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/, (_m, before) =>
        `${before}signingConfig project.hasProperty('URU_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug`,
      );
    }
    cfg.modResults.contents = gradle;
    return cfg;
  });
};
