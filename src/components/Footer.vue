<script setup>
import { useLanguage } from '../composables/useLanguage';

const { t } = useLanguage();
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="relative w-full mt-auto z-10">
    
    <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>

    <div class="bg-[#050505]/80 backdrop-blur-xl border-t border-white/5 pt-10 pb-8">
        <div class="max-w-7xl mx-auto px-4 md:px-6">
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 items-center">
                
                <div class="flex flex-col items-center md:items-start space-y-3">
                    <p class="text-xs text-gray-500 text-center md:text-left leading-relaxed max-w-xs">
                        {{ t('footer_privacy') }}
                    </p>
                    
                    <div class="text-[10px] text-gray-600 font-mono">
                        © {{ currentYear }} Galax. All rights reserved.
                    </div>
                </div>

                <div class="flex flex-col items-center justify-center space-y-4">
                     
                     <a href="https://github.com/nicolagalassi/ovalue" target="_blank" class="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-400 hover:text-white transition group shadow-lg hover:shadow-cyan-500/20" title="GitHub Repo">
                        <svg class="w-6 h-6 group-hover:scale-110 transition" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"></path></svg>
                     </a>

                     <p class="text-xs text-gray-400 italic text-center leading-relaxed">
                        {{ t('footer_dedication') }}
                    </p>
                </div>

                <div class="flex flex-col items-center md:items-end space-y-4">
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Support Project</span>
                    
                    <a href='https://ko-fi.com/galax95' target='_blank' class="relative group inline-flex items-center justify-center px-8 py-2.5 bg-[#29abe0]/10 hover:bg-[#29abe0]/20 border border-[#29abe0]/50 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(41,171,224,0.3)] overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-[#29abe0]/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
                        <span class="text-[#29abe0] text-sm font-bold group-hover:text-white transition uppercase tracking-wider">Donate</span>
                    </a>
                    
                    <div class="text-[10px] text-gray-600 font-mono text-center md:text-right">
                        Serverless Architecture.<br>No data stored on server.
                    </div>
                </div>

            </div>
        </div>
    </div>
  </footer>
</template>