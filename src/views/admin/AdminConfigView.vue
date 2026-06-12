<script setup lang="ts">
import { ref, watch } from 'vue'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useTenant } from '@/composables/useTenant'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import FormGroup from '@/components/ui/FormGroup.vue'
import { Settings } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import LocationAutocomplete from '@/components/ui/LocationAutocomplete.vue'
import DatePicker from '@/components/ui/DatePicker.vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { vMaska } from 'maska/vue'

const { toast } = useToast()
const { tenant } = useTenant()

const hostName = window.location.host

const configSchema = toTypedSchema(
  z.object({
    groomName: z.string().min(2, 'Nome muito curto').optional(),
    brideName: z.string().min(2, 'Nome muito curto').optional(),
    slug: z.string().min(3, 'Mínimo de 3 caracteres').regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hifens'),
    themeColor: z.string(),
    pixKey: z.string().min(5, 'Chave PIX inválida'),
    coupleHistory: z.string().optional(),
    eventDate: z.string().nullable().optional(),
    eventTime: z.string().nullable().optional(),
    eventLocation: z.string().nullable().optional(),
    guestLimit: z.number().int().positive().nullable().optional(),
    backgroundImageUrl: z.string()
      .optional()
      .or(z.string().regex(/^data:image\/[a-zA-Z]+;base64,/, 'Imagem inválida'))
      .refine(val => {
        if (!val) return true;
        try { new URL(val); return true; } catch { return false; }
      }, { message: 'URL inválida' }),
    dashboardHeaderBgColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, { message: 'Cor inválida' }).optional(),
    showCountdown: z.boolean().optional(),
  })
)

const { handleSubmit, errors, setValues } = useForm({
  validationSchema: configSchema,
  initialValues: {
    groomName: '',
    brideName: '',
    slug: '',
    themeColor: '#ec4899',
    pixKey: '',
    coupleHistory: '',
    showCountdown: true,
  }
})

const { value: groomName } = useField<string>('groomName')
const { value: brideName } = useField<string>('brideName')
const { value: slug } = useField<string>('slug')
const { value: themeColor } = useField<string>('themeColor')
const { value: eventDate } = useField<string>('eventDate')
const { value: eventTime } = useField<string>('eventTime')
const { value: eventLocation } = useField<string>('eventLocation')
const { value: guestLimit } = useField<number>('guestLimit')
const { value: backgroundImageUrl } = useField<string>('backgroundImageUrl')
const { value: dashboardHeaderBgColor } = useField<string>('dashboardHeaderBgColor')
const { value: pixKey } = useField<string>('pixKey')
const { value: coupleHistory } = useField<string>('coupleHistory')
const { value: showCountdown } = useField<boolean>('showCountdown')

const isSaving = ref(false)

const loadSettings = () => {
  if (tenant.value) {
    setValues({
      groomName: tenant.value.groomName || '',
      brideName: tenant.value.brideName || '',
      slug: tenant.value.slug || '',
      themeColor: tenant.value.theme?.primaryColor || '#ec4899',
      pixKey: tenant.value.pixKey || '',
      coupleHistory: tenant.value.coupleHistory || '',
      eventDate: tenant.value.eventDate || undefined,
      eventTime: tenant.value.eventTime || undefined,
      eventLocation: tenant.value.eventLocation || undefined,
      guestLimit: tenant.value.settings?.guestLimit ?? undefined,
      backgroundImageUrl: tenant.value.theme?.backgroundImageUrl || '',
      dashboardHeaderBgColor: tenant.value.theme?.dashboardHeaderBgColor || '#ffffff',
      showCountdown: tenant.value.settings?.showCountdown ?? true,
    })
  }
}

watch(tenant, (newTenant) => {
  if (newTenant) loadSettings()
}, { immediate: true })

watch([groomName, brideName], ([groom, bride]) => {
  if (groom && bride) {
    const generated = `${groom}-${bride}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]/g, '')
    // Update slug automatically if the user hasn't heavily customized it
    if (!slug.value || slug.value === generated || slug.value === `${tenant.value?.groomName}-${tenant.value?.brideName}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]/g, '')) {
       slug.value = generated
    }
  }
})

function onLocationSelect(payload: any) {
  eventLocation.value = payload.address
}

function onFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) {
        backgroundImageUrl.value = ev.target.result.toString()
      }
    }
    reader.readAsDataURL(file)
  }
}

const saveSettings = handleSubmit(async (values) => {
  if (!tenant.value) return
  isSaving.value = true
  try {
    const coupleName = `${values.brideName || ''} & ${values.groomName || ''}`.trim()
    const urlChanged = tenant.value.slug !== values.slug
    
    await updateDoc(doc(db, 'tenants', tenant.value.id), {
      groomName: values.groomName || '',
      brideName: values.brideName || '',
      coupleName: coupleName === '&' ? tenant.value.coupleName : coupleName,
      slug: values.slug,
      'theme.primaryColor': values.themeColor,
      pixKey: values.pixKey,
      coupleHistory: values.coupleHistory || '',
      eventDate: values.eventDate || '',
      eventTime: values.eventTime || '',
      eventLocation: values.eventLocation || '',
      'settings.guestLimit': values.guestLimit || null,
      'settings.showCountdown': values.showCountdown,
      'theme.backgroundImageUrl': values.backgroundImageUrl || '',
      'theme.dashboardHeaderBgColor': values.dashboardHeaderBgColor || '#ffffff',
    })
    
    if (urlChanged) {
      toast({ title: 'Sucesso', description: 'URL alterada com sucesso! Você será redirecionado para o novo link.' })
      setTimeout(() => {
        window.location.href = `/${values.slug}/admin/config`
      }, 1500)
    } else {
      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso!' })
      window.location.reload()
    }
  } catch (err) {
    console.error('Erro ao salvar configurações', err)
    toast({ title: 'Erro', description: 'Erro ao salvar as configurações.', variant: 'destructive' })
  } finally {
    isSaving.value = false
  }
})
</script>

