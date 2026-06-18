<script setup lang="ts">
import { RouterView } from "vue-router";

import Modal from "@/components/reusable/Modal.vue";
import { Button } from "@/components/ui/button";
import Confirm from "@/components/ui/confirm/Confirm.vue";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { EmailService } from "@/services/email.service";
import { useAuthStore } from "@/stores/auth";
import { MessageSquarePlus } from "lucide-vue-next";
import { ref, watch } from "vue";
import { toast } from "vue-sonner";
import FormGroup from "./components/reusable/FormGroup.vue";
import { Select, SelectContent, SelectItem, SelectValue } from "./components/ui/select/index.js";
import SelectTrigger from "./components/ui/select/SelectTrigger.vue";

const authStore = useAuthStore();
const showFeedbackModal = ref(false);
const name = ref("");
const email = ref("");
const type = ref("Sugestão");
const message = ref("");
const sending = ref(false);

watch(
  () => authStore.user,
  (user) => {
    if (user) {
      name.value = user.name || "";
      email.value = user.email || "";
    }
  },
  { immediate: true },
);

watch(
  () => authStore.guest,
  (guest) => {
    if (guest) {
      name.value = guest.name || name.value;
      email.value = guest.email || email.value;
    }
  },
  { immediate: true },
);

const openFeedback = () => {
  message.value = "";
  if (authStore.user) {
    name.value = authStore.user.name || "";
    email.value = authStore.user.email || "";
  } else if (authStore.guest) {
    name.value = authStore.guest.name || "";
    email.value = authStore.guest.email || "";
  }
  showFeedbackModal.value = true;
};

const sendFeedback = async () => {
  if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
    toast.error("Por favor, preencha todos os campos.");
    return;
  }
  sending.value = true;
  try {
    await EmailService.sendFeedback({
      name: name.value,
      email: email.value,
      type: type.value,
      message: message.value,
    });
    toast.success("Feedback enviado com sucesso! Muito obrigado.");
    showFeedbackModal.value = false;
    message.value = "";
  } catch (error) {
    console.error(error);
    toast.error("Erro ao enviar o feedback. Tente novamente mais tarde.");
  } finally {
    sending.value = false;
  }
};
</script>

<template>
  <RouterView />
  <Confirm />
  <Toaster position="top-right" richColors />

  <!-- Global Floating Feedback Button -->
  <button type="button" @click="openFeedback"
    class="fixed bottom-6 left-6 z-50 bg-primary text-white p-3 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 border-0 outline-none">
    <MessageSquarePlus class="w-5 h-5 text-white" />
    <span class="text-sm font-semibold hidden md:inline">Feedback</span>
  </button>

  <!-- Feedback Modal -->
  <Modal v-model:open="showFeedbackModal" title="Sugestões / Dúvidas / Críticas"
    description="Ajude-nos a melhorar a plataforma enviando o seu feedback.">
    <form @submit.prevent="sendFeedback" class="space-y-4 pt-4">
      <FormGroup label="Seu Nome">
        <Input v-model="name" placeholder="Ex: João" class="bg-slate-50/50" />
      </FormGroup>
      <FormGroup label="Seu E-mail">
        <Input v-model="email" type="email" placeholder="joao@example.com" required
          class="rounded-xl border-slate-200 focus-visible:ring-primary/20 bg-slate-50/50" />
      </FormGroup>
      <FormGroup label="Tipo">
        <Select v-model="type">
          <SelectTrigger
            class="w-full bg-white border-slate-200 rounded-xl text-sm font-light text-slate-600 focus:ring-primary/20 h-11">
            <SelectValue placeholder="Selecione um ícone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Sugestão">Sugestão</SelectItem>
            <SelectItem value="Dúvida">Dúvida</SelectItem>
            <SelectItem value="Crítica">Crítica</SelectItem>
          </SelectContent>
        </Select>
      </FormGroup>

      <FormGroup label="Mensagem">
        <Textarea v-model="message" placeholder="O que você gostaria de nos dizer?" required
          class="rounded-xl border-slate-200 focus-visible:ring-primary/20 bg-slate-50/50 min-h-[100px] resize-none" />
      </FormGroup>

      <div class="pt-2 flex justify-end gap-3">
        <Button type="button" variant="ghost" @click="showFeedbackModal = false" class="text-slate-500">
          Cancelar
        </Button>
        <Button type="submit" :disabled="sending">
          {{ sending ? 'Enviando...' : 'Enviar Feedback' }}
        </Button>
      </div>
    </form>
  </Modal>
</template>
