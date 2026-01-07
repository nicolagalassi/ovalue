import { ref, computed } from 'vue';
import it from '../locales/it.json';
import en from '../locales/en.json';

// Carichiamo i JSON in memoria
const locales = { it, en };

// Stato Reattivo (La lingua attuale)
// Legge dal localStorage o usa 'it' come default
const currentLang = ref(localStorage.getItem('ogame_lang') || 'it');

export function useLanguage() {
  
  // Funzione per cambiare lingua
  const setLanguage = (lang) => {
    if (locales[lang]) {
      currentLang.value = lang;
      localStorage.setItem('ogame_lang', lang);
    }
  };

  // Funzione di traduzione t('chiave')
  const t = (key) => {
    const dict = locales[currentLang.value];
    return dict[key] || key;
  };

  return {
    currentLang,
    setLanguage,
    t
  };
}