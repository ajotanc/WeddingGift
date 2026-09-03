<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import { GuestService } from "@/services/guest.service";
import type { IPurchase } from "@/services/purchase.service";
import { useAuthStore } from "@/stores/auth";
import { ref, watch } from "vue";

import FormGroup from "@/components/reusable/FormGroup.vue";
import Modal from "@/components/reusable/Modal.vue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Loader2, User } from "lucide-vue-next";
import { toast } from "vue-sonner";

const props = defineProps<{
	open: boolean;
	tenantPurchases?: IPurchase[];
}>();

const emit = defineEmits<(e: "update:open", value: boolean) => void>();

const authStore = useAuthStore();

const isLoading = ref(false);
const profileName = ref("");
const profilePhone = ref("");

const purchases = ref<IPurchase[]>([]);

// Se o convidado abrir o modal, popula os dados atuais
watch(
	() => props.open,
	async (isOpen) => {
		if (isOpen && authStore.guest) {
			profileName.value = authStore.guest.name || "";
			profilePhone.value = authStore.guest.phone || "";

			if (props.tenantPurchases) {
				purchases.value = props.tenantPurchases.filter((p) => {
					const guestId = typeof p.guest === "string" ? p.guest : p.guest?.$id;
					return guestId === authStore.guest?.$id;
				});
			}
		}
	},
	{ immediate: true },
);

const handleModalOpenUpdate = (value: boolean) => {
	emit("update:open", value);
};

const saveProfile = async () => {
	if (!authStore.guest) return;

	const trimmedName = profileName.value.trim();
	if (trimmedName.length < 2) {
		toast.error("Por favor, informe seu nome completo.");
		return;
	}

	const cleanedPhone = profilePhone.value.replace(/\D/g, "");
	if (cleanedPhone && (cleanedPhone.length < 10 || cleanedPhone.length > 11)) {
		toast.error("Por favor, informe um número de WhatsApp válido com DDD.");
		return;
	}

	isLoading.value = true;

	try {
		const updated = await GuestService.upsert(authStore.guest.$id, {
			name: trimmedName,
			phone: cleanedPhone,
		});

		authStore.guest = updated;

		toast.success("Dados salvos com sucesso!");
		emit("update:open", false);
	} catch (err: unknown) {
		const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
		console.error("Erro ao salvar perfil do convidado:", errorMsg);
		toast.error("Não foi possível salvar os dados. Tente novamente.");
	} finally {
		isLoading.value = false;
	}
};
</script>

<template>
  <Modal :open="open" :persistent="false" :show-close-button="true" @update:open="handleModalOpenUpdate"
    title="Minha Conta"
    description="Gerencie seu perfil e acompanhe os presentes enviados.">

    <Tabs default-value="profile" class="w-full mt-4 min-w-0">
      <TabsList class="grid w-full grid-cols-2 rounded-none border-b border-slate-100 bg-transparent p-0 h-auto">
        <TabsTrigger value="profile"
          class="rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent py-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none text-sm">
          <User class="hidden sm:inline-block w-4 h-4 mr-1.5" /> Meu Perfil
        </TabsTrigger>
        <TabsTrigger value="gifts"
          class="rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent py-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none text-sm">
          <Gift class="hidden sm:inline-block w-4 h-4 mr-1.5" /> Meus Presentes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" class="space-y-6 mt-6">
        <FormGroup label="Nome Completo">
          <Input v-model="profileName" placeholder="Seu nome"
            class="h-12 bg-slate-50/50 rounded-xl border-slate-200" />
        </FormGroup>

        <FormGroup label="Telefone / WhatsApp">
          <Input v-model="profilePhone" v-maska="'(##) #####-####'" type="tel" placeholder="(11) 99999-9999"
            class="h-12 bg-slate-50/50 rounded-xl border-slate-200" />
        </FormGroup>

        <p v-if="!authStore.guest?.phone" class="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
          💡 Informe seu WhatsApp para facilitar o contato e receber novidades do evento. Se preferir, você pode preencher depois.
        </p>

        <div class="flex flex-col gap-2 mt-4">
          <Button @click="saveProfile" :disabled="isLoading" class="w-full">
            <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin mr-2" />
            Salvar Alterações
          </Button>
          <Button variant="ghost" type="button" @click="emit('update:open', false)"
            class="w-full text-slate-400 hover:text-slate-600">
            Pular por enquanto
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="gifts" class="mt-6">
        <div v-if="purchases.length === 0" class="py-12 text-center text-slate-500 flex flex-col items-center">
          <Gift class="w-12 h-12 text-slate-200 mb-4" />
          <p>Você ainda não deu nenhum presente.</p>
        </div>

        <div v-else class="space-y-4 max-h-[60vh] overflow-y-auto w-full min-w-0">
          <div v-for="p in purchases" :key="p.$id"
            class="p-3 sm:p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex gap-3 sm:gap-4 w-full min-w-0">
            <img v-if="p.product?.image_url" :src="p.product.image_url"
              class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 bg-white" />
            <div v-else
              class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white flex items-center justify-center shrink-0 border border-slate-100">
              <Gift class="w-5 h-5 sm:w-6 sm:h-6 text-slate-300" />
            </div>

            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-medium text-slate-900">{{ p.product?.name || 'Presente removido' }}
              </h4>
              <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-sm text-slate-500">
                <span>{{ p.quantity }}x {{ p.product?.type === 'quota' ? 'cota(s)' :
                  'unidade(s)' }}</span>
                <template v-if="p.method === 'pix'">
                  <span class="hidden sm:inline text-slate-300">•</span>
                  <span class="font-medium text-primary">{{ formatMoney(p.price_paid) }}</span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </Modal>
</template>
