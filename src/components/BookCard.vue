<script setup>
defineProps({ book: { type: Object, required: true }, selected: Boolean, batch: Boolean })
defineEmits(['open','ai','catalog','delete','export'])
</script>

<template>
  <article class="book-card" :class="{selected}" @click="$emit('open', book)">
    <div v-if="batch" class="check-dot">{{ selected ? '✓' : '' }}</div>
    <div class="cover"><img v-if="book.cover" :src="book.cover" :alt="book.title" /><div v-else class="cover-fallback">{{ book.title?.slice(0, 2) || '归棠' }}</div></div>
    <div class="book-info">
      <b>《{{ book.title }}》</b>
      <p>{{ book.author || '佚名' }}</p>
      <div class="meta"><span>{{ book.chapterCount || 0 }} 章</span><span>{{ (book.wordCount || 0).toLocaleString('zh-CN') }} 字</span></div>
      <div class="actions" @click.stop>
        <button class="mini" @click="$emit('ai', book)">AI</button>
        <button class="mini" @click="$emit('catalog', book)">目录</button>
        <button class="mini" @click="$emit('export', book)">导出</button>
        <button class="mini danger" @click="$emit('delete', book)">删</button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.book-card{position:relative;border:1px solid #dce6d5;background:linear-gradient(180deg,#fffef8,#fbfff4);border-radius:18px;overflow:hidden;box-shadow:0 8px 20px rgba(42,76,37,.08);transition:.2s;cursor:pointer}.book-card:hover{transform:translateY(-2px);box-shadow:0 16px 35px rgba(38,76,37,.14)}.book-card.selected{outline:3px solid #2f7437;outline-offset:-3px}.check-dot{position:absolute;left:8px;top:8px;z-index:2;width:24px;height:24px;border-radius:999px;background:#2f7437;color:#fff;display:grid;place-items:center;font-weight:900}.cover{aspect-ratio:2/3;background:#e6eee0;overflow:hidden}.cover img{width:100%;height:100%;object-fit:cover;display:block}.cover-fallback{height:100%;display:grid;place-items:center;font-size:30px;font-weight:900;color:#2f6f35;background:linear-gradient(145deg,#eff8e8,#fbfff7)}.book-info{padding:11px 12px 12px}.book-info b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.book-info p{margin:5px 0 8px;color:#60705d;font-size:12px}.meta{display:flex;justify-content:space-between;color:#687466;font-size:11px}.actions{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:10px}.mini{height:27px;border-radius:999px;background:#eef7e8;border:1px solid #d5e4cd;color:#315f34;font-weight:800;font-size:12px}.mini.danger{color:#9b3428;background:#fff7f4;border-color:#eed0ca}
</style>
