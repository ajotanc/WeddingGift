<script setup lang="ts">
import CountdownTimer from '@/components/ui/CountdownTimer.vue'
import { useTenant } from '@/composables/useTenant'
import { addDoc, collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { vMaska } from 'maska/vue'
import QrcodeVue from 'qrcode.vue'
import { computed, ref, watch } from 'vue'
import { LogOut } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Dialog from '@/components/ui/Dialog.vue'
import Input from '@/components/ui/Input.vue'
import FormGroup from '@/components/ui/FormGroup.vue'
import GoogleAuthButton from '@/components/ui/GoogleAuthButton.vue'
import LeafletMap from '@/components/ui/LeafletMap.vue'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Combobox from '@/components/ui/Combobox.vue'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { CheckCircle2, Heart, ExternalLink, Calendar, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { auth, db } from '@/firebase'
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import type { Message, Product } from '@/types'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useToast } from '@/components/ui/toast/use-toast'

dayjs.locale('pt-br')

const { toast } = useToast()
const { tenant, loading, error, headerStyle, pageStyle } = useTenant()

const products = ref<Product[]>([])
const messages = ref<Message[]>([])
const currentUser = ref<User | null>(null)

auth.onAuthStateChanged((user) => {
  currentUser.value = user
})

const requireAuth = async (): Promise<boolean> => {
  if (currentUser.value) return true
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)

    // Save to guests if not exists (simplified logic)
    const qGuest = query(collection(db, 'guests'), where('email', '==', result.user.email))
    const snapGuest = await getDocs(qGuest)
    if (snapGuest.empty) {
      await addDoc(collection(db, 'guests'), {
        id: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: Date.now(),
      })
    }
    return true
  } catch (err) {
    console.error('Erro na autenticação', err)
    return false
  }
}

const logout = async () => {
  await signOut(auth)
}

const loadPublicData = async () => {
  if (!tenant.value) return
  const qProducts = query(collection(db, 'products'), where('tenantId', '==', tenant.value.id))
  const snapProducts = await getDocs(qProducts)
  products.value = snapProducts.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)

  const qMessages = query(collection(db, 'messages'), where('tenantId', '==', tenant.value.id))
  const snapMessages = await getDocs(qMessages)
  messages.value = snapMessages.docs.map((d) => ({ id: d.id, ...d.data() }) as Message).sort((a, b) => b.createdAt - a.createdAt)
}


watch(tenant, (newTenant) => {
  if (newTenant) loadPublicData()
}, { immediate: true })

// Pagination & Filtering Logic
const categories = computed(() => {
  const cats = products.value.map(p => p.category).filter(Boolean) as string[]
  return [...new Set(cats)].sort()
})

const selectedCategory = ref('all')
const currentPage = ref(1)
const itemsPerPage = ref(6)

watch(selectedCategory, () => {
  currentPage.value = 1
})
watch(itemsPerPage, () => {
  currentPage.value = 1
})

const filteredProducts = computed(() => {
  if (selectedCategory.value === 'all') return products.value
  return products.value.filter(p => p.category === selectedCategory.value)
})

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage.value))

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredProducts.value.slice(start, end)
})

// Modals State
const showPixModal = ref(false)
const showLinksModal = ref(false)
const selectedProduct = ref<Product | null>(null)

const quotaQuantities = ref<Record<string, number>>({})

const pixPayload = computed(() => {
  if (!tenant.value || !selectedProduct.value) return ''
  const baseValue = selectedProduct.value.type === 'quota' 
    ? (selectedProduct.value.fixedQuotaValue || 0) * (quotaQuantities.value[selectedProduct.value.id] || 1) 
    : (selectedProduct.value.basePrice || 0)
    
  return `00020101021126360014br.gov.bcb.pix0114${tenant.value.pixKey}5204000053039865405${baseValue.toFixed(2)}5802BR5910${tenant.value.coupleName.substring(0, 25).padEnd(25, ' ')}6009SAO PAULO62070503***6304`
})

const openPixModal = async (product: Product) => {
  if (!currentUser.value) return
  selectedProduct.value = product
  showPixModal.value = true
}

