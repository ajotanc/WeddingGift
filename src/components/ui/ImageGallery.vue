<script setup lang="ts">
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { UnwrapRefCarouselApi } from "@/components/ui/carousel/interface";
import type { IGalleryImage } from "@/services/gallery.service";
import { Heart, Trash2, X } from "lucide-vue-next";
import { nextTick, ref, watch } from "vue";

import Autoplay from "embla-carousel-autoplay";

const props = withDefaults(
  defineProps<{
    images: IGalleryImage[];
    carousel?: boolean;
    isAdmin?: boolean;
    currentGuestId?: string;
    autoplay?: boolean;
  }>(),
  {
    carousel: false,
    isAdmin: false,
    currentGuestId: "",
    autoplay: false,
  },
);

const emit = defineEmits<{
  (e: "like", image: IGalleryImage): void;
  (e: "delete", image: IGalleryImage): void;
}>();

// Lightbox state
const activeLightboxImage = ref<IGalleryImage | null>(null);

const openLightbox = (img: IGalleryImage) => {
  activeLightboxImage.value = img;
};

const closeLightbox = () => {
  activeLightboxImage.value = null;
};

// Carousel state & API
const api = ref<UnwrapRefCarouselApi | null>(null);
const current = ref(1);
const count = ref(0);

function onInitApi(val: UnwrapRefCarouselApi) {
  if (!val) return;
  api.value = val;
  count.value = val.scrollSnapList().length;
  current.value = val.selectedScrollSnap() + 1;

  val.on("select", () => {
    current.value = val.selectedScrollSnap() + 1;
  });
}

// Keep indicators updated when images array changes
watch(
  () => props.images,
  () => {
    if (api.value) {
      nextTick(() => {
        api.value?.reInit();
        count.value = api.value?.scrollSnapList().length || 0;
        current.value = (api.value?.selectedScrollSnap() || 0) + 1;
      });
    }
  },
  { deep: true },
);

// Check if current user is allowed to delete this image
const canDeleteImage = (img: IGalleryImage) => {
  if (props.isAdmin) return true;
  if (!props.currentGuestId) return false;
  return img.guest?.$id === props.currentGuestId;
};
</script>

