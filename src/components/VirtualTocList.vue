<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  chapters: { type: Array, default: () => [] },
  activeId: { type: String, default: '' },
  rowHeight: { type: Number, default: 38 }
})
const emit = defineEmits(['select'])
const scrollTop = ref(0)
const viewportHeight = ref(520)
const overscan = 8
const totalHeight = computed(() => props.chapters.length * props.rowHeight)
const start = computed(() => Math.max(0, Math.floor(scrollTop.value / props.rowHeight) - overscan))
const visibleCount = computed(() => Math.ceil(viewportHeight.value / props.rowHeight) + overscan * 2)
const visible = computed(() => props.chapters.slice(start.value, start.value + visibleCount.value))
function onScroll(e){
  scrollTop.value = e.target.scrollTop
  viewportHeight.value = e.target.clientHeight || viewportHeight.value
}
</script>

<template>
  <div class="toc-scroll" @scroll="onScroll">
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <button
        v-for="(ch, i) in visible"
        :key="ch.id"
        class="toc-row"
        :class="{ active: ch.id === activeId }"
        :style="{ transform: `translateY(${(start + i) * rowHeight}px)`, height: rowHeight + 'px' }"
        @click="emit('select', ch)"
      >
        <span>{{ ch.index + 1 }}</span>
        <b>{{ ch.title }}</b>
      </button>
    </div>
  </div>
</template>

<style scoped>
.toc-scroll{height:100%;overflow:auto;position:relative}.toc-row{position:absolute;left:0;right:0;display:grid;grid-template-columns:42px minmax(0,1fr);align-items:center;text-align:left;padding:0 10px;border-radius:10px;color:#41513e}.toc-row:hover,.toc-row.active{background:#edf7e8;color:#27612e}.toc-row span{font-size:12px;color:#809077}.toc-row b{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
</style>
