<script setup lang="ts">
import { PROJECT_NAME } from "@/lib/defaults";
import type { IFeedbackEmailParams } from "@/services/email.service";
import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Section,
	Tailwind,
	Text,
} from "@vue-email/components";

defineProps<IFeedbackEmailParams>();

const tailwindConfig = {
	theme: {
		extend: {
			fontFamily: {
				sans: [
					"system-ui",
					"-apple-system",
					"'BlinkMacSystemFont'",
					"'Segoe UI'",
					"Roboto",
					"Helvetica",
					"Arial",
					"sans-serif",
				],
			},
			colors: {
				primary: "#c5a880",
				secondary: "#faf8f6",
				weddingDark: "#1e1a17",
				weddingBody: "#5a4f4a",
				weddingBorder: "#e8e2dd",
				weddingMuted: "#8c7a6b",
				weddingDivider: "#f5f0eb",
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
          <Heading class="m-0 font-sans text-xl font-bold text-white tracking-wide">
            Novo Feedback Recebido
          </Heading>
          <Text class="mt-1 mb-0 text-xs text-primary font-semibold uppercase tracking-wider font-sans">
            Painel do Sistema {{ PROJECT_NAME }}
          </Text>
        </Section>

        <!-- Corpo Principal -->
        <Section class="p-8 font-sans">
          <!-- Tabela de Detalhes -->
          <table class="w-full border-collapse mb-6 font-sans text-sm">
            <tbody>
              <tr>
                <td class="py-2 text-sm text-weddingBody w-36 font-medium">Enviado por:</td>
                <td class="py-2 text-sm text-weddingDark font-semibold">{{ name }} ({{ email }})</td>
              </tr>
              <tr>
                <td class="py-2 text-sm text-weddingBody font-medium">Tipo de Mensagem:</td>
                <td class="py-2 text-sm text-weddingDark">
                  <span
                    class="bg-secondary text-weddingDark px-3 py-1 rounded-md text-sm font-semibold border border-weddingBorder inline-block">
                    {{ type }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Conteúdo do Feedback -->
          <Section class="bg-secondary rounded-2xl p-5 border border-weddingBorder font-sans">
            <Text class="mt-0 mb-2 text-sm text-weddingMuted font-bold uppercase tracking-wider font-sans">
              Conteúdo da Mensagem:
            </Text>
            <Text class="m-0 text-sm leading-relaxed text-weddingDark whitespace-pre-wrap font-sans">
              {{ message }}
            </Text>
          </Section>
        </Section>

        <!-- Footer Sistema -->
        <Section class="bg-secondary p-4 text-center border-t border-weddingBorder font-sans">
          <Text class="m-0 text-xs text-weddingMuted font-sans">
            {{ PROJECT_NAME }} — Central de Suporte & Feedback
          </Text>
        </Section>
      </Container>
    </Body>

    </Html>
  </Tailwind>
</template>
