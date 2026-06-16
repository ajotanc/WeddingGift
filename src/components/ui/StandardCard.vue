<script setup lang="ts">

</script>

<template>
  <div :class="cn('bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]', $attrs.class?.toString())">
    <slot />
  </div>
</template>
