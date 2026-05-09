import { ref } from 'vue';
import it from '../locales/it.json';
import en from '../locales/en.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';

const locales = { it, en, de, fr };

// Fallback chain: lingua corrente → EN → IT → chiave grezza
// EN e IT sono le più complete; i termini di gioco sono in EN
const FALLBACK_CHAIN = ['en', 'it'];

const currentLang = ref(localStorage.getItem('ogame_lang') || 'it');

export function useLanguage() {

  const setLanguage = (lang) => {
    if (locales[lang]) {
      currentLang.value = lang;
      localStorage.setItem('ogame_lang', lang);
    }
  };

  const t = (key) => {
    if (!key) return '';

    // 1. Lingua corrente
    const current = locales[currentLang.value];
    if (current?.[key] !== undefined && current[key] !== '') {
      return current[key];
    }

    // 2. Fallback chain: EN poi IT
    for (const lang of FALLBACK_CHAIN) {
      if (lang === currentLang.value) continue;
      const dict = locales[lang];
      if (dict?.[key] !== undefined && dict[key] !== '') {
        return dict[key];
      }
    }

    // 3. Chiave grezza (non dovrebbe mai accadere con IT come ultima risorsa)
    return key;
  };

  return { currentLang, setLanguage, t };
}
