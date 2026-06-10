<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLibraryStore } from '../stores/libraryStore'
import { useSettingsStore } from '../stores/settingsStore'
import { avatarFallback } from '../utils/covers'

const route = useRoute()
const library = useLibraryStore()
const settings = useSettingsStore()
const totalWords = computed(() => library.totalWords)
const firstBook = computed(() => library.sortedBooks[0])
const items = computed(() => [
  { to: '/', key: 'library', icon: '📚', label: '书架' },
  { to: '/import', key: 'import', icon: '📥', label: '导入' },
  { to: firstBook.value ? `/reader/${firstBook.value.id}/${firstBook.value.lastReadChapterId || ''}` : '/reader', key: 'reader', icon: '📖', label: '阅读器' },
  { to: firstBook.value ? `/catalog/${firstBook.value.id}` : '/catalog', key: 'catalog', icon: '☷', label: '目录' },
  { to: '/covers', key: 'covers', icon: '🎨', label: '封面' },
  { to: firstBook.value ? `/ai/${firstBook.value.id}` : '/ai', key: 'ai', icon: '✨', label: 'AI 创作' },
  { to: '/settings', key: 'settings', icon: '⚙️', label: '设置' }
])
</script>

<template>
  <div class="sidebar-inner">
    <div class="brand">
      <img class="logo-img" :src="settings.profile.avatar || avatarFallback()" alt="头像" />
      <div>
        <b>{{ settings.profile.name }}</b>
        <span>{{ settings.profile.subtitle }}</span>
      </div>
    </div>
    <nav class="nav">
      <RouterLink v-for="item in items" :key="item.key" :to="item.to" class="nav-link" :class="{active: route.name === item.key}">
        <span>{{ item.icon }}</span><b>{{ item.label }}</b>
      </RouterLink>
    </nav>
    <div class="storage-card">
      <b>本地书库</b>
      <p>{{ library.books.length }} 本 · {{ totalWords.toLocaleString('zh-CN') }} 字</p>
      <div class="storage-bar"><i :style="{ width: Math.min(100, Math.max(4, library.books.length * 6)) + '%' }"></i></div>
      <small>书籍摘要 / 章节正文 / AI 草稿分表保存，打开更轻。</small>
    </div>
  </div>
</template>

<style scoped>
.sidebar-inner{height:100%;display:flex;flex-direction:column;padding:24px 18px}.brand{display:flex;gap:14px;align-items:center;margin-bottom:24px}.logo-img{width:58px;height:58px;border-radius:18px;object-fit:cover;box-shadow:0 12px 28px rgba(35,83,38,.22)}.brand b{display:block;font-size:24px}.brand span{display:block;font-size:12px;color:#60705d;margin-top:4px}.nav{display:flex;flex-direction:column;gap:9px}.nav-link{height:50px;display:flex;align-items:center;gap:13px;padding:0 16px;border-radius:18px;text-decoration:none;color:#233422;font-weight:900}.nav-link.active{background:linear-gradient(180deg,#3a7f3d,#23632b);color:#fff;box-shadow:0 12px 25px rgba(39,98,42,.22)}.nav-link span{font-size:21px}.storage-card{margin-top:auto;border:1px solid #dae8d2;background:linear-gradient(180deg,#fbfff7,#f2faee);border-radius:18px;padding:16px}.storage-card b{font-size:16px}.storage-card p{color:#536353;font-size:13px;margin:8px 0}.storage-bar{height:8px;background:#dce7d7;border-radius:999px;overflow:hidden;margin:12px 0}.storage-bar i{display:block;height:100%;background:linear-gradient(90deg,#2d7537,#92bd72);border-radius:999px}.storage-card small{color:#687466;line-height:1.6}
</style>
