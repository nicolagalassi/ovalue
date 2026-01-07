<script setup>
import { ref } from 'vue';
import { useLanguage } from '../composables/useLanguage';

// Importiamo currentLang per gestire la frase dei ringraziamenti
const { t, currentLang } = useLanguage();
const showPrivacyModal = ref(false); 
</script>

<template>
  <footer class="w-full border-t border-ogame-border bg-[#0d1014] py-8 px-4 mt-auto z-10 relative">
    
    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-ogame-accent/20 to-transparent"></div>

    <div class="max-w-4xl mx-auto text-center">
      
      <div class="flex justify-center items-center gap-8 mb-6 mt-2">
        
        <a href="https://github.com/nicolagalassi/ogame-tools" target="_blank" class="text-gray-600 hover:text-white transition duration-300 transform hover:scale-110" title="Source Code">
            <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"></path>
            </svg>
        </a>

        <button @click="showPrivacyModal = true" class="text-gray-600 hover:text-green-500 transition duration-300 transform hover:scale-110 outline-none" title="Privacy Policy">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
        </button>

      </div>

      <p class="text-l text-ogame-warning font-mono tracking-wide mt-2 px-4 leading-relaxed">
          {{ currentLang === 'it' 
              ? "Un ringraziamento ad HighSeven e a tutta la PQS per il supporto" 
              : "Special thanks to HighSeven and the entire PQS for the support" 
          }}
      </p>

    </div>

    <Teleport to="body">
      <div v-if="showPrivacyModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="showPrivacyModal = false"></div>
        
        <div class="bg-[#161b22] border border-gray-700 rounded-xl p-6 md:p-8 max-w-md w-full relative shadow-2xl transform transition-all scale-100">
            
            <button @click="showPrivacyModal = false" class="absolute top-4 right-4 text-gray-500 hover:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <div class="text-center">
                <div class="mx-auto w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                </div>
                
                <h3 class="text-xl font-bold text-white mb-2">Privacy & Data</h3>
                
                <div class="text-sm text-gray-400 space-y-3 leading-relaxed text-left mt-4 bg-black/20 p-4 rounded-lg border border-gray-800">
                    <p>{{ t('footer_privacy') }}</p>
                </div>

                <button @click="showPrivacyModal = false" class="mt-6 w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-bold transition">
                    OK
                </button>
            </div>
        </div>
      </div>
    </Teleport>
  </footer>
</template>