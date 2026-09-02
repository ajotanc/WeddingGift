<script setup lang="ts">
import { useMusicStore } from "@/stores/music";
import { ChevronDown, ChevronUp, Music, Pause, Play, X } from "lucide-vue-next";
import { ref } from "vue";

const music = useMusicStore();
const isExpanded = ref(false);

const toggleSpotifyExpand = () => {
	isExpanded.value = !isExpanded.value;
};
</script>

<template>
	<!-- Só renderiza se for Premium e tiver URL válida -->
	<template v-if="music.isPremium">
		<!-- Provedor: YOUTUBE -->
		<template v-if="music.provider === 'youtube' && music.videoId">
			<iframe
				v-if="music.isPlaying"
				:src="`https://www.youtube-nocookie.com/embed/${music.videoId}?autoplay=1&loop=1&playlist=${music.videoId}&controls=0`"
				class="fixed w-0 h-0 opacity-0 pointer-events-none"
				allow="autoplay"
				frameborder="0"
			/>

			<div class="fixed bottom-6 left-6 z-50 flex items-center gap-3">
				<button
					type="button"
					@click="music.toggle()"
					class="text-primary bg-white/90 backdrop-blur-md border border-slate-200/60 p-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 outline-none"
					:title="music.isPlaying ? 'Pausar música' : 'Tocar música de fundo'"
				>
					<Pause v-if="music.isPlaying" class="w-5 h-5" />
					<Play v-else class="w-5 h-5" />
				</button>

				<Transition
					enter-active-class="transition duration-200 ease-out"
					enter-from-class="opacity-0 translate-x-[-10px]"
					enter-to-class="opacity-100 translate-x-0"
					leave-active-class="transition duration-150 ease-in"
					leave-from-class="opacity-100 translate-x-0"
					leave-to-class="opacity-0 translate-x-[-10px]"
				>
					<div
						v-if="!music.isPlaying"
						class="bg-white/90 backdrop-blur-md border border-slate-200/60 px-3.5 py-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] text-xs font-light text-slate-600"
					>
						Tocar música de fundo? 🎵
					</div>
				</Transition>
			</div>
		</template>

		<!-- Provedor: SPOTIFY -->
		<template v-else-if="music.provider === 'spotify' && music.spotifyEmbedUrl">
			<div class="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2 max-w-[calc(100vw-3rem)]">
				<!-- Card Expandido do Player Spotify (mantido no DOM via v-show para não interromper a reprodução ao minimizar) -->
				<Transition
					enter-active-class="transition duration-300 ease-out"
					enter-from-class="opacity-0 translate-y-4 scale-95"
					enter-to-class="opacity-100 translate-y-0 scale-100"
					leave-active-class="transition duration-200 ease-in"
					leave-from-class="opacity-100 translate-y-0 scale-100"
					leave-to-class="opacity-0 translate-y-4 scale-95"
				>
					<div
						v-show="isExpanded"
						class="w-80 sm:w-96 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col gap-2.5 overflow-hidden"
					>
						<!-- Cabeçalho do Card -->
						<div class="flex items-center justify-between px-1">
							<div class="flex items-center gap-2">
								<div class="w-6 h-6 rounded-full bg-[#1DB954]/10 text-[#1DB954] flex items-center justify-center">
									<Music class="w-3.5 h-3.5" />
								</div>
								<span class="text-xs font-medium text-slate-800">
									{{ music.spotifyData?.type === 'playlist' ? 'Playlist do Casal' : 'Música do Casal' }}
								</span>
							</div>

							<button
								type="button"
								@click="toggleSpotifyExpand"
								class="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
								title="Minimizar player"
							>
								<X class="w-4 h-4" />
							</button>
						</div>

						<!-- Iframe Oficial Spotify Embed -->
						<div class="rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
							<iframe
								:src="music.spotifyEmbedUrl"
								width="100%"
								:height="music.spotifyData?.type === 'playlist' ? '152' : '80'"
								frameBorder="0"
								allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
								loading="lazy"
								class="border-0 block"
							/>
						</div>
					</div>
				</Transition>

				<!-- Botão Flutuante (para alternar entre minimizado e expandido) -->
				<div class="flex items-center gap-2">
					<button
						type="button"
						@click="toggleSpotifyExpand"
						class="bg-white/90 backdrop-blur-md border border-slate-200/60 px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2.5 group outline-none"
						:title="isExpanded ? 'Minimizar player' : 'Abrir player do Spotify'"
					>
						<!-- Ícone Spotify com indicador sutil -->
						<div class="relative flex items-center justify-center">
							<svg class="w-5 h-5 text-[#1DB954] transition-transform group-hover:rotate-12" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.308c-.215.354-.674.464-1.027.25-2.813-1.718-6.353-2.107-10.523-1.154-.403.092-.807-.16-.9-.562-.092-.404.16-.807.562-.9 4.568-1.044 8.49-.607 11.638 1.315.353.214.464.673.25 1.051zm1.469-3.267c-.27.44-.848.579-1.288.309-3.22-1.979-8.129-2.55-11.938-1.393-.497.151-1.025-.133-1.176-.63-.151-.497.133-1.025.63-1.176 4.354-1.321 9.775-.683 13.463 1.583.44.27.579.848.309 1.307zm.126-3.41c-3.861-2.293-10.229-2.505-13.916-1.385-.593.18-1.223-.154-1.403-.747-.18-.593.154-1.223.747-1.403 4.238-1.287 11.272-1.042 15.696 1.582.534.317.708 1.011.391 1.545-.316.534-1.01.708-1.545.391z"/>
							</svg>
						</div>

						<span class="text-xs font-medium text-slate-700">
							{{ isExpanded ? 'Minimizar Player' : (music.spotifyData?.type === 'playlist' ? 'Playlist do Casal' : 'Música do Casal') }}
						</span>

						<component :is="isExpanded ? ChevronDown : ChevronUp" class="w-4 h-4 text-slate-400" />
					</button>
				</div>
			</div>
		</template>
	</template>
</template>