const openLinksModal = async (product: Product) => {
  if (!currentUser.value) return
  if (product.links && product.links.length > 0) {
    selectedProduct.value = product
    showLinksModal.value = true
  }
}

const copyPix = () => {
  if (!tenant.value?.pixKey) return
  navigator.clipboard.writeText(tenant.value.pixKey)
  toast({ title: 'Sucesso', description: 'Chave PIX copiada para a área de transferência!' })
}

// RSVP Validation Schema
const rsvpSchema = toTypedSchema(
  z.object({
    guestName: z.string().min(3, 'Nome muito curto'),
    email: z.string().email('E-mail inválido'),
    phone: z.string().min(14, 'Telefone inválido'),
    totalAdults: z.number().min(1, 'No mínimo 1 adulto'),
    totalChildren: z.number().min(0),
    status: z.enum(['confirmed', 'declined'])
  })
)

const { handleSubmit, errors } = useForm({
  validationSchema: rsvpSchema,
  initialValues: {
    guestName: '',
    email: '',
    phone: '',
    totalAdults: 1,
    totalChildren: 0,
    status: 'confirmed'
  }
})

const { value: guestName } = useField<string>('guestName')
const { value: email } = useField<string>('email')
const { value: phone } = useField<string>('phone')
const { value: totalAdults } = useField<number>('totalAdults')
const { value: totalChildren } = useField<number>('totalChildren')
const { value: status } = useField<'confirmed' | 'declined'>('status')

watch(currentUser, (user) => {
  if (user) {
    if (!guestName.value) guestName.value = user.displayName || ''
    if (!email.value) email.value = user.email || ''
    if (!phone.value && user.phoneNumber) phone.value = user.phoneNumber
  }
})

const rsvpLoading = ref(false)
const showRsvpModal = ref(false)

const submitRsvp = handleSubmit(async (values) => {
  if (!tenant.value) return
  rsvpLoading.value = true
  try {
    await addDoc(collection(db, 'rsvp'), {
      tenantId: tenant.value.id,
      ...values,
      confirmedAt: Date.now()
    })
    guestName.value = ''
    email.value = ''
    phone.value = ''
    totalAdults.value = 1
    totalChildren.value = 0
    showRsvpModal.value = false
    toast({ title: 'Sucesso', description: 'Sua resposta foi enviada com sucesso! Obrigado.' })
  } catch (err) {
    toast({ title: 'Erro', description: 'Houve um erro ao enviar sua resposta. Tente novamente.', variant: 'destructive' })
  } finally {
    rsvpLoading.value = false
  }
})

// Emotional Messages
const messageContent = ref('')
const submitMessage = async () => {
  if (!tenant.value || !messageContent.value.trim() || !currentUser.value) return
  
  try {
    const newMsg = {
      tenantId: tenant.value.id,
      guestName: currentUser.value.displayName || 'Convidado',
      photoURL: currentUser.value?.photoURL || '',
      content: messageContent.value,
      createdAt: Date.now(),
    }
    const docRef = await addDoc(collection(db, 'messages'), newMsg)
    
    // Add instantly to UI array without fetching
    messages.value.unshift({ id: docRef.id, ...newMsg })
    
    messageContent.value = ''
    toast({ title: 'Sucesso', description: 'Sua mensagem foi enviada!' })
  } catch (err) {
    toast({ title: 'Erro', description: 'Erro ao enviar mensagem.', variant: 'destructive' })
  }
}

const deleteMessage = async (msgId: string) => {
  if (!confirm('Deseja realmente apagar esta mensagem?')) return
  try {
    await deleteDoc(doc(db, 'messages', msgId))
    messages.value = messages.value.filter(m => m.id !== msgId)
    toast({ title: 'Sucesso', description: 'Mensagem apagada com sucesso.' })
  } catch (err) {
    toast({ title: 'Erro', description: 'Erro ao apagar mensagem.', variant: 'destructive' })
  }
}
</script>