<template>
  <div class="space-y-12 w-full">
    <!-- Header Actions -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-serif text-slate-900 tracking-tight">Configurações Gerais</h2>
        <p class="text-sm text-slate-500">Personalize o seu site de casamento.</p>
      </div>
    </div>

    <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8">
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormGroup label="Nome do Noivo" :error="errors.groomName">
          <Input v-model="groomName" placeholder="Ex: João" class="bg-slate-50/50" />
        </FormGroup>
        <FormGroup label="Nome da Noiva" :error="errors.brideName">
          <Input v-model="brideName" placeholder="Ex: Maria" class="bg-slate-50/50" />
        </FormGroup>
        <FormGroup label="Chave PIX" :error="errors.pixKey">
          <Input v-model="pixKey" placeholder="CPF, Email ou Telefone" class="bg-slate-50/50" />
        </FormGroup>
        <FormGroup label="Link Personalizado (Slug)" :error="errors.slug">
          <div class="flex items-stretch shadow-sm rounded-xl overflow-hidden border border-slate-200">
            <div class="bg-slate-100 px-4 flex items-center justify-center border-r border-slate-200">
              <span class="text-slate-500 font-medium text-sm">https://{{ hostName }}/</span>
            </div>
            <input type="text" v-model="slug" placeholder="joao-maria" class="flex-1 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700" />
          </div>
          <p class="text-xs text-red-400 mt-1">Atenção: alterar o link invalida o acesso antigo.</p>
        </FormGroup>
      </div>

      <FormGroup label="História do Casal">
        <p class="text-xs text-slate-500 mb-1">Escreva um texto especial contando a história de vocês. Ele aparecerá na página inicial para os convidados.</p>
        <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <QuillEditor theme="snow" v-model:content="coupleHistory" contentType="html" class="min-h-[200px] text-base font-sans" />
        </div>
      </FormGroup>

      <div class="border-t border-slate-100 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormGroup label="Data do Evento" :error="errors.eventDate">
          <DatePicker v-model="eventDate" class="bg-slate-50/50" />
        </FormGroup>
        
        <FormGroup label="Hora do Evento" :error="errors.eventTime">
          <Input type="text" v-model="eventTime" v-maska data-maska="##:##" inputmode="numeric" placeholder="00:00" class="bg-slate-50/50" />
        </FormGroup>
        
        <FormGroup label="Local do Evento" class="md:col-span-2">
          <LocationAutocomplete @select="onLocationSelect" />
          <p class="text-xs text-slate-500 mt-1">Selecionado: {{ eventLocation }}</p>
        </FormGroup>
        
        <FormGroup label="Exibir Contagem Regressiva">
          <label class="relative inline-flex items-center cursor-pointer mt-2">
            <input type="checkbox" v-model="showCountdown" class="sr-only peer">
            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            <span class="ml-3 text-sm font-medium text-slate-700">Ativar contagem na página pública</span>
          </label>
        </FormGroup>

        <FormGroup label="Limite de Convidados" :error="errors.guestLimit">
          <Input type="number" v-model.number="guestLimit" min="0" class="bg-slate-50/50" />
        </FormGroup>

        <FormGroup label="Cor Principal (Tema)">
          <div class="flex items-center gap-4">
            <input type="color" v-model="themeColor" class="w-12 h-12 rounded cursor-pointer border-0 p-0" />
            <span class="text-sm font-medium text-slate-600">{{ themeColor }}</span>
          </div>
        </FormGroup>

        <FormGroup label="Cor do Cabeçalho do Dashboard" :error="errors.dashboardHeaderBgColor">
          <input type="color" v-model="dashboardHeaderBgColor" class="w-12 h-12 rounded cursor-pointer border-0 p-0" />
        </FormGroup>

        <FormGroup label="Imagem de Fundo" class="md:col-span-2" :error="errors.backgroundImageUrl">
          <div class="flex flex-col gap-4">
            <Input v-model="backgroundImageUrl" placeholder="URL da imagem (Ex: https://example.com/bg.jpg)" class="bg-slate-50/50" />
            <div class="flex items-center gap-4">
              <span class="text-sm text-slate-500 font-medium">Ou faça o upload:</span>
              <input type="file" @change="onFileSelect" accept="image/*" class="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
            </div>
            <img v-if="backgroundImageUrl" :src="backgroundImageUrl" class="w-full max-w-sm rounded-xl border border-slate-200 mt-2 object-cover aspect-video" />
          </div>
        </FormGroup>
      </div>

      <div class="pt-6 border-t border-slate-100 flex justify-end">
        <Button @click="saveSettings" :disabled="isSaving" class="px-10">
          {{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}
        </Button>
      </div>
    </div>
  </div>
</template>
