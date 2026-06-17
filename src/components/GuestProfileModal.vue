<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import { GuestService } from "@/services/guest.service";
import type { IPurchase } from "@/services/purchase.service";
import { useAuthStore } from "@/stores/auth";
import { ref, watch } from "vue";

import Modal from "@/components/reusable/Modal.vue";
import FormGroup from "@/components/reusable/FormGroup.vue";
import { User, Gift, Receipt, Loader2 } from "lucide-vue-next";
import { toast } from "vue-sonner";

const props = defineProps<{
  open: boolean;
  tenantPurchases?: IPurchase[];
}>();

const emit = defineEmits(["update:open"]);

const authStore = useAuthStore();

const activeTab = ref<"profile" | "gifts">("profile");

const isLoading = ref(false);
const profileName = ref("");
const profilePhone = ref("");

const purchases = ref<IPurchase[]>([]);
const purchasesLoading = ref(false);

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && authStore.guest) {
      profileName.value = authStore.guest.name || "";
      profilePhone.value = authStore.guest.phone || "";

      if (props.tenantPurchases) {
        console.log(props.tenantPurchases);
        purchases.value = props.tenantPurchases.filter(
          (p) => p.guest.$id === authStore.guest?.$id,
        );
      }
    }
  },
  { immediate: true },
);

const saveProfile = async () => {
  if (!authStore.guest) return;
  isLoading.value = true;

  try {
    const cleanedPhone = profilePhone.value
      ? profilePhone.value.replace(/\D/g, "")
      : undefined;
    const updated = await GuestService.upsert(authStore.guest.$id, {
      name: profileName.value,
      phone: cleanedPhone,
    });

    authStore.guest = updated;

    toast.success("Perfil atualizado com sucesso!");

    emit("update:open", false);
  } catch (e) {
    console.error(e);
    toast.error("Erro", { description: "Não foi possível salvar o perfil." });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Modal :open="open" @update:open="$emit('update:open', $event)" title="Minha Conta"
    description="Gerencie seu perfil e acompanhe os presentes enviados.">

    <div class="border-b border-slate-100 flex mt-4">
      <button @click="activeTab = 'profile'"
        class="flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2"
        :class="activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'">
        <User class="w-4 h-4" /> Meu Perfil
      </button>
      <button @click="activeTab = 'gifts'"
        class="flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2"
        :class="activeTab === 'gifts' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'">
        <Gift class="w-4 h-4" /> Meus Presentes
      </button>
    </div>

    <div class="p-6">
      <div v-if="activeTab === 'profile'" class="space-y-6">
        <div v-if="!authStore.guest?.phone"
          class="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm border border-yellow-200/50 mb-6 flex gap-3 items-start">
          <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z">
            </path>
          </svg>
          <p>Por favor, adicione seu telefone para facilitar o contato.</p>
        </div>

        <FormGroup label="Nome Completo">
          <Input v-model="profileName" placeholder="Seu nome" class="h-12 bg-slate-50/50 rounded-xl border-slate-200" />
        </FormGroup>

        <FormGroup label="Telefone / WhatsApp">
          <Input v-model="profilePhone" v-maska="'(##) #####-####'" type="tel" placeholder="(11) 99999-9999"
            class="h-12 bg-slate-50/50 rounded-xl border-slate-200" />
        </FormGroup>

        <Button @click="saveProfile" :disabled="isLoading" class="w-full h-12 rounded-xl mt-4">
          <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <div v-else-if="activeTab === 'gifts'">
        <div v-if="purchases.length === 0" class="py-12 text-center text-slate-500 flex flex-col items-center">
          <Gift class="w-12 h-12 text-slate-200 mb-4" />
          <p>Você ainda não deu nenhum presente.</p>
        </div>

        <div v-else class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div v-for="p in purchases" :key="p.$id"
            class="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex gap-4">
            <img v-if="p.product?.image_url" :src="p.product.image_url"
              class="w-16 h-16 rounded-xl object-cover shrink-0 bg-white" />
            <div v-else
              class="w-16 h-16 rounded-xl bg-white flex items-center justify-center shrink-0 border border-slate-100">
              <Gift class="w-6 h-6 text-slate-300" />
            </div>

            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-slate-900 truncate">{{ p.product?.name || 'Presente removido' }}
              </h4>
              <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-sm text-slate-500">
                <span>{{ p.quantity }}x {{ p.product.type === 'quota' ? 'cota(s)' :
                  'unidade(s)' }}</span>
                <template v-if="p.method === 'pix'">
                  <span class="hidden sm:inline text-slate-300">•</span>
                  <span class="font-medium text-primary">{{ formatMoney(p.price_paid) }}</span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>
