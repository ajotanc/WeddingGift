<script setup lang="ts">
import { PROJECT_NAME } from '@/lib/defaults';
import type { IRsvpEmailParams } from '@/services/email.service';
import {
  Tailwind,
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Img,
} from '@vue-email/components';
import { computed } from 'vue';

const props = defineProps<IRsvpEmailParams>();

const tailwindConfig = {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          "'BlinkMacSystemFont'",
          "'Segoe UI'",
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        primary: '#c5a880',
        secondary: '#faf8f6',
        weddingDark: '#1e1a17',
        weddingBody: '#5a4f4a',
        weddingBorder: '#e8e2dd',
        weddingMuted: '#8c7a6b',
        weddingDivider: '#f5f0eb',
      },
    },
  },
};

const isConfirmed = computed(() => props.status === 'confirmed');
const statusTitle = computed(() => isConfirmed.value ? 'Presença Confirmada' : 'Ausência Registrada');
</script>

<template>
  <Tailwind :config="tailwindConfig">
    <Html lang="pt-BR">

    <Head />

    <Body class="bg-secondary font-sans m-0 py-10 px-4 text-sm">
      <Container
        class="max-w-xl mx-auto bg-white rounded-3xl overflow-hidden border border-weddingBorder shadow-sm font-sans">

        <!-- Header com Logo do Sistema -->
        <Section class="bg-weddingDark p-7 text-center border-b-2 border-primary">
          <Img src="https://eternosim.ajotanc.com.br/images/es.svg" width="48" height="48" :alt="PROJECT_NAME"
            class="mx-auto my-0 mb-3" />
          <Heading class="m-0 font-sans text-2xl font-bold text-white">
            {{ statusTitle }}
          </Heading>
          <Text class="mt-1.5 mb-0 font-sans text-sm text-primary font-medium">
            {{ couple_name }}
          </Text>
        </Section>

        <!-- Corpo Principal -->
        <Section class="p-8 font-sans">
          <Text class="text-base leading-relaxed mt-0 text-weddingDark font-semibold font-sans">
            Olá, {{ guest_name }}
          </Text>

          <!-- Status Badge -->
          <Section class="text-center my-6 font-sans">
            <span :class="[
              'inline-block font-semibold px-5 py-2 rounded-full text-sm uppercase tracking-wider border',
              isConfirmed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            ]">
              {{ statusTitle }}
            </span>
          </Section>

          <!-- Card de Mensagem -->
          <Section
            class="bg-secondary border-l-4 border-primary p-5 my-6 rounded-r-2xl border-t border-r border-b border-weddingBorder font-sans">
            <Text class="m-0 text-sm leading-relaxed text-weddingBody italic font-sans">
              "{{ message }}"
            </Text>
          </Section>

          <!-- Assinatura -->
          <Section class="text-center mt-8 pt-5 border-t border-weddingDivider font-sans">
            <Text class="text-sm text-weddingMuted mb-1 font-sans">
              Atenciosamente,
            </Text>
            <Text class="font-sans text-lg font-bold text-weddingDark m-0">
              {{ couple_name }}
            </Text>
          </Section>
        </Section>

        <!-- Footer Sistema -->
        <Section class="bg-secondary p-4 text-center border-t border-weddingBorder font-sans">
          <Text class="m-0 text-xs text-weddingMuted font-sans">
            {{ PROJECT_NAME }} — Lista de Casamento & RSVP
          </Text>
        </Section>
      </Container>
    </Body>

    </Html>
  </Tailwind>
</template>
