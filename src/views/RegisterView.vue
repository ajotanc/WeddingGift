<script setup lang="ts">
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/components/ui/toast/use-toast'
import Button from '@/components/ui/button/Button.vue'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/input/Input.vue'
import Label from '@/components/ui/label/Label.vue'
import { auth, db } from '@/firebase'
import type { TenantSettings } from '@/types'

const { toast } = useToast()
const router = useRouter()
const loading = ref(false)

const form = ref({
  groomName: '',
  brideName: '',
  slug: '',
  pixKey: '',
  primaryColor: '#ec4899',
})

const generateSlug = () => {
  if (form.value.groomName && form.value.brideName && !form.value.slug) {
    form.value.slug = `${form.value.groomName}-${form.value.brideName}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }
}

const registerTenant = async () => {
  loading.value = true
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const user = result.user

    // Check if tenant already exists for this uid
    const q = query(collection(db, 'tenants'), where('id', '==', user.uid))
    const snap = await getDocs(q)

    if (!snap.empty) {
      toast({ title: 'Aviso', description: 'Você já possui um painel criado!', variant: 'destructive' })
      return
    }

    const coupleName = `${form.value.brideName} & ${form.value.groomName}`

    const newTenant: TenantSettings = {
      id: user.uid,
      slug: form.value.slug,
      coupleName: coupleName,
      groomName: form.value.groomName,
      brideName: form.value.brideName,
      pixKey: form.value.pixKey,
      status: 'active',
      theme: {
        primaryColor: form.value.primaryColor,
      },
      createdAt: Date.now(),
      settings: {
        showCountdown: true
      }
    }

    await setDoc(doc(db, 'tenants', user.uid), newTenant)
    router.push('/admin')
  } catch (error) {
    console.error('Registration error', error)
    toast({ title: 'Erro', description: 'Erro ao registrar. Verifique os dados e tente novamente.', variant: 'destructive' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-slate-50 py-20 px-4">
    <div class="max-w-md mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-slate-900">Crie sua Lista de Casamento</h1>
        <p class="text-slate-500 mt-2">Tudo em um só lugar. Rápido, lindo e seguro.</p>
      </div>

      <Card class="p-8">
        <form @submit.prevent="registerTenant" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label class="block mb-1">Nome do Noivo</Label>
              <Input v-model="form.groomName" required placeholder="Ex: João" @blur="generateSlug" />
            </div>
            <div>
              <Label class="block mb-1">Nome da Noiva</Label>
              <Input v-model="form.brideName" required placeholder="Ex: Maria" @blur="generateSlug" />
            </div>
          </div>
          
          <div>
            <Label class="block mb-1">Link Personalizado</Label>
            <div class="flex items-center">
              <span class="bg-slate-100 border border-r-0 border-slate-300 rounded-l-md px-3 h-10 flex items-center text-slate-500 text-sm">wedding.app/</span>
              <Input v-model="form.slug" required placeholder="joao-e-maria" class="rounded-l-none" />
            </div>
          </div>

          <div>
            <Label class="block mb-1">Sua Chave PIX</Label>
            <Input v-model="form.pixKey" required placeholder="Para receber as cotas direto na conta" />
            <p class="text-xs text-slate-500 mt-1">Nós não cobramos taxas sobre os presentes em dinheiro.</p>
          </div>

          <div>
            <Label class="block mb-1">Cor do Casamento</Label>
            <div class="flex items-center gap-4">
              <input type="color" v-model="form.primaryColor" class="w-10 h-10 p-1 rounded cursor-pointer" />
              <span class="text-sm font-mono text-slate-600">{{ form.primaryColor }}</span>
            </div>
          </div>

          <Button type="submit" class="w-full" size="lg" :disabled="loading">
            {{ loading ? 'Criando Conta...' : 'Continuar com Google' }}
          </Button>
        </form>
      </Card>
    </div>
  </main>
</template>
