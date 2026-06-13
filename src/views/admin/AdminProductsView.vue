<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTenant } from '@/composables/useTenant'
import { listProducts, createProduct, updateProduct, deleteProduct as deleteProductService, type IProductHydrated, type IProductLink } from '@/services/product.service'
import type { SerperItem } from '@/types'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Dialog from '@/components/ui/Dialog.vue'
import Input from '@/components/ui/Input.vue'
import Progress from '@/components/ui/Progress.vue'
import FormGroup from '@/components/ui/FormGroup.vue'
import Combobox from '@/components/ui/Combobox.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { Wallet, Sparkles, UploadCloud, X, Edit2, Trash2, Search, ExternalLink, Plus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency, parseCurrency } from '@brazilian-utils/brazilian-utils'

const { toast } = useToast()
const { tenant } = useTenant()
const authStore = useAuthStore()

const products = ref<IProductHydrated[]>([])

// Metrics
const totalProjected = computed(() => {
  return products.value.reduce((acc, p) => acc + (Number(p.total_value) || 0), 0)
})

const totalRaised = computed(() => {
  return products.value.reduce(
    (acc, p) => acc + (p.claimed_quantity || 0) * (Number(p.fixed_quota_value) || 0),
    0,
  )
})

const progressPercentage = computed(() => {
  if (totalProjected.value === 0) return 0
  return Math.min(100, Math.round((totalRaised.value / totalProjected.value) * 100))
})

const loadProducts = async () => {
  if (!tenant.value) return
  products.value = await listProducts(tenant.value.$id)
}

watch(tenant, (newTenant) => {
  if (newTenant) loadProducts()
}, { immediate: true })

const PREDEFINED_CATEGORIES = [
  'Cozinha',
  'Decoração',
  'Eletrônicos',
  'Cama, Mesa e Banho',
  'Eletrodomésticos',
  'Viagem',
  'Experiências',
  'Móveis'
]

const categoryOptions = computed(() => {
  return [
    ...PREDEFINED_CATEGORIES.map(c => ({ label: c, value: c })),
    { label: 'Outro', value: 'Outro' }
  ]
})

const KNOWN_STORES = [
  { key: 'amazon', name: 'Amazon' },
  { key: 'mercadolivre', name: 'Mercado Livre' },
  { key: 'mercadopago', name: 'Mercado Pago' },
  { key: 'magazineluiza', name: 'Magazine Luiza' },
  { key: 'magalu', name: 'Magazine Luiza' },
  { key: 'americanas', name: 'Americanas' },
  { key: 'submarino', name: 'Submarino' },
  { key: 'shoptime', name: 'Shoptime' },
  { key: 'casasbahia', name: 'Casas Bahia' },
  { key: 'pontofrio', name: 'Ponto Frio' },
  { key: 'extra', name: 'Extra' },
  { key: 'fastshop', name: 'Fast Shop' },
  { key: 'carrefour', name: 'Carrefour' },
  { key: 'electrolux', name: 'Electrolux' },
  { key: 'brastemp', name: 'Brastemp' },
  { key: 'consul', name: 'Consul' },
  { key: 'samsung', name: 'Samsung' },
  { key: 'lg', name: 'LG' },
  { key: 'polishop', name: 'Polishop' },
  { key: 'kabum', name: 'KaBuM!' },
  { key: 'pichau', name: 'Pichau' },
  { key: 'terabyte', name: 'Terabyte' },
  { key: 'camicado', name: 'Camicado' },
  { key: 'tokstok', name: 'Tok&Stok' },
  { key: 'leroymerlin', name: 'Leroy Merlin' },
  { key: 'shopee', name: 'Shopee' },
  { key: 'aliexpress', name: 'AliExpress' },
  { key: 'shein', name: 'Shein' }
]

const editProductId = ref<string | null>(null)

const moneyConfig = {
  decimal: ',',
  thousands: '.',
  prefix: '',
  suffix: '',
  precision: 2,
  masked: false
}

// Physical Product Form
const showPhysicalModal = ref(false)
const physicalForm = ref({
  name: '',
  basePrice: 0,
  desiredQuantity: 1,
  links: [] as IProductLink[],
  imageBase64: '',
  imageFile: null as File | null,
  categorySelect: '',
  categoryCustom: ''
})

