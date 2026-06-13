<script setup lang="ts">
import { ref, watch } from 'vue'
import { updateTenant } from '@/services/tenant.service'
import { useAuthStore } from '@/stores/auth'
import { useTenant } from '@/composables/useTenant'
import { storage, BUCKET_ID } from '@/lib/appwrite'
import { ID } from 'appwrite'
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
const authStore = useAuthStore()

const hostName = window.location.host

const configSchema = toTypedSchema(
  z.object({
    groom_name: z.string().min(2, 'Nome muito curto').optional(),
    bride_name: z.string().min(2, 'Nome muito curto').optional(),
    slug: z.string().min(3, 'Mínimo de 3 caracteres').regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hifens'),
    pix_key: z.string().min(5, 'Chave PIX inválida'),
    couple_history: z.string().optional(),
    event_date: z.string().nullable().optional(),
    event_time: z.string().nullable().optional(),
    event_location: z.string().nullable().optional(),
    guest_limit: z.number().int().positive().nullable().optional(),
    show_countdown: z.boolean().optional(),
    primary_color: z.string(),
    background_image: z.string()
      .optional()
      .or(z.string().regex(/^data:image\/[a-zA-Z]+;base64,/, 'Imagem inválida'))
      .refine(val => {
        if (!val) return true;
        try { new URL(val); return true; } catch { return false; }
      }, { message: 'URL inválida' }),
    background_color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, { message: 'Cor inválida' }).optional(),
  })
)

const { handleSubmit, errors, setValues } = useForm({
  validationSchema: configSchema,
  initialValues: {
    groom_name: '',
    bride_name: '',
    slug: '',
    pix_key: '',
    couple_history: '',
    show_countdown: true,
    primary_color: '#ec4899',
    background_color: '#ffffff'
  }
})

const { value: groom_name } = useField<string>('groom_name')
const { value: bride_name } = useField<string>('bride_name')
const { value: slug } = useField<string>('slug')
const { value: pix_key } = useField<string>('pix_key')
const { value: couple_history } = useField<string>('couple_history')
const { value: event_date } = useField<string>('event_date')
const { value: event_time } = useField<string>('event_time')
const { value: event_location } = useField<string>('event_location')
const { value: guest_limit } = useField<number>('guest_limit')
const { value: show_countdown } = useField<boolean>('show_countdown')
const { value: primary_color } = useField<string>('primary_color')
const { value: background_image } = useField<string>('background_image')
const { value: background_color } = useField<string>('background_color')

const isSaving = ref(false)

const loadSettings = () => {
  if (tenant.value) {
    const coupleNames = tenant.value.couple_name ? tenant.value.couple_name.split(' & ') : ['', '']
    setValues({
      groom_name: coupleNames[1] || '',
      bride_name: coupleNames[0] || '',
      slug: tenant.value.slug || '',
      pix_key: tenant.value.pix_key || '',
      couple_history: tenant.value.couple_history || '',
      event_date: tenant.value.event_date || undefined,
      event_time: tenant.value.event_time || undefined,
      event_location: tenant.value.event_location || undefined,
      guest_limit: tenant.value.guest_limit ?? undefined,
      show_countdown: tenant.value.show_countdown ?? true,
      primary_color: tenant.value.primary_color || '#ec4899',
      background_image: tenant.value.background_image || '',
      background_color: tenant.value.background_color || '#ffffff',
    })
  }
}

watch(tenant, (newTenant) => {
  if (newTenant) loadSettings()
}, { immediate: true })

watch([groom_name, bride_name], ([groom, bride]) => {
  if (groom && bride) {
    const generated = `${groom}-${bride}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]/g, '')
    // Update slug automatically if the user hasn't heavily customized it
    if (!slug.value || slug.value === generated || slug.value === `${tenant.value?.couple_name?.split(' & ')[1]}-${tenant.value?.couple_name?.split(' & ')[0]}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]/g, '')) {
      slug.value = generated
    }
  }
})

function onLocationSelect(payload: any) {
  event_location.value = payload.address
}

import { uploadFile } from '@/lib/utils'

const onFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && authStore.user) {
    try {
      toast({ title: 'Aviso', description: 'Otimizando e enviando imagem...' })

      const url = await uploadFile(authStore.user.$id, file, 'background')

      background_image.value = url
      toast({ title: 'Sucesso', description: 'Imagem enviada com sucesso!', class: 'bg-emerald-500 text-white border-none' })
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro', description: 'Falha ao enviar a imagem.', variant: 'destructive' })
    }
  }
}

