<script setup lang="ts">
// 1. Importações dos componentes de UI (Shadcn) que estão faltando
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

// 2. Importações de componentes específicos do seu projeto
import GoogleAuthButton from "@/components/ui/GoogleAuthButton.vue";
import CountdownTimer from "@/components/ui/CountdownTimer.vue";
import LeafletMap from "@/components/ui/LeafletMap.vue";
import Modal from "@/components/reusable/Modal.vue";
import GuestProfileModal from "@/components/GuestProfileModal.vue";

import { useTenant } from "@/composables/useTenant";
import { generatePixPayload } from "@/lib/utils";
import { generateThankYouMessage } from "@/lib/ai";
import { type IMessage, MessageService } from "@/services/message.service";
import { RsvpService } from "@/services/rsvp.service";
import { useAuthStore } from "@/stores/auth";
import { toTypedSchema } from "@vee-validate/zod";
import { useField, useForm } from "vee-validate";
import { computed, ref, watch } from "vue";
import * as z from "zod";

import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import ProductGallery from "@/components/ui/ProductGallery.vue";
import QrcodeSvg from "qrcode.vue";
import type { IGuest } from "@/services/guest.service";
import type { IProduct } from "@/services/product.service";
import Autoplay from "embla-carousel-autoplay";
import FormGroup from "@/components/reusable/FormGroup.vue";
import { toast } from "vue-sonner";

dayjs.locale("pt-br");

const carouselPlugins = [Autoplay({
  delay: 3000,
  stopOnInteraction: false,
  stopOnMouseEnter: true,
})];

const { tenant, products, messages, loading, error } = useTenant();
const authStore = useAuthStore();

const currentUser = computed(() => authStore.user);

const requireAuth = async (): Promise<boolean> => {
  if (currentUser.value) return true;
  try {
    await authStore.loginWithGoogle(window.location.href, window.location.href);
    return true;
  } catch (err) {
    console.error("Erro na autenticação", err);
    return false;
  }
};

const logout = async () => {
  await authStore.logout();
};

const selectedCategory = ref("all");
const currentPage = ref(1);
const itemsPerPage = ref(6);

watch(selectedCategory, () => {
  currentPage.value = 1;
});

watch(itemsPerPage, () => {
  currentPage.value = 1;
});

const filteredProducts = computed(() => {
  if (selectedCategory.value === "all") return products.value;
  return products.value.filter((p) => p.category === selectedCategory.value);
});

// Modals State
const showPixModal = ref(false);
const showLinksModal = ref(false);
const selectedProduct = ref<IProduct | null>(null);

const quotaQuantities = ref<Record<string, number>>({});

const pixPayload = computed(() => {
  if (!tenant.value || !selectedProduct.value) return "";
  const baseValue =
    selectedProduct.value.type === "quota"
      ? quotaQuantities.value[selectedProduct.value.$id] || 1
      : Number(selectedProduct.value.base_price) || 0;

  return generatePixPayload(
    tenant.value.pix_key,
    tenant.value.couple_name,
    String(baseValue),
  );
});

const openPixModal = async (product: IProduct) => {
  if (!currentUser.value) return;
  selectedProduct.value = product;
  showPixModal.value = true;
};

const openLinksModal = async (product: IProduct) => {
  if (!currentUser.value) return;
  if (product.links && product.links.length > 0) {
    selectedProduct.value = product;
    showLinksModal.value = true;
  }
};

const copyPix = () => {
  if (!tenant.value?.pix_key) return;
  navigator.clipboard.writeText(tenant.value.pix_key);
  toast.success("Sucesso", { description: "Chave PIX copiada para a área de transferência!" });
};

