/**
 * i18n for the Azeebo+ TV app.
 *
 * The bundle, detection, and persistence live in the shared data layer
 * (@azeebo/react-data) so mobile and TV cannot drift. Re-exported here for
 * backward compatibility with existing import sites; prefer importing from
 * '@azeebo/react-data/i18n' in new code.
 */

export { LANGUAGES, changeLanguage, type SupportedLanguage } from '@azeebo/react-data/i18n';
import shared from '@azeebo/react-data/i18n';

export default shared;