<template>
  <main class="min-h-screen bg-zinc-50 font-sans text-slate-600">
    <div class="min-h-screen">
      <div v-if="loading" class="flex justify-center p-20 text-slate-400 font-light tracking-wide animate-pulse">Carregando experiência...</div>
      <div v-else-if="error" class="text-center p-20 text-red-500 font-medium">{{ error }}</div>
      <div v-else-if="tenant">
        
        <!-- Header Hero -->
        <!-- Header Hero -->
        <header :style="{ backgroundColor: tenant?.theme?.dashboardHeaderBgColor || 'transparent' }" class="relative py-32 px-6 text-center overflow-hidden">
          
          <!-- Background Image Layer -->
          <div v-if="tenant?.theme?.backgroundImageUrl" class="absolute inset-0 bg-cover bg-center" :style="{ backgroundImage: `url(${tenant.theme.backgroundImageUrl})` }"></div>

          <!-- Blur Overlay Layer (Smooth fade to zinc-50 at bottom) -->
          <div class="absolute inset-0 bg-white/20"></div>
          <div class="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-50/80 to-zinc-50 backdrop-blur-md [mask-image:linear-gradient(to_bottom,transparent_30%,black_100%)]"></div>

          <div class="absolute top-0 left-0 w-full p-4 flex justify-end z-20">
            <GoogleAuthButton 
              @click="requireAuth" 
              @logout="logout" 
              :user="currentUser" 
              :fill="false" 
              :themeColor="tenant?.theme?.primaryColor" 
            />
          </div>

          <div class="relative max-w-4xl mx-auto z-10">
            <div class="w-16 h-px bg-primary/40 mx-auto mb-10"></div>
            <h1 class="text-5xl md:text-7xl font-serif text-slate-900 mb-8 tracking-tight">{{ tenant.coupleName }}</h1>
            <p class="text-sm md:text-base text-slate-500 font-light tracking-[0.2em] uppercase">Lista de Presentes & RSVP</p>
            <!-- Event Date & Time Display -->
            <div v-if="tenant.eventDate" class="mt-4 text-slate-600 font-medium text-lg">
              {{ dayjs(tenant.eventDate).format('DD/MM/YYYY') }} às {{ tenant.eventTime }}
            </div>
            
            <!-- Countdown -->
            <div v-if="tenant.eventDate && tenant.settings?.showCountdown !== false" class="mt-6">
              <CountdownTimer :eventDate="tenant.eventDate" />
            </div>
            <div class="w-16 h-px bg-primary/40 mx-auto mt-10"></div>
          </div>
        </header>

        <div class="max-w-5xl mx-auto p-6 md:p-12 lg:py-32 space-y-24 md:space-y-32">
          
          <!-- Couple History -->
          <section v-if="tenant.coupleHistory" class="text-center max-w-3xl mx-auto">
            <h2 class="text-3xl font-serif text-slate-900 mb-8">Nossa História</h2>
            <div class="text-slate-600 font-light text-lg leading-relaxed text-left quill-content" v-html="tenant.coupleHistory"></div>
          </section>

          <!-- Event Location Map -->
          <section v-if="tenant.eventLocation" class="text-center">
            <h2 class="text-3xl font-serif text-slate-900 mb-6">Local do Evento</h2>
            <div class="bg-white p-2 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80">
              <LeafletMap :address="tenant.eventLocation" />
            </div>
            <p class="text-slate-500 font-medium mt-4">{{ tenant.eventLocation }}</p>
          </section>

          <!-- Products -->
          <section>
            <div class="text-center mb-16">
              <h2 class="text-3xl font-serif text-slate-900 mb-6">Nossa Lista</h2>
              <p class="text-slate-500 font-light max-w-xl mx-auto text-lg leading-relaxed">Com muito carinho, selecionamos alguns itens e experiências. Fique à vontade para nos presentear com o que tocar o seu coração.</p>
            </div>

            <!-- Category Filter (Combobox) -->
            <div v-if="categories.length > 0" class="flex justify-center mb-12">
              <div class="w-full max-w-sm">
                <Combobox
                  v-model="selectedCategory"
                  :options="[{label: 'Todas as Categorias', value: 'all'}, ...categories.map(c => ({label: c, value: c}))]"
                  placeholder="Filtrar por categoria..."
                  emptyText="Nenhuma categoria encontrada."
                />
              </div>
            </div>

            <div v-if="paginatedProducts.length === 0" class="text-center py-20 text-slate-400">
              Nenhum presente encontrado nesta categoria.
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <Card v-for="product in paginatedProducts" :key="product.id" class="flex flex-col overflow-hidden border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl transition-all hover:-translate-y-1 hover:shadow-md duration-300 bg-white group p-6">
                <div v-if="product.type === 'physical' && (product.imageUrl || product.links?.[0]?.thumbnail)" class="bg-slate-100/60 p-6 rounded-xl aspect-square flex items-center justify-center">
                  <img :src="product.imageUrl || product.links?.[0]?.thumbnail" alt="Produto" class="max-h-full object-contain mix-blend-multiply drop-shadow-sm transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div v-else class="bg-slate-100/60 p-6 rounded-xl aspect-square flex flex-col items-center justify-center">
                  <span class="text-primary/60 font-serif text-3xl mb-2 italic">{{product.category}}</span>
                  <span class="text-slate-700 text-center font-medium px-4 text-sm">{{ product.name }}</span>
                </div>
                
                <div class="flex flex-col flex-1 pt-3">
                  <div class="mb-2 flex items-center gap-2 flex-wrap">
                    <span v-if="product.category" class="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest">{{ product.category }}</span>
                    <template v-if="product.type === 'quota'">
                      <span class="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest" :style="{ color: tenant?.theme?.primaryColor, backgroundColor: (tenant?.theme?.primaryColor || '#000000') + '1a' }">Cota</span>
                      <span class="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest">{{ product.claimedQuantity || 0 }}/{{ product.desiredQuantity }}</span>
                    </template>
                    <template v-else>
