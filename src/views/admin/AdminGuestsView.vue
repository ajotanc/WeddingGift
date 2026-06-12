<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useTenant } from '@/composables/useTenant'
import type { Rsvp, Message } from '@/types'
import { GoogleGenAI } from '@google/genai'
import Button from '@/components/ui/Button.vue'
import Dialog from '@/components/ui/Dialog.vue'
import { Users, Sparkles, Trash2, Download } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'

const { toast } = useToast()
const { tenant } = useTenant()

const rsvps = ref<Rsvp[]>([])
const messages = ref<Message[]>([])

const rsvpStats = computed(() => {
  const confirmed = rsvps.value.filter((r) => r.status === 'confirmed')
  const declined = rsvps.value.filter((r) => r.status === 'declined')

  return {
    adults: confirmed.reduce((acc, r) => acc + r.totalAdults, 0),
    children: confirmed.reduce((acc, r) => acc + r.totalChildren, 0),
    declinedCount: declined.length,
  }
})

const loadData = async () => {
  if (!tenant.value) return

  const qRsvp = query(collection(db, 'rsvp'), where('tenantId', '==', tenant.value.id))
  const snapRsvp = await getDocs(qRsvp)
  rsvps.value = snapRsvp.docs.map((d) => ({ id: d.id, ...d.data() }) as Rsvp)
  
  const qMessages = query(collection(db, 'messages'), where('tenantId', '==', tenant.value.id))
  const snapMessages = await getDocs(qMessages)
  messages.value = snapMessages.docs.map((d) => ({ id: d.id, ...d.data() }) as Message)
}

watch(tenant, (newTenant) => {
  if (newTenant) loadData()
}, { immediate: true })

const deleteMessage = async (id: string) => {
  if (!confirm('Deseja excluir esta mensagem?')) return
  await deleteDoc(doc(db, 'messages', id))
  await loadData()
  toast({ title: 'Sucesso', description: 'Mensagem excluída!' })
}

// Gemini AI
const aiThanks = ref('')
const showThanksModal = ref(false)
const generatingThanks = ref(false)

const generateThanks = async (guestName: string) => {
  showThanksModal.value = true
  generatingThanks.value = true
  aiThanks.value = ''

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })
    const prompt = `Escreva uma mensagem de agradecimento curta (máx 3 frases) e carinhosa de um casal de noivos para o convidado ${guestName} que acabou de confirmar presença no casamento. Use um tom feliz e amigável.`

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    })

    aiThanks.value = response.text || 'Obrigado por confirmar presença!'
  } catch (err) {
    console.error('Erro ao gerar agradecimento:', err)
    aiThanks.value = 'Houve um erro ao gerar a mensagem. Tente novamente mais tarde.'
  } finally {
    generatingThanks.value = false
  }
}

const copyThanks = () => {
  navigator.clipboard.writeText(aiThanks.value)
  toast({ title: 'Sucesso', description: 'Texto copiado!' })
}

const copyRSVPList = () => {
  const text = rsvps.value.map(r => `${r.guestName} (${r.status === 'confirmed' ? 'Confirmado' : 'Não irá'}) - Adultos: ${r.totalAdults}, Crianças: ${r.totalChildren}`).join('\n')
  navigator.clipboard.writeText(text)
  toast({ title: 'Sucesso', description: 'Lista copiada para a área de transferência!' })
}
</script>

<template>
  <div class="space-y-12">
    <!-- Header Actions -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-serif text-slate-900 tracking-tight">Convidados & Recados</h2>
        <p class="text-sm text-slate-500">Acompanhe as confirmações de presença e o mural.</p>
      </div>
    </div>

    <!-- Metrics -->
    <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div class="flex items-center gap-4 mb-6">
        <div class="bg-primary/10 p-3 rounded-2xl">
          <Users class="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 class="font-medium text-slate-900 text-lg">Confirmações de Presença (RSVP)</h3>
          <p class="text-sm text-slate-500 font-light">Contagem baseada nas respostas dos convidados.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
          <span class="text-slate-500 text-sm mb-2">Adultos Confirmados</span>
          <span class="text-4xl font-serif text-slate-900">{{ rsvpStats.adults }}</span>
        </div>
        <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
          <span class="text-slate-500 text-sm mb-2">Crianças Confirmadas</span>
          <span class="text-4xl font-serif text-slate-900">{{ rsvpStats.children }}</span>
        </div>
        <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
          <span class="text-slate-500 text-sm mb-2">Não Poderão Ir</span>
          <span class="text-4xl font-serif text-slate-900">{{ rsvpStats.declinedCount }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- RSVP List -->
      <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div class="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 class="font-medium text-slate-900">Lista de Respostas</h3>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="r in rsvps" :key="r.id" class="p-6 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p class="font-medium text-slate-900">{{ r.guestName }}</p>
              <p class="text-sm text-slate-500 mt-1">{{ r.phone }} • {{ r.email }}</p>
              <div class="mt-3 flex gap-2">
                <span v-if="r.status === 'confirmed'" class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-medium">Confirmado</span>
                <span v-else class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-md font-medium">Ausente</span>
                <span v-if="r.status === 'confirmed'" class="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md">{{ r.totalAdults }} Adultos, {{ r.totalChildren }} Crianças</span>
              </div>
            </div>
            <div v-if="r.status === 'confirmed'" class="flex flex-col justify-center">
              <button @click="generateThanks(r.guestName)" class="text-primary text-sm font-medium hover:underline flex items-center gap-1 bg-primary/5 px-3 py-2 rounded-lg transition-colors">
                <Sparkles :size="14" /> IA
              </button>
            </div>
          </div>
          <div v-if="rsvps.length === 0" class="p-10 text-center text-slate-400">Nenhum RSVP recebido ainda.</div>
        </div>
      </div>

      <!-- Messages Wall -->
      <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div class="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 class="font-medium text-slate-900">Mural de Recados</h3>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="m in messages" :key="m.id" class="p-6">
            <div class="flex justify-between items-start gap-4">
              <div class="flex-1">
                <p class="text-sm font-medium text-slate-900 mb-2">{{ m.guestName }}</p>
                <p class="text-slate-600 italic font-serif leading-relaxed">"{{ m.content }}"</p>
              </div>
              <button @click="deleteMessage(m.id)" class="text-red-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-if="messages.length === 0" class="p-10 text-center text-slate-400">Nenhuma mensagem recebida ainda.</div>
        </div>
      </div>
    </div>

    <!-- IA Thanks Modal -->
    <Dialog v-model:open="showThanksModal" title="Agradecimento IA">
      <div class="space-y-4 text-center">
        <div v-if="generatingThanks" class="text-slate-500 py-6 animate-pulse font-light">A IA do Gemini está escrevendo...</div>
        <div v-else>
          <p class="bg-slate-50 p-6 rounded-2xl text-slate-800 text-left italic mb-6 border border-slate-100">"{{ aiThanks }}"</p>
          <Button @click="copyThanks" class="w-full">Copiar Texto</Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>