<template>
  <div>
    <!-- CAROUSEL MODE -->
    <div v-if="props.carousel" class="relative w-full">
      <Carousel @init-api="onInitApi"
        :plugins="props.autoplay ? [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })] : []"
        class="w-full relative group/carousel">
        <CarouselContent class="-ml-4">
          <CarouselItem v-for="img in props.images" :key="img.$id" class="pl-4 basis-full md:basis-1/5">
            <div
              class="group relative aspect-square rounded-3xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm cursor-pointer"
              @click="openLightbox(img)">
              <img :src="img.image_url"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy" />

              <!-- Hover Overlay -->
              <div
                class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4 bg-black/50 backdrop-blur-[2px] z-10 text-white">
                <!-- Actions Top -->
                <div class="flex items-center justify-between w-full">
                  <div class="text-xs text-white/70">
                    {{ img.guest ? `Por ${img.guest.name}` : 'Noivos' }}
                  </div>
                  <button v-if="canDeleteImage(img)" type="button" @click.stop="emit('delete', img)"
                    class="bg-white/20 hover:bg-red-500 hover:text-white text-white p-2 rounded-full backdrop-blur-sm transition-all duration-200 cursor-pointer border-0 outline-none">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>

                <!-- Caption & Likes Bottom -->
                <div class="flex flex-col gap-2 text-left w-full mt-auto">
                  <p v-if="img.caption" class="text-sm font-medium line-clamp-3 text-white">
                    "{{ img.caption }}"
                  </p>
                  <div class="flex items-center justify-between">
                    <button type="button" @click.stop="emit('like', img)"
                      class="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/25 bg-white/10 hover:bg-white/20 transition-all cursor-pointer active:scale-95">
                      <Heart class="w-4 h-4 transition-colors"
                        :class="img.likes?.includes(props.currentGuestId) ? 'fill-red-500 text-red-500 border-none' : 'text-white'" />
                      <span class="font-semibold text-xs">{{ img.likes?.length || 0 }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>
        </CarouselContent>

        <!-- Carousel navigation arrows -->
        <CarouselPrevious
          class="left-2 md:-left-12 opacity-80 md:opacity-0 md:group-hover/carousel:opacity-100 transition-opacity z-20 bg-white/90 text-slate-800 shadow-md hover:bg-white border-0" />
        <CarouselNext
          class="right-2 md:-right-12 opacity-80 md:opacity-0 md:group-hover/carousel:opacity-100 transition-opacity z-20 bg-white/90 text-slate-800 shadow-md hover:bg-white border-0" />
      </Carousel>

      <!-- Horizontal Dash/Pill Indicators -->
      <div v-if="count > 1" class="flex justify-center gap-1.5 mt-6">
        <button v-for="index in count" :key="index" type="button" @click="api?.scrollTo(index - 1)"
          class="h-1.5 rounded-full transition-all duration-300 cursor-pointer border-0 p-0"
          :class="current === index ? 'w-8 bg-primary' : 'w-2 bg-slate-300 hover:bg-slate-400'" />
      </div>
    </div>

    <!-- GRID MODE -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      <div v-for="img in props.images" :key="img.$id"
        class="group relative aspect-square rounded-3xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm cursor-pointer"
        @click="openLightbox(img)">
        <img :src="img.image_url"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />

        <!-- Hover Overlay -->
        <div
          class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4 bg-black/50 backdrop-blur-[2px] z-10 text-white">
          <!-- Actions Top -->
          <div class="flex items-center justify-between w-full">
            <div class="text-xs text-white/70">
              <div v-if="img.guest" class="flex items-center gap-2">
                <img class="w-5 h-5 rounded-full" :src="img.guest.photo_url" :alt="img.guest.name" />
                <span>{{ img.guest.name }}</span>
              </div>
              <span v-else>Noivos</span>
            </div>
            <button v-if="canDeleteImage(img)" type="button" @click.stop="emit('delete', img)"
              class="bg-white/20 hover:bg-red-500 hover:text-white text-white p-2 rounded-full backdrop-blur-sm transition-all duration-200 cursor-pointer border-0 outline-none">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <!-- Caption & Likes Bottom -->
          <div class="flex flex-col gap-2 text-left w-full mt-auto">
            <p v-if="img.caption" class="text-sm font-medium line-clamp-3 text-white">
              "{{ img.caption }}"
            </p>
            <div class="flex items-center justify-between">
              <button type="button" @click.stop="emit('like', img)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/25 bg-white/10 hover:bg-white/20 transition-all cursor-pointer active:scale-95">
                <Heart class="w-4 h-4 transition-colors"
                  :class="img.likes?.includes(props.currentGuestId) ? 'fill-red-500 text-red-500 border-none' : 'text-white'" />
                <span class="font-semibold text-xs">{{ img.likes?.length || 0 }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox Modal -->
    <div v-if="activeLightboxImage" class="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
      @click="closeLightbox">
      <button type="button" @click="closeLightbox"
        class="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full border-0 outline-none cursor-pointer backdrop-blur-sm transition-colors z-[110]">
        <X class="w-8 h-8" />
      </button>

      <div class="flex flex-col max-w-full max-h-[90vh]" @click.stop>

        <img :src="activeLightboxImage.image_url" class="max-h-[80vh] w-full object-contain" />

        <p v-if="activeLightboxImage.caption"
          class="text-base font-serif italic text-center text-white px-6 py-4 overflow-y-auto">
          "{{ activeLightboxImage.caption }}" — {{ activeLightboxImage.guest?.name }}
        </p>
      </div>
    </div>
  </div>
</template>
