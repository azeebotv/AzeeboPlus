/**
 * Expo config for Azeebo+ TV.
 *
 * app.json is the static base; this shim injects build-time environment
 * variables (EAS secrets / local .env) into `extra` so the runtime can read
 * them via Constants.expoConfig.extra. A static app.json alone can never see
 * EAS env vars — the pins (CERT_PIN_*) would provision but never load.
 *
 * Values are optional: absent vars are simply omitted from extra and the
 * certificatePinning loader falls back to its placeholder-safe behavior.
 */
const base = require('./app.json');

module.exports = {
  expo: {
    ...base.expo,
    extra: {
      ...base.expo.extra,
      ...(process.env.CERT_PIN_PRODUCTION && { CERT_PIN_PRODUCTION: process.env.CERT_PIN_PRODUCTION }),
      ...(process.env.CERT_PIN_PRODUCTION_BACKUP && {
        CERT_PIN_PRODUCTION_BACKUP: process.env.CERT_PIN_PRODUCTION_BACKUP,
      }),
      ...(process.env.CERT_PIN_STAGING && { CERT_PIN_STAGING: process.env.CERT_PIN_STAGING }),
      ...(process.env.CERT_PIN_STAGING_BACKUP && {
        CERT_PIN_STAGING_BACKUP: process.env.CERT_PIN_STAGING_BACKUP,
      }),
      ...(process.env.CERT_PIN_EXPIRY && { CERT_PIN_EXPIRY: process.env.CERT_PIN_EXPIRY }),
      ...(process.env.CERT_PIN_HOST_PRODUCTION && {
        CERT_PIN_HOST_PRODUCTION: process.env.CERT_PIN_HOST_PRODUCTION,
      }),
      ...(process.env.CERT_PIN_HOST_STAGING && {
        CERT_PIN_HOST_STAGING: process.env.CERT_PIN_HOST_STAGING,
      }),
    },
  },
};
