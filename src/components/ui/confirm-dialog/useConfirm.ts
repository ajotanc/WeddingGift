import { reactive, watch } from "vue";

type ConfirmOptions = {
	title: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
};

let resolvePromise: ((value: boolean) => void) | null = null;

const state = reactive({
	isOpen: false,
	options: null as ConfirmOptions | null,
});

watch(
	() => state.isOpen,
	(newVal) => {
		if (!newVal && resolvePromise) {
			resolvePromise(false);
			resolvePromise = null;
		}
	},
);

export function useConfirm() {
	const confirm = (opts: ConfirmOptions): Promise<boolean> => {
		state.options = opts;
		state.isOpen = true;

		return new Promise((resolve) => {
			resolvePromise = resolve;
		});
	};

	const onConfirm = (e?: Event) => {
		if (e && typeof e.preventDefault === "function") e.preventDefault();
		if (resolvePromise) resolvePromise(true);
		resolvePromise = null;
		state.isOpen = false;
	};

	const onCancel = (e?: Event) => {
		if (e && typeof e.preventDefault === "function") e.preventDefault();
		if (resolvePromise) resolvePromise(false);
		resolvePromise = null;
		state.isOpen = false;
	};

	return {
		state,
		confirm,
		onConfirm,
		onCancel,
	};
}