const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    physicalForm.value.imageFile = file
    physicalForm.value.imageBase64 = URL.createObjectURL(file)
  }
}

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    physicalForm.value.imageFile = file
    physicalForm.value.imageBase64 = URL.createObjectURL(file)
  }
}

const triggerFileInput = () => {
  const fileInput = document.getElementById('file-upload') as HTMLInputElement
  if (fileInput) fileInput.click()
}

const removeImage = () => {
  physicalForm.value.imageBase64 = ''
  physicalForm.value.imageFile = null
}

const openNewPhysical = () => {
  editProductId.value = null
  physicalForm.value = { name: '', basePrice: 0, desiredQuantity: 1, links: [], imageBase64: '', imageFile: null, categorySelect: '', categoryCustom: '' }
  showPhysicalModal.value = true
}

const editPhysical = (p: IProductHydrated) => {
  editProductId.value = p.$id
  const isPredefined = p.category && PREDEFINED_CATEGORIES.includes(p.category)
  physicalForm.value = {
    name: p.name,
    basePrice: p.base_price ? parseFloat(String(p.base_price)) : 0,
    desiredQuantity: p.desired_quantity || 1,
    links: p?.links || [],
    imageBase64: p.image_url ?? '',
    imageFile: null,
    categorySelect: isPredefined ? (p.category || '') : (p.category ? 'Outro' : ''),
    categoryCustom: !isPredefined && p.category ? p.category : ''
  }
  showPhysicalModal.value = true
}

const physicalErrors = ref<Record<string, string>>({})
const quotaErrors = ref<Record<string, string>>({})

const isSearchingLinks = ref(false)
const searchResults = ref<SerperItem[]>([])

const searchExternalLinks = async () => {
  if (!physicalForm.value.name) {
    toast({ title: 'Aviso', description: 'Preencha o nome do produto para buscar os links.', variant: 'destructive' })
    return
  }
  isSearchingLinks.value = true
  searchResults.value = []

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': import.meta.env.VITE_SERPAPI_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: physicalForm.value.name, gl: 'br', hl: 'pt-br' })
    })

    const data = await response.json()
    if (data && data.organic && data.organic.length > 0) {
      searchResults.value = data.organic.map((item: any) => {
        let extractedSource = item.source || 'LOJA'
        if (item.link) {
          const lowerLink = item.link.toLowerCase()
          const knownStore = KNOWN_STORES.find(s => lowerLink.includes(s.key))
          
          if (knownStore) {
            extractedSource = knownStore.name
          } else {
            const match = item.link.match(/www\.([^.]+)\./)
            if (match && match[1]) {
              extractedSource = match[1].toUpperCase()
            } else {
               try {
                 const urlObj = new URL(item.link)
                 const hostnameParts = urlObj.hostname.replace('www.', '').split('.')
                 if (hostnameParts.length > 0) {
                   extractedSource = hostnameParts[0].toUpperCase()
                 }
               } catch(e) {}
            }
          }
        }
        return {
          ...item,
          source: extractedSource
        }
      })
    } else {
      toast({ title: 'Aviso', description: 'Nenhum link encontrado para este produto.', variant: 'default' })
    }
  } catch (err) {
    console.error(err)
    toast({ title: 'Erro', description: 'Falha ao buscar links. Verifique a conexão.', variant: 'destructive' })
  } finally {
    isSearchingLinks.value = false
  }
}

const addLinkToProduct = (item: SerperItem) => {
  physicalForm.value.links.push({
    store: item.source || 'Loja',
    url: item.link,
  } as IProductLink)
  // Optionally remove from search results so they don't add duplicates
  searchResults.value = searchResults.value.filter(res => res.link !== item.link)
  toast({ title: 'Adicionado', description: 'Link adicionado ao produto!' })
}

const removeLink = (index: number) => {
  physicalForm.value.links.splice(index, 1)
}

