<script setup lang="ts">
import { RouterView } from 'vue-router'

import Toaster from '@/components/ui/toast/Toaster.vue'
import ConfirmDialogProvider from '@/components/ui/confirm-dialog/ConfirmDialogProvider.vue';
</script>

<template>
  <RouterView />
  <Toaster />
  <ConfirmDialogProvider />
</template>