<span class="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest" :style="{ color: tenant?.theme?.primaryColor, backgroundColor: (tenant?.theme?.primaryColor || '#000000') + '1a' }">{{ (product.desiredQuantity && product.desiredQuantity === 1 ? 'Único Produto' : `${product.claimedQuantity || 0}/${product.desiredQuantity}`) }}</span>
                    </template>
                  </div>
                  <h3 class="font-serif text-slate-900 text-xl mb-2 leading-snug">{{ product.name }}</h3>
                  <div class="mt-auto pt-2">
                    <p v-if="product.type === 'quota'" class="text-primary font-semibold text-2xl mb-4 flex items-center flex-wrap gap-2">
                      R$ {{ product.fixedQuotaValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
                    </p>
                    <p v-else class="text-primary font-semibold text-2xl mb-4 flex items-center flex-wrap gap-2">
                      R$ {{ product.basePrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
                    </p>
                    
                    <div v-if="currentUser" class="flex flex-col gap-2">
                      <template v-if="product.type === 'quota'">
                        <div class="flex items-center gap-2">
                          <Button variant="outline" class="w-12 h-12 p-0 rounded-xl shrink-0 border-slate-200 shadow-sm bg-slate-50/50 hover:bg-slate-100" @click="quotaQuantities[product.id] = Math.max(1, (quotaQuantities[product.id] || 1) - 1)">-</Button>
                          <Input 
                            type="number" 
                            min="1" 
                            :max="Math.max(1, (product.desiredQuantity || 99) - (product.claimedQuantity || 0))"
                            class="text-center rounded-xl h-12 border-slate-200 shadow-sm bg-slate-50/50 font-medium flex-1 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                            :model-value="quotaQuantities[product.id] || 1"
                            @update:model-value="val => quotaQuantities[product.id] = Math.max(1, Math.min((product.desiredQuantity || 99) - (product.claimedQuantity || 0), Number(val)))"
                          />
                          <Button variant="outline" class="w-12 h-12 p-0 rounded-xl shrink-0 border-slate-200 shadow-sm bg-slate-50/50 hover:bg-slate-100" @click="quotaQuantities[product.id] = Math.min((product.desiredQuantity || 99) - (product.claimedQuantity || 0), (quotaQuantities[product.id] || 1) + 1)">+</Button>
                        </div>
                        <Button class="w-full rounded-xl py-4 font-medium shadow-sm hover:shadow-md transition-all" @click="openPixModal(product)">
                          Presentear com PIX
                        </Button>
                      </template>
                      <template v-else-if="product.type === 'physical'">
                        <Button v-if="product.links && product.links.length > 0" variant="outline" class="w-full rounded-xl py-4 border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors" @click="openLinksModal(product)">
                          Comprar na Loja
                        </Button>
                        <Button v-if="product.basePrice" class="w-full rounded-xl py-4 font-medium shadow-sm hover:opacity-90 transition-all duration-300 ease-in-out" @click="openPixModal(product)">
                          Presentear via PIX
                        </Button>
                      </template>
                    </div>
                    <div v-else class="text-center p-5 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col gap-4">
                      <p class="text-slate-500 font-light text-sm">Faça login com sua conta Google para presentear.</p>
                      <GoogleAuthButton @click="requireAuth" :fill="true" :themeColor="tenant?.theme?.primaryColor" class="mx-auto w-full" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div class="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-slate-600 whitespace-nowrap">Itens por página</span>
                <Select :model-value="itemsPerPage.toString()" @update:model-value="(val) => itemsPerPage = parseInt(val, 10)">
                  <SelectTrigger class="w-[90px] h-10 rounded-xl border-slate-200 bg-white shadow-sm focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent class="bg-white rounded-xl border-slate-200 shadow-xl z-50">
                    <SelectGroup>
                      <SelectItem value="6" class="rounded-lg cursor-pointer">6</SelectItem>
                      <SelectItem value="12" class="rounded-lg cursor-pointer">12</SelectItem>
                      <SelectItem value="24" class="rounded-lg cursor-pointer">24</SelectItem>
                      <SelectItem value="48" class="rounded-lg cursor-pointer">48</SelectItem>
                      <SelectItem value="100" class="rounded-lg cursor-pointer">100</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <!-- Pagination -->
              <Pagination v-slot="{ page }" :total="filteredProducts.length" :sibling-count="1" show-edges :default-page="1" v-model:page="currentPage" :items-per-page="itemsPerPage" class="w-auto mx-0 flex-none">
                <PaginationContent v-slot="{ items }" class="gap-2">
                  <PaginationFirst size="icon" class="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-primary hover:border-primary hover:bg-slate-50 transition-all cursor-pointer" @click="currentPage = 1">
                    <ChevronsLeft class="w-5 h-5" />
                  </PaginationFirst>

                  <PaginationPrevious size="icon" class="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-primary hover:border-primary hover:bg-slate-50 transition-all cursor-pointer" @click="currentPage = Math.max(1, currentPage - 1)">
                    <ChevronLeft class="w-5 h-5" />
                  </PaginationPrevious>

                  <template v-for="(item, index) in items">
                    <PaginationItem v-if="item.type === 'page'" :key="index" :value="item.value" :is-active="item.value === page" class="w-10 h-10 rounded-xl transition-all font-medium cursor-pointer" :class="item.value === page ? 'shadow-md scale-105 bg-primary text-white border-transparent hover:opacity-90' : 'border border-slate-200 bg-white text-slate-500 hover:text-primary hover:border-primary hover:bg-slate-50'" @click="currentPage = item.value">
                      {{ item.value }}
                    </PaginationItem>
                    <PaginationEllipsis v-else :key="item.type" :index="index" class="text-slate-400" />
                  </template>

                  <PaginationNext size="icon" class="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-primary hover:border-primary hover:bg-slate-50 transition-all cursor-pointer" @click="currentPage = Math.min(totalPages, currentPage + 1)">
                    <ChevronRight class="w-5 h-5" />
                  </PaginationNext>

                  <PaginationLast size="icon" class="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-primary hover:border-primary hover:bg-slate-50 transition-all cursor-pointer" @click="currentPage = totalPages">
                    <ChevronsRight class="w-5 h-5" />
                  </PaginationLast>
                </PaginationContent>
              </Pagination>
            </div>
          </section>

          <!-- RSVP & Message Wall (2-column grid) -->
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
            
            <!-- RSVP Column -->
            <div class="lg:col-span-7 space-y-10">
              <div class="mb-6">
                <h2 class="text-3xl font-serif text-slate-900 mb-4 tracking-tight">Confirme sua Presença</h2>
                <p class="text-slate-500 font-light leading-relaxed">Ficaremos imensamente felizes em celebrar esse momento único com você. Por favor, confirme abaixo.</p>
              </div>
              
              <form @submit.prevent="submitRsvp" class="space-y-6 bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80">
                <div class="space-y-5">
                  <FormGroup label="Nome Completo" :error="errors.guestName">
                    <Input v-model="guestName" placeholder="Seu nome" class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20 bg-slate-50/50 h-12" />
                  </FormGroup>
                  <FormGroup label="E-mail" :error="errors.email">
                    <Input v-model="email" type="email" placeholder="Seu e-mail" class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20 bg-slate-50/50 h-12" />
                  </FormGroup>
                  <FormGroup label="Telefone / WhatsApp" :error="errors.phone">
                    <Input v-model="phone" v-maska="'(##) #####-####'" type="tel" placeholder="(11) 99999-9999" class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20 bg-slate-50/50 h-12" />
                  </FormGroup>
                  <div class="grid grid-cols-2 gap-5">
                    <FormGroup label="Adultos" :error="errors.totalAdults">
                      <Input v-model.number="totalAdults" type="number" min="0" class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20 bg-slate-50/50 h-12" />
                    </FormGroup>
                    <FormGroup label="Crianças" :error="errors.totalChildren">
                      <Input v-model.number="totalChildren" type="number" min="0" class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20 bg-slate-50/50 h-12" />
                    </FormGroup>
                  </div>
                  <FormGroup label="Você irá ao evento?">
                    <Select v-model="status">
                      <SelectTrigger class="w-full h-12 bg-slate-50/50 border-slate-200 rounded-xl text-base">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent class="bg-white">
                        <SelectGroup>
                          <SelectItem value="confirmed">Sim, estarei lá!</SelectItem>
                          <SelectItem value="declined">Não poderei ir</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormGroup>
                </div>
                <Button type="submit" class="w-full rounded-xl py-6 font-medium shadow-sm hover:opacity-90 transition-all duration-300 ease-in-out" :disabled="rsvpLoading">
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
              
              <div class="bg-white p-6 rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] mb-10 transition-shadow duration-300 hover:shadow-md">
                <div v-if="!currentUser" class="text-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <p class="text-slate-500 mb-4">Faça login com sua conta Google para deixar um recado especial.</p>
                  <GoogleAuthButton @click="requireAuth" :fill="true" :themeColor="tenant?.theme?.primaryColor" class="mx-auto" />
                </div>
                <div v-else>
                  <textarea 
                    v-model="messageContent" 
                    class="w-full h-32 p-2 border-none bg-transparent focus:outline-none resize-none text-slate-700 font-sans font-light placeholder:text-slate-400 text-lg"
                    placeholder="Escreva algo especial aqui..."
                  ></textarea>
                  <div class="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-slate-50 gap-4">
                    <div class="flex items-center gap-2">
                      <img v-if="currentUser.photoURL" :src="currentUser.photoURL" class="w-6 h-6 rounded-full" />
                      <span class="text-xs text-slate-400 font-light">Publicando como <strong>{{ currentUser.displayName }}</strong></span>
                    </div>
                    <Button @click="submitMessage" :disabled="!messageContent" class="w-full rounded-xl py-6 font-medium shadow-sm hover:opacity-90 transition-all duration-300 ease-in-out">Publicar</Button>
                  </div>
                </div>
              </div>

              <!-- Messages Carousel -->
              <Carousel v-if="messages.length > 0" class="w-full relative cursor-grab active:cursor-grabbing pb-10" :opts="{ align: 'center', dragFree: true, loop: true }" :plugins="[Autoplay({ delay: 4000, stopOnInteraction: true })]">
                <CarouselContent class="py-2">
                  <CarouselItem v-for="(msg, index) in messages" :key="msg.id" class="basis-full md:basis-[672px] min-w-0 max-w-full">
                    <div 
                      class="h-full w-full max-w-full p-6 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col gap-6"
                      :class="index % 2 === 0 ? 'bg-white border border-slate-100/80' : 'bg-primary border border-transparent'"
                    >
                      <div class="flex justify-between items-start gap-4 z-10 w-full max-w-full">
                        <!-- Quote icon -->
                        <svg class="w-8 h-8 shrink-0" :class="index % 2 === 0 ? 'text-primary/20' : 'text-white/20'" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>

                        <!-- Delete button -->
                        <button v-if="currentUser && (currentUser.uid === msg.guestId || currentUser.uid === tenant?.id)" @click="deleteMessage(msg.id)" 
                          class="transition-colors p-2 -mt-2 -mr-2 rounded-full focus:opacity-100" 
                          :class="index % 2 === 0 ? 'text-slate-300 hover:text-red-500 hover:bg-red-50' : 'text-white/50 hover:text-white hover:bg-white/10'"
                          title="Apagar mensagem">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>

                      <p class="font-serif italic leading-relaxed text-lg z-10 whitespace-pre-wrap break-words w-full min-w-0 max-w-full" :class="index % 2 === 0 ? 'text-slate-600' : 'text-white/90'">"{{ msg.content }}"</p>
                      
                      <div class="flex items-center gap-4 mt-auto pt-6 border-t z-10 w-full max-w-full min-w-0" :class="index % 2 === 0 ? 'border-slate-50' : 'border-white/20'">
                        <img v-if="msg.photoURL" :src="msg.photoURL" class="w-12 h-12 shrink-0 rounded-full border-2 shadow-sm" :class="index % 2 === 0 ? 'border-slate-50' : 'border-white/20'" />
                        <div v-else class="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-sm font-bold border-2" :class="index % 2 === 0 ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white/10 border-white/20 text-white'">
                          {{ msg.guestName?.charAt(0).toUpperCase() }}
                        </div>
                        <div class="flex flex-col min-w-0">
                          <p class="text-sm font-medium tracking-wide truncate" :class="index % 2 === 0 ? 'text-slate-900' : 'text-white'">{{ msg.guestName }}</p>
                          <p class="text-xs font-light mt-0.5 truncate" :class="index % 2 === 0 ? 'text-slate-400' : 'text-white/70'">{{ dayjs(msg.createdAt).format('DD [de] MMMM [de] YYYY') }}</p>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
            </div>
          </section>

        </div>
      </div>
    </div>

    <!-- PIX Modal -->
    <Dialog v-model:open="showPixModal" :title="selectedProduct?.type === 'quota' ? 'Pagamento da Cota PIX' : 'Presentear com Valor (PIX)'">
      <div v-if="selectedProduct" class="space-y-6 text-center">
        <p class="text-slate-600">Escaneie o QR Code abaixo para presentear <strong>{{ tenant?.coupleName }}</strong>.</p>
        
        <div class="flex justify-center bg-white p-4 rounded-xl inline-block border">
          <qrcode-vue :value="pixPayload" :size="200" level="H" />
        </div>

        <div class="space-y-2">
          <p class="text-xl font-bold text-slate-900">
            R$ {{ (selectedProduct.type === 'quota' ? (selectedProduct.fixedQuotaValue || 0) * (quotaQuantities[selectedProduct.id] || 1) : (selectedProduct.basePrice || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
          </p>
          <p class="text-sm text-slate-500">{{ selectedProduct.name }} <span v-if="selectedProduct.type === 'quota' && (quotaQuantities[selectedProduct.id] || 1) > 1">({{ quotaQuantities[selectedProduct.id] }} cotas)</span></p>
        </div>

        <Button class="w-full" @click="copyPix">
          Copiar Chave PIX
        </Button>
      </div>
    </Dialog>

    <!-- Store Links Modal -->
    <Dialog v-model:open="showLinksModal" :title="`Onde comprar: ${selectedProduct?.name}`">
      <div class="space-y-4">
        <a v-for="(link, i) in selectedProduct?.links" :key="i" :href="link.url" target="_blank" class="block w-full text-center p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 transition-all group">
          <span class="font-medium text-slate-700 group-hover:text-primary transition-colors">Visitar Loja {{ i + 1 }}</span>
        </a>
      </div>
    </Dialog>

  </main>
</template>
