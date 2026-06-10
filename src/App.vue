<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'
import ToastHost from './components/ToastHost.vue'
import { useLibraryStore } from './stores/libraryStore'
import { useSettingsStore } from './stores/settingsStore'

const route = useRoute()
const library = useLibraryStore()
const settings = useSettingsStore()
const title = computed(() => route.meta?.title || '归棠')

onMounted(async () => {
  await settings.load()
  await library.loadBooks()
})
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <AppSidebar />
    </aside>
    <section class="app-window">
      <header class="topbar">
        <div>
          <h1>{{ title }}</h1>
          <p>本地高性能阅读器 · AI 长篇创作工作台 · v3整合版</p>
        </div>
        <div class="topbar-right">
          <span class="safe-pill">IndexedDB 本地保存</span>
          <span class="window-dot"></span><span class="window-dot"></span><span class="window-dot"></span>
        </div>
      </header>
      <main class="main-panel">
        <RouterView />
      </main>
    </section>
    <ToastHost />
  </div>
</template>
