<script setup lang="ts">
import { RouterView } from "vue-router";

import { Toaster } from "@/components/ui/sonner";
import Confirm from "@/components/ui/confirm/Confirm.vue";
</script>

<template>
  <RouterView />
  <Confirm />
  <Toaster position="top-right" richColors />
</template>