// RSVP Validation Schema
const rsvpSchema = toTypedSchema(
  z.object({
    guestName: z.string().min(3, "Nome muito curto"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(14, "Telefone inválido"),
    totalAdults: z.number().min(1, "No mínimo 1 adulto"),
    totalChildren: z.number().min(0),
    status: z.enum(["confirmed", "declined"]),
  }),
);

const { handleSubmit, errors } = useForm({
  validationSchema: rsvpSchema,
  initialValues: {
    guestName: "",
    email: "",
    phone: "",
    totalAdults: 1,
    totalChildren: 0,
    status: "confirmed",
  },
});

const { value: guestName } = useField<string>("guestName");
const { value: email } = useField<string>("email");
const { value: phone } = useField<string>("phone");
const { value: totalAdults } = useField<number>("totalAdults");
const { value: totalChildren } = useField<number>("totalChildren");
const { value: status } = useField<"confirmed" | "declined">("status");

watch(currentUser, (user) => {
  if (user) {
    if (!guestName.value) guestName.value = user.name || "";
    if (!email.value) email.value = user.email || "";
    if (!phone.value && user.phone) phone.value = user.phone;
  }
});

const rsvpLoading = ref(false);
const showRsvpModal = ref(false);

const submitRsvp = handleSubmit(async (values) => {
  if (!tenant.value) return;
  rsvpLoading.value = true;
  try {
    await RsvpService.create({
      tenant: tenant.value.$id,
      total_adults: values.totalAdults,
      total_children: values.totalChildren,
      status: values.status,
      guest: authStore.guest as IGuest,
    });

    guestName.value = "";
    email.value = "";
    phone.value = "";
    totalAdults.value = 1;
    totalChildren.value = 0;
    showRsvpModal.value = false;
    toast({
      title: "Sucesso",
      description: "Sua resposta foi enviada com sucesso! Obrigado.",
    });
  } catch (err) {
    toast({
      title: "Erro",
      description: "Houve um erro ao enviar sua resposta. Tente novamente.",
      variant: "destructive",
    });
  } finally {
    rsvpLoading.value = false;
  }
});

// Emotional Messages
const messageContent = ref("");
const submitMessage = async () => {
  if (!tenant.value || !messageContent.value.trim() || !currentUser.value)
    return;

  try {
    const newMsg = await MessageService.create({
      tenant: tenant.value.$id,
      content: messageContent.value,
      guest: authStore.guest as IGuest,
    });

    // Add instantly to UI array without fetching
    messages.value.unshift(newMsg);

    messageContent.value = "";
    toast({ title: "Sucesso", description: "Sua mensagem foi enviada!" });
  } catch (err) {
    toast({
      title: "Erro",
      description: "Erro ao enviar mensagem.",
      variant: "destructive",
    });
  }
};

const deleteMessage = async (msgId: string) => {
  if (!confirm("Deseja realmente apagar esta mensagem?")) return;
  try {
    await MessageService.delete(msgId);
    messages.value = messages.value.filter((m) => m.$id !== msgId);
    toast({ title: "Sucesso", description: "Mensagem apagada com sucesso." });
  } catch (err) {
    toast({
      title: "Erro",
      description: "Erro ao apagar mensagem.",
      variant: "destructive",
    });
  }
};

const toggleLike = async (msg: IMessage) => {
  const guestId = authStore.guest?.$id;
  if (!guestId) return;

  const originalLikes = [...(msg.likes || [])];
  const isLiked = msg.likes?.includes(guestId);

  if (isLiked) {
    msg.likes = msg.likes?.filter((id) => id !== guestId);
  } else {
    msg.likes = [...(msg.likes || []), guestId];
  }

  try {
    msg.likes?.length && await MessageService.likes(msg.$id, msg.likes);
  } catch (err) {
    msg.likes = originalLikes;

    toast({ title: "Erro", description: "Falha ao curtir.", variant: "destructive" });
  }
};
</script>

<template>
  <main class="min-h-screen font-sans text-slate-600"
    :style="{ backgroundColor: tenant?.background_color || '#fafafa' }">
    <div class="min-h-screen">
      <div v-if="loading" class="flex justify-center p-20 text-slate-400 font-light tracking-wide animate-pulse">
        Carregando experiência...</div>
      <div v-else-if="error" class="text-center p-20 text-red-500 font-medium">{{ error }}</div>
      <div v-else-if="tenant">

        <!-- Header Hero -->
        <!-- Header Hero -->
        <header :style="{ backgroundColor: tenant.background_color || 'transparent' }"
          class="relative py-32 px-6 text-center overflow-hidden">

          <!-- Background Image Layer -->
          <div v-if="tenant.background_image" class="absolute inset-0 bg-cover bg-center"
            :style="{ backgroundImage: `url(${tenant.background_image})` }"></div>

          <!-- Blur Overlay Layer (Smooth fade to background_color at bottom) -->
          <div class="absolute inset-0 bg-white/20"></div>
          <div
            class="absolute inset-0 backdrop-blur-md [mask-image:linear-gradient(to_bottom,transparent_30%,black_100%)]"
            :style="tenant.background_color ? { background: `linear-gradient(to bottom, transparent, ${tenant.background_color}CC 80%, ${tenant.background_color})` } : {}"
            :class="!tenant.background_color ? 'bg-gradient-to-b from-transparent via-zinc-50/80 to-zinc-50' : ''">
          </div>

          <div class="absolute top-0 left-0 w-full p-4 flex justify-end z-20">
            <GoogleAuthButton @click="requireAuth" @logout="logout" :user="currentUser || undefined" :fill="false"
              :themeColor="tenant.primary_color" />
          </div>

          <div class="relative max-w-4xl mx-auto z-10">
            <div class="w-16 h-px bg-primary/40 mx-auto mb-10"></div>
            <h1 class="text-5xl md:text-7xl font-serif text-slate-900 mb-8 tracking-tight">{{ tenant.couple_name }}</h1>
            <p class="text-sm md:text-base text-slate-500 font-light tracking-[0.2em] uppercase">Lista de Presentes &
              RSVP</p>
            <!-- Event Date & Time Display -->
            <div v-if="tenant.event_date" class="mt-4 text-slate-600 font-medium text-lg">
              {{ dayjs(tenant.event_date).format('DD/MM/YYYY') }} às {{ tenant.event_time }}
            </div>

            <!-- Countdown -->
            <div v-if="tenant.event_date && tenant?.show_countdown !== false" class="mt-6">
              <CountdownTimer :eventDate="tenant.event_date" />
            </div>
            <div class="w-16 h-px bg-primary/40 mx-auto mt-10"></div>
          </div>
        </header>

        <div class="max-w-5xl mx-auto p-6 md:p-12 lg:py-32 space-y-24 md:space-y-32">

          <!-- Couple History -->
          <section v-if="tenant.couple_history" class="text-center max-w-3xl mx-auto">
            <h2 class="text-3xl font-serif text-slate-900 mb-8">Nossa História</h2>
            <div class="text-slate-600 font-light text-lg leading-relaxed text-left quill-content"
              v-html="tenant.couple_history"></div>
          </section>

          <!-- Event Location Map -->
          <section v-if="tenant.event_location" class="text-center">
            <h2 class="text-3xl font-serif text-slate-900 mb-6">Local do Evento</h2>
            <div class="bg-white p-2 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80">
              <LeafletMap :address="tenant.event_location" />
            </div>
            <p class="text-slate-500 font-medium mt-4">{{ tenant.event_location }}</p>
          </section>

          <!-- Products -->
          <section>
            <div class="text-center mb-16">
              <h2 class="text-3xl font-serif text-slate-900 mb-6">Nossa Lista</h2>
              <p class="text-slate-500 font-light max-w-xl mx-auto text-lg leading-relaxed">Com muito carinho,
                selecionamos alguns itens e experiências. Fique à vontade para nos presentear com o que tocar o seu
                coração.</p>
            </div>

            <ProductGallery :products="products" :tenant="tenant" mode="public" :currentUser="currentUser" />

          </section>

          <!-- RSVP & Message Wall (2-column grid) -->
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">

            <!-- RSVP Column -->
            <div class="lg:col-span-7 space-y-10">
              <div class="mb-6">
                <h2 class="text-3xl font-serif text-slate-900 mb-4 tracking-tight">Confirme sua Presença</h2>
                <p class="text-slate-500 font-light leading-relaxed">Ficaremos imensamente felizes em celebrar esse
                  momento único
                  com você. Por favor, confirme abaixo.</p>
              </div>

              <form @submit.prevent="submitRsvp"
                class="space-y-6 bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80">
                <div class="space-y-5">
                  <FormGroup label="Nome Completo" :error="errors.guestName">
                    <Input v-model="guestName" placeholder="Seu nome"
                      class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20 bg-slate-50/50 h-12" />
                  </FormGroup>
                  <FormGroup label="E-mail" :error="errors.email">
                    <Input v-model="email" type="email" placeholder="Seu e-mail"
                      class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20 bg-slate-50/50 h-12" />
                  </FormGroup>
                  <FormGroup label="Telefone / WhatsApp" :error="errors.phone">
                    <Input v-model="phone" v-maska="'(##) #####-####'" type="tel" placeholder="(11) 99999-9999"
                      class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20 bg-slate-50/50 h-12" />
                  </FormGroup>
                  <div class="grid grid-cols-2 gap-5">
                    <FormGroup label="Adultos" :error="errors.totalAdults">
                      <Input v-model.number="totalAdults" type="number" min="0"
                        class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20 bg-slate-50/50 h-12" />
                    </FormGroup>
                    <FormGroup label="Crianças" :error="errors.totalChildren">
                      <Input v-model.number="totalChildren" type="number" min="0"
                        class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20 bg-slate-50/50 h-12" />
                    </FormGroup>
                  </div>
                  <FormGroup label="Você irá ao evento?">
                    <div class="relative w-full">
                      <select v-model="status"
                        class="w-full h-12 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-base font-light text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                        <option value="confirmed">Sim, estarei lá!</option>
                        <option value="declined">Não poderei ir</option>
                      </select>

                      <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </FormGroup>
                </div>
                <Button type="submit"
                  class="w-full rounded-xl py-6 font-medium shadow-sm hover:opacity-90 transition-all duration-300 ease-in-out"
                  :disabled="rsvpLoading">
                  {{ rsvpLoading ? 'Enviando...' : 'Confirmar Presença' }}
                </Button>
              </form>
            </div>

            <!-- Message Wall Column -->
            <div class="lg:col-span-5 space-y-10">
              <div class="mb-6">
                <h2 class="text-3xl font-serif text-slate-900 mb-4 tracking-tight">Mural de Recados</h2>
                <p class="text-slate-500 font-light leading-relaxed">Deixe uma mensagem carinhosa para os noivos.</p>
              </div>

              <div
                class="bg-white p-6 rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] mb-10 transition-shadow duration-300 hover:shadow-md">
                <div v-if="!currentUser"
                  class="text-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <p class="text-slate-500 mb-4">Faça login com sua conta Google para deixar um recado especial.</p>
                  <GoogleAuthButton @click="requireAuth" :fill="true" :themeColor="tenant.primary_color"
                    class="mx-auto" />
                </div>
                <div v-else>
                  <textarea v-model="messageContent"
                    class="w-full h-32 p-2 border-none bg-transparent focus:outline-none resize-none text-slate-700 font-sans font-light placeholder:text-slate-400 text-lg"
                    placeholder="Escreva algo especial aqui..."></textarea>
                  <div
                    class="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-slate-50 gap-4">
                    <div class="flex items-center gap-2">
                      <img v-if="authStore.guest?.photo_url" :src="authStore.guest.photo_url" alt="Foto"
                        class="w-6 h-6 rounded-full" />
                      <span class="text-xs text-slate-400 font-light">Publicando como <strong>{{ authStore.guest?.name
                      }}</strong></span>
                    </div>
                    <Button @click="submitMessage" :disabled="!messageContent"
                      class="w-full rounded-xl py-6 font-medium shadow-sm hover:opacity-90 transition-all duration-300 ease-in-out">Publicar</Button>
                  </div>
                </div>
              </div>

              <!-- Messages Carousel -->
              <Carousel v-if="messages.length > 0" class="w-full relative cursor-grab active:cursor-grabbing pb-10"
                :opts="{ align: 'center', dragFree: true, loop: true }" :plugins="carouselPlugins">
                <CarouselContent class="py-2">
                  <CarouselItem v-for="(msg, index) in messages" :key="msg.$id"
                    class="basis-full md:basis-[672px] min-w-0 max-w-full">
                    <div
                      class="h-full w-full max-w-full p-6 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col gap-6"
                      :class="index % 2 === 0 ? 'bg-white border border-slate-100/80' : 'bg-primary border border-transparent'">
                      <div class="flex justify-between items-center gap-4 z-10 w-full max-w-full">
                        <!-- Quote icon -->
                        <svg class="w-8 h-8 shrink-0" :class="index % 2 === 0 ? 'text-primary/20' : 'text-white/20'"
                          fill="currentColor" viewBox="0 0 24 24">
                          <path
                            d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                        </svg>

                        <!-- Likes -->
                        <div class="flex items-center justify-center gap-2">
                          <Button variant="ghost" @click="toggleLike(msg)"
                            class="!p-0.5 transition-all duration-300 rounded-full hover:scale-125 active:scale-90"
                            :class="[
                              index % 2 === 0
                                ? 'text-slate-300 hover:text-red-500'
                                : 'text-white/50 hover:text-white',
                              msg.likes?.includes(authStore.guest?.$id || '') ? 'text-red-500 scale-100' : ''
                            ]">
                            <svg class="w-6 h-6 transition-all duration-300"
                              :fill="msg.likes?.includes(authStore.guest?.$id || '') ? 'currentColor' : 'none'"
                              stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </Button>

                          <span class="text-sm font-medium tabular-nums"
                            :class="index % 2 === 0 ? 'text-slate-500' : 'text-white/80'">
                            {{ msg.likes?.length || 0 }}
                          </span>
                        </div>
                      </div>

                      <p class="reveal-text font-serif italic leading-relaxed text-lg z-10 whitespace-pre-wrap break-words w-full min-w-0 max-w-full"
                        :class="index % 2 === 0 ? 'text-slate-600' : 'text-white/90'" v-html="msg.content" />

                      <div
                        class="flex items-center justify-between mt-auto pt-6 border-t z-10 w-full max-w-full min-w-0">
                        <div class="flex items-center gap-4 w-full"
                          :class="index % 2 === 0 ? 'border-slate-50' : 'border-white/20'">
                          <img v-if="msg.guest.photo_url" :src="msg.guest.photo_url"
                            class="w-12 h-12 shrink-0 rounded-full border-2 shadow-sm"
                            :class="index % 2 === 0 ? 'border-slate-50' : 'border-white/20'" />
                          <div v-else
                            class="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-sm font-bold border-2"
                            :class="index % 2 === 0 ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white/10 border-white/20 text-white'">
                            {{ msg.guest.name?.charAt(0).toUpperCase() }}
                          </div>
                          <div class="flex flex-col min-w-0">
                            <p class="text-sm font-medium tracking-wide truncate"
                              :class="index % 2 === 0 ? 'text-slate-900' : 'text-white'">{{ msg.guest.name }}</p>
                            <p class="text-xs font-light mt-0.5 truncate"
                              :class="index % 2 === 0 ? 'text-slate-400' : 'text-white/70'">{{
                                dayjs(msg.$createdAt).format('DD [de] MMMM [de] YYYY') }}</p>
                          </div>
                        </div>
                        <!-- Delete button -->
                        <Button v-if="currentUser && (currentUser.$id === msg.guest.$id)"
                          @click="deleteMessage(msg.$id)"
                          class="transition-colors p-2 -mt-2 -mr-2 rounded-full focus:opacity-100"
                          :class="index % 2 === 0 ? 'text-slate-300 hover:text-red-500 hover:bg-red-50' : 'text-white/50 hover:text-white hover:bg-white/10'"
                          title="Apagar mensagem">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
            </div>
          </section>

        </div>
      </div>
      <div v-else class="text-center p-20 space-y-4">
        <h2 class="text-2xl font-serif text-slate-800">Página não encontrada</h2>
        <p class="text-slate-500 max-w-md mx-auto">
          O link de casamento que você tentou acessar não existe ou ainda não foi configurado pelos noivos.
        </p>
        <router-link to="/" class="inline-block text-primary font-medium hover:underline pt-2">
          Voltar para o início
        </router-link>
      </div>
    </div>

    <!-- PIX Modal -->
    <Modal v-model:open="showPixModal"
      :title="selectedProduct?.type === 'quota' ? 'Pagamento da Cota PIX' : 'Presentear com Valor (PIX)'">
      <div v-if="selectedProduct" class="space-y-6 text-center">
        <p class="text-slate-600">Escaneie o QR Code abaixo para presentear <strong>{{ tenant?.couple_name }}</strong>.
        </p>

        <div class="flex justify-center bg-white p-4 rounded-xl border">
          <qrcode-svg :value="pixPayload" :size="200" level="H" />
        </div>

        <div class="space-y-2">
          <p class="text-xl font-bold text-slate-900">
            {{ selectedProduct.type === 'quota' ? (quotaQuantities[selectedProduct.$id] || 1) :
              (Number(selectedProduct.base_price) || 0) }}
          </p>
          <p class="text-sm text-slate-500">{{ selectedProduct.name }} <span
              v-if="selectedProduct.type === 'quota' && (quotaQuantities[selectedProduct.$id] || 1) > 1">(({{
                quotaQuantities[selectedProduct.$id] }} cotas)</span></p>
        </div>

        <Button class="w-full" @click="copyPix">
          Copiar Chave PIX
        </Button>
      </div>
    </Modal>

    <!-- Store Links Modal -->
    <Modal v-model:open="showLinksModal" :title="`Onde comprar: ${selectedProduct?.name}`">
      <div class="space-y-4">
        <a v-for="(link, i) in selectedProduct?.links" :key="i" :href="link.url" target="_blank"
          class="block w-full text-center p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 transition-all group">
          <span class="font-medium text-slate-700 group-hover:text-primary transition-colors">Visitar Loja {{ i + 1
            }}</span>
        </a>
      </div>
    </Modal>

  </main>
</template>
