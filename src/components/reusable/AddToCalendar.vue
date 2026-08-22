<script setup lang="ts">
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import { Calendar, ChevronDown, Download, ExternalLink } from "lucide-vue-next";
import { computed, ref } from "vue";

const props = defineProps<{
	eventDate?: string | null;
	eventTime?: string | null;
	coupleName?: string | null;
	eventLocation?: string | null;
	weddingUrl?: string | null;
}>();

const isOpen = ref(false);

const title = computed(() => {
	return props.coupleName
		? `Casamento de ${props.coupleName}`
		: "Casamento Inesquecível";
});

const startDateTime = computed(() => {
	if (!props.eventDate) return dayjs();
	const timeStr = props.eventTime || "18:00";
	const [hours, minutes] = timeStr.split(":").map((n) => Number(n) || 0);
	return dayjs(props.eventDate).hour(hours).minute(minutes).second(0);
});

const endDateTime = computed(() => {
	return startDateTime.value.add(5, "hour");
});

const weddingWebsiteUrl = computed(() => {
	if (props.weddingUrl) return props.weddingUrl;
	if (typeof window !== "undefined") return window.location.href;
	return "";
});

const eventDescription = computed(() => {
	const baseText = `Celebrando o amor de ${props.coupleName || "nosso casal favorito"}!`;
	const url = weddingWebsiteUrl.value;
	return url ? `${baseText}\n\nAcesse nosso site: ${url}` : baseText;
});

const googleCalendarUrl = computed(() => {
	const startFormatted = startDateTime.value
		.toDate()
		.toISOString()
		.replace(/-|:|\.\d\d\d/g, "");
	const endFormatted = endDateTime.value
		.toDate()
		.toISOString()
		.replace(/-|:|\.\d\d\d/g, "");

	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: title.value,
		dates: `${startFormatted}/${endFormatted}`,
		details: eventDescription.value,
		location: props.eventLocation || "",
	});

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
});

const outlookWebUrl = computed(() => {
	const startIso = startDateTime.value.toISOString();
	const endIso = endDateTime.value.toISOString();

	const params = new URLSearchParams({
		path: "/calendar/action/compose",
		rru: "addevent",
		subject: title.value,
		startdt: startIso,
		enddt: endIso,
		body: eventDescription.value,
		location: props.eventLocation || "",
	});

	return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
});

const downloadIcs = () => {
	const formatDateForIcs = (d: dayjs.Dayjs) => {
		return d
			.toDate()
			.toISOString()
			.replace(/-|:|\.\d\d\d/g, "");
	};

	const icsDescription = eventDescription.value.replace(/\n/g, "\\n");

	const icsContent = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//WeddingGift//Casamento//PT",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"BEGIN:VEVENT",
		`SUMMARY:${title.value}`,
		`DTSTART:${formatDateForIcs(startDateTime.value)}`,
		`DTEND:${formatDateForIcs(endDateTime.value)}`,
		`LOCATION:${props.eventLocation || ""}`,
		`DESCRIPTION:${icsDescription}`,
		...(weddingWebsiteUrl.value ? [`URL:${weddingWebsiteUrl.value}`] : []),
		"STATUS:CONFIRMED",
		"END:VEVENT",
		"END:VCALENDAR",
	].join("\r\n");

	const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = `Casamento_${(props.coupleName || "Noivos").replace(/\s+/g, "_")}.ics`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	isOpen.value = false;
};
</script>

<template>
	<div class="relative inline-block text-left w-full max-w-xs">
		<Button type="button" variant="outline"
			class="w-full h-11 rounded-xl px-5 bg-white border border-slate-200 hover:border-primary/50 text-slate-800 font-semibold text-xs uppercase tracking-wider shadow-xs flex items-center justify-between gap-2 transition-all cursor-pointer"
			@click="isOpen = !isOpen">
			<span class="flex items-center gap-2">
				<Calendar class="w-4 h-4 text-primary shrink-0" />
				<span>Adicionar ao Calendário</span>
			</span>
			<ChevronDown class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': isOpen }" />
		</Button>

		<!-- Dropdown options -->
		<div v-if="isOpen"
			class="absolute left-0 right-0 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
			<a :href="googleCalendarUrl" target="_blank" rel="noopener noreferrer"
				@click="isOpen = false"
				class="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">
				<span class="font-medium">Google Calendar</span>
				<ExternalLink class="w-3.5 h-3.5 text-slate-400" />
			</a>

			<button type="button" @click="downloadIcs"
				class="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors text-left cursor-pointer">
				<span class="font-medium">Apple Calendar / iCal</span>
				<Download class="w-3.5 h-3.5 text-slate-400" />
			</button>

			<a :href="outlookWebUrl" target="_blank" rel="noopener noreferrer"
				@click="isOpen = false"
				class="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">
				<span class="font-medium">Outlook Web</span>
				<ExternalLink class="w-3.5 h-3.5 text-slate-400" />
			</a>
		</div>
	</div>
</template>
