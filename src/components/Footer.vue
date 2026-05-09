<script setup>
import { useLanguage } from '../composables/useLanguage';

const { t } = useLanguage();
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="relative w-full mt-auto border-t border-slate-700/20 bg-[#070c18]/80 backdrop-blur-xl">

    <div class="max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-12">

      <!-- Quote — prominent, centered -->
      <blockquote class="text-center mb-8">
        <p class="text-base md:text-lg text-slate-300 italic leading-relaxed font-serif tracking-wide">
          {{ t('footer_quote') }}
        </p>
      </blockquote>

      <!-- Thin separator -->
      <div class="flex items-center gap-4 mb-8">
        <div class="flex-grow h-px bg-gradient-to-r from-transparent to-slate-700/40"></div>
        <div class="w-1 h-1 rounded-full bg-slate-600"></div>
        <div class="flex-grow h-px bg-gradient-to-l from-transparent to-slate-700/40"></div>
      </div>

      <!-- Bottom row -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">

        <!-- Links -->
        <div class="flex items-center gap-4">
          <a href="https://github.com/nicolagalassi/ovalue" target="_blank" rel="noopener noreferrer"
             class="flex items-center gap-1.5 hover:text-slate-300 transition-colors">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"/></svg>
            GitHub
          </a>
          <span class="text-slate-700">·</span>
          <a href="https://github.com/nicolagalassi/ovalue/wiki/How-to-use-OValue" target="_blank" rel="noopener noreferrer"
             class="hover:text-slate-300 transition-colors">
            {{ t('footer_wiki') }}
          </a>
        </div>

        <!-- Ringraziamento -->
        <p class="text-slate-500 text-center sm:text-right italic text-[11px] max-w-xs">
          {{ t('footer_dedication') }}
        </p>

        <!-- Copyright -->
        <span class="text-slate-600 text-[10px] whitespace-nowrap">© {{ currentYear }} OValue</span>

      </div>
    </div>

  </footer>
</template>