const createPhysicalProduct = async () => {
  if (!tenant.value || !authStore.user) return
  physicalErrors.value = {}
  let hasError = false

  if (!physicalForm.value.name) {
    physicalErrors.value.name = 'O nome do produto é obrigatório.'
    hasError = true
  }
  if (!physicalForm.value.basePrice || physicalForm.value.basePrice <= 0) {
    physicalErrors.value.basePrice = 'O valor deve ser maior que zero.'
    hasError = true
  }

  const finalCategory = physicalForm.value.categorySelect === 'Outro' ? physicalForm.value.categoryCustom : physicalForm.value.categorySelect

  if (!finalCategory) {
    physicalErrors.value.category = 'Selecione ou informe uma categoria.'
    hasError = true
  }

  if (hasError) return

  const payload: Partial<IProductHydrated> = {
    type: 'physical',
    name: physicalForm.value.name,
    base_price: String(physicalForm.value.basePrice),
    desired_quantity: physicalForm.value.desiredQuantity,
    links: physicalForm.value.links,
    image_url: physicalForm.value.imageBase64,
    category: finalCategory,
  }

  if (editProductId.value) {
    await updateProduct(authStore.user.$id, editProductId.value, payload, physicalForm.value.imageFile)
  } else {
    await createProduct(authStore.user.$id, tenant.value.$id, payload, physicalForm.value.imageFile)
  }
  toast({ title: 'Sucesso', description: 'Produto salvo com sucesso!' })
  showPhysicalModal.value = false
  await loadProducts()
}

// Quota Form
const showQuotaModal = ref(false)
const quotaForm = ref({
  name: '',
  totalValue: 0,
  desiredQuantity: 1,
  imageBase64: '',
  imageFile: null as File | null,
  categorySelect: '',
  categoryCustom: ''
})

const handleQuotaImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    quotaForm.value.imageFile = file
    quotaForm.value.imageBase64 = URL.createObjectURL(file)
  }
}

const handleQuotaDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    quotaForm.value.imageFile = file
    quotaForm.value.imageBase64 = URL.createObjectURL(file)
  }
}

const triggerQuotaFileInput = () => {
  const fileInput = document.getElementById('quota-file-upload') as HTMLInputElement
  if (fileInput) fileInput.click()
}

const removeQuotaImage = () => {
  quotaForm.value.imageBase64 = ''
  quotaForm.value.imageFile = null
}

const openNewQuota = () => {
  editProductId.value = null
  quotaForm.value = { name: '', totalValue: 0, desiredQuantity: 1, imageBase64: '', imageFile: null, categorySelect: '', categoryCustom: '' }
  showQuotaModal.value = true
}

const editQuota = (p: IProductHydrated) => {
  editProductId.value = p.$id
  const isPredefined = p.category && PREDEFINED_CATEGORIES.includes(p.category)
  quotaForm.value = {
    name: p.name,
    totalValue: p.total_value ? parseFloat(String(p.total_value)) : 0,
    desiredQuantity: p.desired_quantity || 1,
    imageBase64: p.image_url ?? '',
    imageFile: null,
    categorySelect: isPredefined ? (p.category || '') : (p.category ? 'Outro' : ''),
    categoryCustom: !isPredefined && p.category ? p.category : ''
  }
  showQuotaModal.value = true
}

const createQuotaProduct = async () => {
  if (!tenant.value || !authStore.user) return
  quotaErrors.value = {}
  let hasError = false

  if (!quotaForm.value.name) {
    quotaErrors.value.name = 'O nome da cota é obrigatório.'
    hasError = true
  }
  if (!quotaForm.value.totalValue || quotaForm.value.totalValue <= 0) {
    quotaErrors.value.totalValue = 'A meta total deve ser maior que zero.'
    hasError = true
  }
  if (!quotaForm.value.desiredQuantity || quotaForm.value.desiredQuantity <= 0) {
    quotaErrors.value.desiredQuantity = 'A quantidade deve ser maior que zero.'
    hasError = true
  }

  const finalCategory = quotaForm.value.categorySelect === 'Outro' ? quotaForm.value.categoryCustom : quotaForm.value.categorySelect

  if (!finalCategory) {
    quotaErrors.value.category = 'Selecione ou informe uma categoria.'
    hasError = true
  }

  if (hasError) return

  const payload: Partial<IProductHydrated> = {
    type: 'quota',
    name: quotaForm.value.name,
    total_value: String(quotaForm.value.totalValue),
    fixed_quota_value: String(quotaForm.value.totalValue / (quotaForm.value.desiredQuantity || 1)),
    desired_quantity: quotaForm.value.desiredQuantity,
    image_url: quotaForm.value.imageBase64,
    category: finalCategory,
  }

  if (editProductId.value) {
    await updateProduct(authStore.user.$id, editProductId.value, payload, quotaForm.value.imageFile)
  } else {
    await createProduct(authStore.user.$id, tenant.value.$id, payload, quotaForm.value.imageFile)
  }
  toast({ title: 'Sucesso', description: 'Cota salva com sucesso!' })
  showQuotaModal.value = false
  await loadProducts()
}

