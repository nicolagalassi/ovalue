<script setup>
import { computed } from 'vue';
import { useLanguage } from '../composables/useLanguage';
const { t } = useLanguage();

// Il messaggio contiene \n — lo splittiamo per renderlo con <br>
const messageLines = computed(() => t('maintenance_message').split('\n'));
</script>

<template>
  <div class="maintenance-root">
    <!-- Star field -->
    <div class="stars-bg"></div>

    <div class="content">
      <!-- Logo -->
      <img src="/ovalue.png" alt="OValue" class="logo" />

      <!-- Status indicator -->
      <div class="status-pill">
        <span class="pulse-dot"></span>
        <span>{{ t('maintenance_status') }}</span>
      </div>

      <!-- Title -->
      <h1 class="title">{{ t('maintenance_title') }}</h1>

      <!-- Message -->
      <p class="message">
        <template v-for="(line, i) in messageLines" :key="i">
          {{ line }}<br v-if="i < messageLines.length - 1" />
        </template>
      </p>

      <!-- Divider -->
      <div class="divider">
        <div class="line"></div>
        <div class="diamond"></div>
        <div class="line"></div>
      </div>

      <!-- Quote localizzata -->
      <p class="quote">{{ t('footer_quote') }}</p>

      <!-- Links -->
      <div class="links">
        <a href="https://github.com/nicolagalassi/ovalue" target="_blank" rel="noopener noreferrer" class="link">
          <svg class="icon" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"/></svg>
          GitHub
        </a>
        <span class="sep">·</span>
        <a href="https://ko-fi.com/galax95" target="_blank" rel="noopener noreferrer" class="link kofi">
          ☕ {{ t('support_banner_link') }}
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.maintenance-root {
  min-height: 100vh;
  background-color: #070c18;
  background-image:
    radial-gradient(ellipse at 25% 0%,   rgba(15, 40, 90, 0.70) 0px, transparent 55%),
    radial-gradient(ellipse at 90% 8%,   rgba(35, 18, 80, 0.45) 0px, transparent 45%),
    radial-gradient(ellipse at 5%  88%,  rgba(8,  22, 58, 0.45) 0px, transparent 48%),
    radial-gradient(ellipse at 98% 82%,  rgba(22,  8, 60, 0.35) 0px, transparent 42%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, -apple-system, sans-serif;
  position: relative;
  overflow: hidden;
}

/* Star field */
.stars-bg {
  position: fixed;
  inset: 0;
  background-image:
    radial-gradient(circle, rgba(255,255,255,0.032) 1px, transparent 1px),
    radial-gradient(circle, rgba(255,255,255,0.018) 1px, transparent 1px);
  background-size: 88px 88px, 53px 53px;
  background-position: 0 0, 28px 42px;
  pointer-events: none;
  z-index: 0;
}

.content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2rem 1.5rem;
  max-width: 520px;
  width: 100%;
  animation: fadeUp 0.7s ease-out both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.logo {
  width: 64px;
  height: auto;
  margin: 0 auto 2rem;
  display: block;
  opacity: 0.9;
  filter: drop-shadow(0 0 20px rgba(96, 165, 250, 0.3));
}

/* Status pill */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  border: 1px solid rgba(251, 191, 36, 0.25);
  border-radius: 999px;
  background: rgba(251, 191, 36, 0.06);
  font-size: 11px;
  font-weight: 600;
  color: rgba(251, 191, 36, 0.8);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 2rem;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fbbf24;
  animation: pulse 1.8s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(251,191,36,0.5); }
  50%       { opacity: 0.7; box-shadow: 0 0 0 5px rgba(251,191,36,0); }
}

/* Title */
.title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 900;
  color: #e2e8f0;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0 0 1.25rem;
}

/* Message */
.message {
  font-size: 1rem;
  color: #94a3b8;
  line-height: 1.7;
  margin: 0 0 2.5rem;
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 auto 2rem;
  max-width: 280px;
}
.line {
  flex-grow: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(148,163,184,0.2));
}
.divider .line:last-child {
  background: linear-gradient(to left, transparent, rgba(148,163,184,0.2));
}
.diamond {
  width: 5px;
  height: 5px;
  border: 1px solid rgba(148,163,184,0.4);
  transform: rotate(45deg);
  flex-shrink: 0;
}

/* Quote */
.quote {
  font-size: 0.875rem;
  color: #64748b;
  font-style: italic;
  line-height: 1.7;
  margin: 0 0 2.5rem;
}
.quote span {
  color: #475569;
}

/* Links */
.links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 12px;
}
.link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #475569;
  text-decoration: none;
  transition: color 0.2s;
  font-weight: 500;
}
.link:hover { color: #94a3b8; }
.link.kofi:hover { color: #fbbf24; }
.icon {
  width: 13px;
  height: 13px;
}
.sep {
  color: #2d3748;
}
</style>
