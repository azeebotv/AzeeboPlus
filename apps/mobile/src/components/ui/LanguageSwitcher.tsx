import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Modal,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage, LANGUAGES, type SupportedLanguage } from '../../i18n';
import { colors } from '../../theme';

interface LanguageSwitcherProps {
  /** Position of the button — 'header' (top-right) or 'footer' (bottom-center) */
  placement?: 'header' | 'footer';
}

export default function LanguageSwitcher({ placement = 'header' }: LanguageSwitcherProps) {
  const colorScheme = useColorScheme();
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || 'en'
  );

  useEffect(() => {
    setCurrentLanguage((i18n.language as SupportedLanguage) || 'en');
  }, [i18n.language]);

  const handleLanguageChange = useCallback(async (lang: SupportedLanguage) => {
    await changeLanguage(lang);
    setCurrentLanguage(lang);
    setModalVisible(false);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === currentLanguage);

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, placement === 'footer' && styles.triggerFooter]}
        onPress={() => setModalVisible(true)}
        accessibilityLabel={t('settings.selectLanguage')}
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <Text style={styles.triggerEmoji}>
          {currentLanguage === 'en' ? '🇬🇧' : currentLanguage === 'fr' ? '🇫🇷' : '🇳🇬'}
        </Text>
        <Text
          style={[
            styles.triggerText,
            { color: colorScheme === 'dark' ? colors.text.tertiary : '#888' },
          ]}
        >
          {currentLang?.nativeName || 'English'}
        </Text>
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: colorScheme === 'dark' ? colors.bg.tertiary : '#fff' },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
              ]}
            >
              {t('settings.selectLanguage')}
            </Text>

            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLanguage === lang.code && {
                    backgroundColor:
                      colorScheme === 'dark' ? 'rgba(232,66,10,0.15)' : 'rgba(232,66,10,0.08)',
                  },
                ]}
                onPress={() => handleLanguageChange(lang.code)}
                accessibilityLabel={`${t('settings.selectLanguage')}: ${lang.name}`}
                accessibilityRole="button"
              >
                <Text style={styles.languageEmoji}>
                  {lang.code === 'en'
                    ? '🇬🇧'
                    : lang.code === 'fr'
                      ? '🇫🇷'
                      : lang.code === 'pt'
                        ? '🇵🇹'
                        : '🇳🇬'}
                </Text>
                <View style={styles.languageInfo}>
                  <Text
                    style={[
                      styles.languageName,
                      { color: colorScheme === 'dark' ? colors.text.primary : '#000' },
                    ]}
                  >
                    {lang.name}
                  </Text>
                  <Text style={styles.languageNative}>{lang.nativeName}</Text>
                </View>
                {currentLanguage === lang.code && <Text style={styles.languageCheck}>✓</Text>}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
    position: 'absolute',
    top: 8,
    right: 16,
    zIndex: 100,
  },
  triggerFooter: {
    position: 'relative',
    top: 0,
    right: 0,
    alignSelf: 'center',
    marginTop: 16,
  },
  triggerEmoji: {
    fontSize: 16,
  },
  triggerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  languageEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
  },
  languageNative: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  languageCheck: {
    fontSize: 20,
    color: '#E8420A',
    fontWeight: '700',
  },
  modalCloseButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(232,66,10,0.1)',
    borderRadius: 12,
  },
  modalCloseText: {
    color: '#E8420A',
    fontSize: 16,
    fontWeight: '600',
  },
});