watch(() => physicalForm.value, (val) => {
  if (val.name && physicalErrors.value.name) delete physicalErrors.value.name
  if (val.basePrice > 0 && physicalErrors.value.basePrice) delete physicalErrors.value.basePrice
  const cat = val.categorySelect === 'Outro' ? val.categoryCustom : val.categorySelect
  if (cat && physicalErrors.value.category) delete physicalErrors.value.category
}, { deep: true })

watch(() => quotaForm.value, (val) => {
  if (val.name && quotaErrors.value.name) delete quotaErrors.value.name
  if (val.totalValue > 0 && quotaErrors.value.totalValue) delete quotaErrors.value.totalValue
  if (val.desiredQuantity > 0 && quotaErrors.value.desiredQuantity) delete quotaErrors.value.desiredQuantity
  const cat = val.categorySelect === 'Outro' ? val.categoryCustom : val.categorySelect
  if (cat && quotaErrors.value.category) delete quotaErrors.value.category
}, { deep: true })

const deleteProductAction = async (id: string) => {
  if (!confirm('Deseja realmente excluir este item?')) return
  await deleteProductService(id)
  await loadProducts()
}
</script>

<template>
  <div class="space-y-12">
    <!-- Header Actions -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-serif text-slate-900 tracking-tight">Lista de Presentes</h2>
        <p class="text-sm text-slate-500">Gerencie produtos físicos e cotas financeiras.</p>
      </div>
      <div class="flex gap-3">
        <Button @click="openNewQuota" variant="default" class="shadow-sm">Nova Cota (PIX)</Button>
        <Button @click="openNewPhysical" variant="outline" class="shadow-sm bg-white">Novo Produto</Button>
      </div>
    </div>

    <!-- Metrics -->
    <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div class="flex items-center gap-4 mb-6">
        <div class="bg-primary/10 p-3 rounded-2xl">
          <Wallet class="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 class="font-medium text-slate-900 text-lg">Meta de Cotas e Presentes Convertidos</h3>
          <p class="text-sm text-slate-500 font-light">Acompanhe a arrecadação da sua lista de experiências em PIX.</p>
        </div>
      </div>
      <div class="space-y-4">
        <div class="flex justify-between text-sm">
          <span class="text-slate-500">Arrecadado: <strong class="text-slate-900">{{ formatCurrency(totalRaised, { symbol: true }) }}</strong></span>
          <span class="text-slate-500">Meta: <strong class="text-slate-900">{{ formatCurrency(totalProjected, { symbol: true }) }}</strong></span>
        </div>
        <Progress :value="progressPercentage" class="h-3" />
      </div>
    </div>

    <!-- Products Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card v-for="product in products" :key="product.$id"
        class="flex flex-col overflow-hidden bg-white shadow-sm border-slate-200">
        <div v-if="product.image_url"
          class="bg-slate-50 p-4 aspect-video flex items-center justify-center border-b border-slate-100">
          <img :src="product.image_url" alt="Produto"
            class="max-h-full object-contain mix-blend-multiply" />
        </div>
        <div v-else
          class="bg-slate-50 p-4 aspect-video flex flex-col items-center justify-center border-b border-slate-100">
          <span class="text-primary/40 font-serif text-3xl italic">{{ product.type === 'quota' ? 'Cota' : 'Físico'
            }}</span>
        </div>

        <div class="p-6 flex flex-col flex-1">
          <div class="flex justify-between items-start gap-2 mb-2">
            <h3 class="font-serif text-slate-900 text-lg leading-tight">{{ product.name }}</h3>
            <span v-if="product.category"
              class="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold whitespace-nowrap">{{
                product.category }}</span>
          </div>
          <p v-if="product.type === 'quota'" class="text-primary font-bold text-xl mb-6">
            {{ formatCurrency(parseCurrency(product.fixed_quota_value || '0'), { symbol: true }) }} <span
              class="text-sm font-normal text-slate-400">/ {{ formatCurrency(parseCurrency(product.total_value || '0'), { symbol: true }) }}</span>
          </p>
          <p v-else class="text-primary font-bold text-xl mb-6 flex items-center flex-wrap gap-2">
            {{ formatCurrency(parseCurrency(product.base_price || '0'), { symbol: true }) }}
            <span v-if="product.desired_quantity && product.desired_quantity > 1"
              class="text-xs font-normal text-slate-400 block mt-1 w-full">{{ product.desired_quantity }}
              desejadas</span>
            <span v-else
              class="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md uppercase tracking-wider">Produto
              Único</span>
          </p>

          <div class="mt-auto flex gap-2 border-t border-slate-100 pt-4">
            <Button variant="outline" size="sm" class="flex-1 text-slate-600 hover:text-slate-900"
              @click="product.type === 'quota' ? editQuota(product) : editPhysical(product)">
              <Edit2 class="w-4 h-4 mr-2" /> Editar
            </Button>
            <Button variant="outline" size="sm" class="text-red-500 hover:text-red-600 hover:bg-red-50"
              @click="deleteProductAction(product.$id)">
              <Trash2 class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <!-- Modals -->
    <!-- Physical Modal -->
    <Dialog v-model:open="showPhysicalModal" :title="editProductId ? 'Editar Produto Físico' : 'Novo Produto Físico'">
      <div class="space-y-5 max-h-[60vh] overflow-y-auto px-1 pb-4">
        <FormGroup label="Nome do Produto" :error="physicalErrors.name">
          <Input v-model="physicalForm.name" placeholder="Ex: Jogo de Panelas Tramontina" />
        </FormGroup>

        <FormGroup label="Categoria" :error="physicalErrors.category">
          <Combobox v-model="physicalForm.categorySelect" :options="categoryOptions"
            placeholder="Selecione a categoria..." emptyText="Nenhuma categoria..." />
        </FormGroup>

        <FormGroup v-if="physicalForm.categorySelect === 'Outro'" label="Qual categoria?"
          :error="physicalErrors.categoryCustom">
          <Input v-model="physicalForm.categoryCustom" placeholder="Ex: Eletroportáteis" class="bg-slate-50/50" />
        </FormGroup>

        <div class="grid grid-cols-2 gap-4">
          <FormGroup label="Valor (R$)" :error="physicalErrors.basePrice">
            <Input v-model="physicalForm.basePrice" v-money3="moneyConfig" placeholder="Ex: 500,00" />
          </FormGroup>
          <FormGroup label="Quantidade">
            <Input v-model.number="physicalForm.desiredQuantity" type="number" min="1" />
          </FormGroup>
        </div>

        <FormGroup label="Imagem do Produto">
          <div v-if="!physicalForm.imageBase64" @dragover.prevent @dragenter.prevent @drop.prevent="handleDrop"
            @click="triggerFileInput"
            class="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-colors">
            <UploadCloud class="w-8 h-8 text-slate-400 mb-2" stroke-width="1.5" />
            <p class="text-sm text-slate-600 font-medium">Clique ou arraste até aqui</p>
            <input type="file" id="file-upload" accept="image/*" @change="handleImageUpload" class="hidden" />
          </div>
          <div v-else
            class="relative bg-slate-50 rounded-2xl p-4 aspect-video flex items-center justify-center border border-slate-100">
            <img :src="physicalForm.imageBase64" class="max-h-full object-contain" />
            <button @click.stop="removeImage"
              class="absolute top-2 right-2 bg-white shadow rounded-full p-2 text-slate-500 hover:text-red-500">
              <X class="w-4 h-4" stroke-width="2.5" />
            </button>
          </div>
        </FormGroup>
        <FormGroup label="Links Externos (Lojas)">
          <div v-if="physicalForm.links.length > 0" class="space-y-2 mb-4">
            <div v-for="(link, idx) in physicalForm.links" :key="idx"
              class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div class="w-10 h-10 rounded bg-slate-200 flex items-center justify-center text-slate-400">
                <ExternalLink class="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-900 truncate">{{ link.store }}</p>
              </div>
              <Button variant="ghost" size="sm" class="text-red-500 hover:text-red-600 hover:bg-red-50"
                @click="removeLink(idx)">
                <X class="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div v-if="searchResults.length > 0"
            class="space-y-2 mt-4 p-4 border border-primary/20 bg-primary/5 rounded-xl">
            <h4 class="text-xs font-bold text-primary uppercase tracking-wider mb-3">Resultados da Busca (Serper)</h4>
            <div v-for="(res, idx) in searchResults" :key="idx"
              class="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-slate-900 truncate" :title="res.title">{{ res.title }}</p>
                <p class="text-[10px] text-slate-500">{{ res.source }}</p>
              </div>
              <Button size="sm" variant="outline" class="h-7 text-xs px-2" @click="addLinkToProduct(res)">
                <Plus class="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
          </div>
          <div v-else-if="physicalForm.links.length === 0"
            class="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Nenhum link adicionado. Use a busca abaixo para encontrar ofertas.
          </div>
        </FormGroup>
      </div>
      <div class="pt-4 mt-2 border-t border-slate-100 flex gap-3">
        <Button type="button" variant="outline" class="flex-1 bg-slate-50 text-slate-700" @click="searchExternalLinks"
          :disabled="isSearchingLinks">
          <Search v-if="!isSearchingLinks" class="w-4 h-4 mr-2" />
          <span v-else
            class="w-4 h-4 mr-2 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin"></span>
          {{ isSearchingLinks ? 'Buscando...' : 'Buscar Links (Google)' }}
        </Button>
        <Button class="flex-1" @click="createPhysicalProduct">Salvar Produto</Button>
      </div>
    </Dialog>

    <!-- Quota Modal -->
    <Dialog v-model:open="showQuotaModal" :title="editProductId ? 'Editar Cota PIX' : 'Nova Cota (PIX)'">
      <div class="space-y-5 max-h-[60vh] overflow-y-auto px-1 pb-4">
        <FormGroup label="Nome da Experiência" :error="quotaErrors.name">
          <Input v-model="quotaForm.name" placeholder="Ex: Jantar Romântico" />
        </FormGroup>

        <FormGroup label="Categoria" :error="quotaErrors.category">
          <Combobox v-model="quotaForm.categorySelect" :options="categoryOptions" placeholder="Selecione a categoria..."
            emptyText="Nenhuma categoria..." />
        </FormGroup>

        <FormGroup v-if="quotaForm.categorySelect === 'Outro'" label="Qual categoria?"
          :error="quotaErrors.categoryCustom">
          <Input v-model="quotaForm.categoryCustom" placeholder="Ex: Experiências de Viagem" class="bg-slate-50/50" />
        </FormGroup>

        <div class="grid grid-cols-2 gap-4">
          <FormGroup label="Meta Total (R$)" :error="quotaErrors.totalValue">
            <Input v-model="quotaForm.totalValue" v-money3="moneyConfig" placeholder="Ex: 1000,00" />
          </FormGroup>
          <FormGroup label="Quantidade de Cotas" :error="quotaErrors.desiredQuantity">
            <Input v-model.number="quotaForm.desiredQuantity" type="number" placeholder="Ex: 5" />
          </FormGroup>
        </div>

        <FormGroup label="Imagem Inspiracional">
          <div v-if="!quotaForm.imageBase64" @dragover.prevent @dragenter.prevent @drop.prevent="handleQuotaDrop"
            @click="triggerQuotaFileInput"
            class="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-colors">
            <UploadCloud class="w-8 h-8 text-slate-400 mb-2" stroke-width="1.5" />
            <p class="text-sm text-slate-600 font-medium">Clique ou arraste até aqui</p>
            <input type="file" id="quota-file-upload" accept="image/*" @change="handleQuotaImageUpload"
              class="hidden" />
          </div>
          <div v-else
            class="relative bg-slate-50 rounded-2xl p-4 aspect-video flex items-center justify-center border border-slate-100">
            <img :src="quotaForm.imageBase64" class="max-h-full object-contain" />
            <button @click.stop="removeQuotaImage"
              class="absolute top-2 right-2 bg-white shadow rounded-full p-2 text-slate-500 hover:text-red-500">
              <X class="w-4 h-4" stroke-width="2.5" />
            </button>
          </div>
        </FormGroup>
      </div>
      <div class="pt-4 mt-2 border-t border-slate-100">
        <Button class="w-full" @click="createQuotaProduct">Salvar Cota</Button>
      </div>
    </Dialog>
  </div>
</template>