const saveSettings = handleSubmit(async (values) => {
  if (!tenant.value || !authStore.user) return
  isSaving.value = true
  try {
    const coupleName = `${values.bride_name || ''} & ${values.groom_name || ''}`.trim()
    const urlChanged = tenant.value.slug !== values.slug

    const updatedTenant = await updateTenant(authStore.user.$id, {
      ...values,
      couple_name: coupleName === '&' ? tenant.value.couple_name : coupleName
    } as any)

    tenant.value = updatedTenant
    authStore.tenant = updatedTenant

    if (urlChanged) {
      window.location.href = `/${values.slug}/admin/config`
    } else {
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
        <FormGroup label="Nome do Noivo" :error="errors.groom_name">
          <Input v-model="groom_name" placeholder="Ex: João" class="bg-slate-50/50" />
        </FormGroup>
        <FormGroup label="Nome da Noiva" :error="errors.bride_name">
          <Input v-model="bride_name" placeholder="Ex: Maria" class="bg-slate-50/50" />
        </FormGroup>
        <FormGroup label="Chave PIX" :error="errors.pix_key">
          <Input v-model="pix_key" placeholder="CPF, Email ou Telefone" class="bg-slate-50/50" />
        </FormGroup>
        <FormGroup label="Link Personalizado (Slug)" :error="errors.slug">
          <div class="flex items-stretch shadow-sm rounded-xl overflow-hidden border border-slate-200">
            <div class="bg-slate-100 px-4 flex items-center justify-center border-r border-slate-200">
              <span class="text-slate-500 font-medium text-sm">https://{{ hostName }}/</span>
            </div>
            <input type="text" v-model="slug" placeholder="joao-maria"
              class="flex-1 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700" />
          </div>
          <p class="text-xs text-red-400 mt-1">Atenção: alterar o link invalida o acesso antigo.</p>
        </FormGroup>
      </div>

      <FormGroup label="História do Casal">
        <p class="text-xs text-slate-500 mb-1">Escreva um texto especial contando a história de vocês. Ele aparecerá na
          página inicial para os convidados.</p>
        <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <QuillEditor theme="snow" v-model:content="couple_history" contentType="html"
            class="min-h-[200px] text-base font-sans" />
        </div>
      </FormGroup>

      <div class="border-t border-slate-100 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormGroup label="Data do Evento" :error="errors.event_date">
          <DatePicker v-model="event_date" class="bg-slate-50/50" />
        </FormGroup>

        <FormGroup label="Hora do Evento" :error="errors.event_time">
          <Input type="text" v-model="event_time" v-maska data-maska="##:##" inputmode="numeric" placeholder="00:00"
            class="bg-slate-50/50" />
        </FormGroup>

        <FormGroup label="Local do Evento" class="md:col-span-2">
          <LocationAutocomplete @select="onLocationSelect" />
          <p class="text-xs text-slate-500 mt-1">Selecionado: {{ event_location }}</p>
        </FormGroup>

        <FormGroup label="Exibir Contagem Regressiva">
          <label class="relative inline-flex items-center cursor-pointer mt-2">
            <input type="checkbox" v-model="show_countdown" class="sr-only peer">
              <div
                class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary">
              </div>
              <span class="ml-3 text-sm font-medium text-slate-700">Ativar contagem na página pública</span>
          </label>
        </FormGroup>

        <FormGroup label="Limite de Convidados" :error="errors.guest_limit">
          <Input type="number" v-model.number="guest_limit" min="0" class="bg-slate-50/50" />
        </FormGroup>

        <FormGroup label="Cor Principal (Tema)">
          <div class="flex items-center gap-4">
            <input type="color" v-model="primary_color" class="w-12 h-12 rounded cursor-pointer border-0 p-0" />
            <span class="text-sm font-medium text-slate-600">{{ primary_color }}</span>
          </div>
        </FormGroup>

        <FormGroup label="Cor do Cabeçalho do Dashboard" :error="errors.background_color">
          <input type="color" v-model="background_color" class="w-12 h-12 rounded cursor-pointer border-0 p-0" />
        </FormGroup>

        <FormGroup label="Imagem de Fundo" class="md:col-span-2" :error="errors.background_image">
          <div class="flex flex-col gap-4">
            <Input v-model="background_image" placeholder="URL da imagem (Ex: https://example.com/bg.jpg)"
              class="bg-slate-50/50" />
            <div class="flex items-center gap-4">
              <span class="text-sm text-slate-500 font-medium">Ou faça o upload:</span>
              <input type="file" @change="onFileSelect" accept="image/*"
                class="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
            </div>
            <img v-if="background_image" :src="background_image"
              class="w-full max-w-sm rounded-xl border border-slate-200 mt-2 object-cover aspect-video" />
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
