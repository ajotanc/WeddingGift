<script setup lang="ts">
import { PROJECT_NAME } from '@/lib/defaults';
import type { IGiftEmailParams } from '@/services/email.service';
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

withDefaults(defineProps<IGiftEmailParams>(), {
  image_url: '',
});

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
          <Heading class="m-0 font-sans text-2xl font-bold text-white tracking-wide">
            Obrigado pelo seu Presente
          </Heading>
          <Text class="mt-1.5 mb-0 font-sans text-sm text-primary font-medium">
            {{ PROJECT_NAME }}
          </Text>
        </Section>

        <!-- Corpo Principal -->
        <Section class="p-8 font-sans">
          <Text class="text-base leading-relaxed mt-0 text-weddingDark font-semibold font-sans">
            Olá, {{ guest_name }}
          </Text>
          <Text class="text-sm leading-relaxed text-weddingBody mb-6 font-sans">
            Seu presente foi recebido com muito carinho e agradecemos imensamente por fazer parte deste momento especial
            com a gente.
          </Text>

          <!-- Imagem do Produto -->
          <Section v-if="image_url" class="text-center my-6 font-sans">
            <Img :src="image_url" :alt="product_name" style="max-width: 180px; max-height: 180px; margin: 0 auto;"
              class="rounded-2xl object-cover shadow-sm border border-weddingBorder" />
          </Section>

          <!-- Card de Resumo do Presente -->
          <Section class="bg-secondary rounded-2xl p-5 my-6 border border-weddingBorder font-sans">
            <Heading as="h3"
              class="mt-0 mb-3.5 font-sans text-sm text-weddingDark font-bold uppercase tracking-wider border-b border-weddingBorder pb-2">
              Resumo do Presente
            </Heading>

            <table class="w-full border-collapse text-sm text-weddingBody font-sans">
              <tbody>
                <tr>
                  <td class="py-2 text-sm font-medium">Item:</td>
                  <td class="py-2 text-sm text-right font-semibold text-weddingDark">{{ product_name }}</td>
                </tr>
                <tr>
                  <td class="py-2 text-sm font-medium">Quantidade:</td>
                  <td class="py-2 text-sm text-right text-weddingDark">{{ quantity }}</td>
                </tr>
                <tr>
                  <td class="py-2 text-sm font-medium">Pagamento:</td>
                  <td class="py-2 text-sm text-right text-weddingDark">{{ method === 'pix' ? 'PIX' : 'Loja Virtual' }}
                  </td>
                </tr>
                <tr class="border-t border-weddingBorder">
                  <td class="pt-3 text-sm font-bold text-weddingDark">Total Pago:</td>
                  <td class="pt-3 text-sm text-right font-bold text-primary">{{ total_paid.toLocaleString("pt-BR", {
                    style: "currency", currency: "BRL"
                  }) }}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <!-- Assinatura -->
          <Section class="text-center mt-8 pt-5 border-t border-weddingDivider font-sans">
            <Text class="text-sm text-weddingMuted mb-1 font-sans">
              Com carinho e gratidão,
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
