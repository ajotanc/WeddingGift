<script setup lang="ts">
import SectionHeader from "@/components/public/SectionHeader.vue";
import { Button } from "@/components/ui/button";
import Whatsapp from "@/components/ui/icons/Whatsapp.vue";
import type { IQuizQuestion } from "@/services/quiz.service";
import confetti from "canvas-confetti";
import {
	ArrowRight,
	CheckCircle2,
	RefreshCw,
	Trophy,
	XCircle,
} from "lucide-vue-next";
import { computed, ref, watch } from "vue";

const props = withDefaults(
	defineProps<{
		quizzes: IQuizQuestion[];
		coupleName?: string;
		hideHeader?: boolean;
	}>(),
	{
		hideHeader: false,
	},
);

const quizQuestionsList = computed<IQuizQuestion[]>(() => {
	return props.quizzes || [];
});

const currentStep = ref(0);
const selectedAnswers = ref<number[]>([]);
const isAnswered = ref(false);
const score = ref(0);
const isCompleted = ref(false);

const totalQuestions = computed(() => quizQuestionsList.value.length);
const currentQuestion = computed<IQuizQuestion | null>(
	() => quizQuestionsList.value[currentStep.value] || null,
);

const resultTitle = computed(() => {
	if (score.value === totalQuestions.value) return "🎉 Sensacional!";
	if (score.value >= Math.ceil(totalQuestions.value * 0.6))
		return "👏 Muito Bem!";
	return "😄 Foi por Pouco!";
});

const triggerConfetti = () => {
	try {
		const duration = 2500;
		const animationEnd = Date.now() + duration;
		const defaults = {
			startVelocity: 30,
			spread: 360,
			ticks: 80,
			zIndex: 99999,
		};

		const randomInRange = (min: number, max: number) => {
			return Math.random() * (max - min) + min;
		};

		// 1. Explosão inicial centralizada
		confetti({
			particleCount: 120,
			spread: 140,
			origin: { x: 0.5, y: 0.4 },
			zIndex: 99999,
		});

		// 2. Canhões laterais
		confetti({
			particleCount: 80,
			angle: 60,
			spread: 70,
			origin: { x: 0, y: 0.8 },
			zIndex: 99999,
		});
		confetti({
			particleCount: 80,
			angle: 120,
			spread: 70,
			origin: { x: 1, y: 0.8 },
			zIndex: 99999,
		});

		// 3. Chuva contínua cobrindo toda a extensão da tela
		const interval: ReturnType<typeof setInterval> = setInterval(() => {
			const timeLeft = animationEnd - Date.now();

			if (timeLeft <= 0) {
				return clearInterval(interval);
			}

			const particleCount = 40 * (timeLeft / duration);

			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.1, 0.45), y: Math.random() - 0.2 },
			});
			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.55, 0.9), y: Math.random() - 0.2 },
			});
		}, 200);
	} catch (e) {
		console.error("Erro ao disparar confetes:", e);
	}
};

watch(isCompleted, (completed) => {
	if (completed) {
		setTimeout(() => {
			triggerConfetti();
		}, 100);
	}
});

const selectOption = (index: number) => {
	if (isAnswered.value || !currentQuestion.value) return;
	selectedAnswers.value[currentStep.value] = index;
	isAnswered.value = true;

	if (index === currentQuestion.value.correct_index) {
		score.value += 1;
	}
};

const nextQuestion = () => {
	if (currentStep.value < totalQuestions.value - 1) {
		currentStep.value += 1;
		isAnswered.value = false;
	} else {
		isCompleted.value = true;
	}
};

const restartQuiz = () => {
	currentStep.value = 0;
	selectedAnswers.value = [];
	isAnswered.value = false;
	score.value = 0;
	isCompleted.value = false;
};

const shareOnWhatsapp = () => {
	const couple = props.coupleName || "Noivos";
	const siteUrl = typeof window !== "undefined" ? window.location.href : "";
	const message = `*Quiz do Casal* — ${couple}\nAcabei de jogar e acertei *${score.value}* de *${totalQuestions.value}* perguntas! 🏆\nSerá que você conhece eles tão bem quanto eu? Acesse o site dos noivos e tente superar minha nota:\n${siteUrl}`;
	const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
	window.open(url, "_blank");
};
</script>

