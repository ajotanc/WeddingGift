import { ref } from "vue";

const isFeedbackOpen = ref(false);

export function useFeedback() {
	const openFeedback = () => {
		isFeedbackOpen.value = true;
	};

	const closeFeedback = () => {
		isFeedbackOpen.value = false;
	};

	return {
		isFeedbackOpen,
		openFeedback,
		closeFeedback,
	};
}