<template>
	<section v-if="quizQuestionsList.length > 0" id="quiz" class="scroll-mt-16 text-center">
		<div class="max-w-2xl mx-auto" :class="{ 'space-y-6': !hideHeader }">
			<!-- Header -->
			<SectionHeader
				v-if="!hideHeader"
				tag="Interatividade"
				title="Quiz do Casal"
				:description="`Será que você conhece a história e os segredos de ${coupleName || 'nossos noivos'}? Responda o quiz rápido!`"
				responsive />

			<!-- Quiz Container Card -->
			<div
				:class="[
					hideHeader
						? 'bg-transparent border-0 p-0 shadow-none text-left relative overflow-hidden'
						: 'bg-white border border-slate-200/80 rounded-[2rem] p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.02)] text-left relative overflow-hidden'
				]">

				<!-- Quiz Completed Result Card -->
				<div v-if="isCompleted" class="text-center py-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
					<div
						class="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto shadow-inner">
						<Trophy class="w-10 h-10 text-primary" />
					</div>

					<div class="space-y-2">
						<span class="text-xs uppercase font-bold tracking-widest text-primary">Resultado Final</span>
						<h3 class="text-3xl font-serif font-bold text-slate-900">
							{{ resultTitle }}
						</h3>
						<p class="text-slate-600 font-light text-sm max-w-sm mx-auto">
							Você acertou <strong class="text-slate-900 font-bold text-base">{{ score }}</strong> de <strong
								class="text-slate-900 font-bold text-base">{{ totalQuestions }}</strong> perguntas sobre o casal.
						</p>
					</div>

					<div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 max-w-md mx-auto">
						<Button @click="shareOnWhatsapp"
							class="w-full sm:flex-1 h-11 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs uppercase tracking-wider gap-2 shadow-sm border-0">
							<Whatsapp class="w-4 h-4 fill-white shrink-0" />
							<span>WhatsApp</span>
						</Button>
						<Button variant="outline" @click="restartQuiz"
							class="w-full sm:flex-1 h-11 rounded-xl border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider gap-2">
							<RefreshCw class="w-4 h-4" /> Jogar Novamente
						</Button>
					</div>
				</div>

				<!-- Active Question Flow -->
				<div v-else-if="currentQuestion" class="space-y-6">
					<!-- Progress Bar & Counter -->
					<div class="space-y-2">
						<div class="flex justify-between items-center text-xs font-semibold text-slate-500">
							<span>Pergunta {{ currentStep + 1 }} de {{ totalQuestions }}</span>
							<span class="text-primary font-bold">{{ Math.round(((currentStep + 1) / totalQuestions) * 100) }}%</span>
						</div>
						<div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
							<div class="bg-primary h-full transition-all duration-300"
								:style="{ width: `${((currentStep + 1) / totalQuestions) * 100}%` }"></div>
						</div>
					</div>

					<!-- Question Title -->
					<h3 class="text-xl font-serif font-semibold text-slate-900 flex items-start gap-2.5">
						<span>{{ currentQuestion.question }}</span>
					</h3>

					<!-- Options list -->
					<div class="space-y-3">
						<button v-for="(opt, idx) in currentQuestion.options" :key="idx" type="button" @click="selectOption(idx)"
							:disabled="isAnswered"
							class="w-full p-4 rounded-xl border text-left font-medium text-sm transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default"
							:class="[
								isAnswered
									? idx === currentQuestion.correct_index
										? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold shadow-xs'
										: selectedAnswers[currentStep] === idx
											? 'bg-rose-50 border-rose-300 text-rose-900'
											: 'bg-slate-50/50 border-slate-200 opacity-60 text-slate-500'
									: 'bg-white border-slate-200 hover:border-primary/60 hover:bg-slate-50/80 text-slate-700'
							]">
							<span>{{ opt }}</span>
							<template v-if="isAnswered">
								<CheckCircle2 v-if="idx === currentQuestion.correct_index" class="w-5 h-5 text-emerald-600 shrink-0" />
								<XCircle v-else-if="selectedAnswers[currentStep] === idx" class="w-5 h-5 text-rose-500 shrink-0" />
							</template>
						</button>
					</div>

					<!-- Next Question Action -->
					<div v-if="isAnswered" class="pt-3 flex justify-end animate-in fade-in duration-200">
						<Button @click="nextQuestion"
							class="rounded-xl px-6 h-11 bg-primary hover:bg-primary/90 text-white font-semibold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2">
							<span>{{ currentStep < totalQuestions - 1 ? 'Próxima Pergunta' : 'Ver Meu Resultado' }}</span>
							<ArrowRight v-if="currentStep < totalQuestions - 1" class="w-4 h-4" />
							<Trophy v-else class="w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>
