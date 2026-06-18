import { reactive, watch } from "vue";

type ConfirmOptions = {
	title: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
	// Adicionamos as funções opcionais aqui
	confirm?: () => Promise<void> | void;
	cancel?: () => void;
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
	// A função confirm agora não precisa retornar Promise<boolean>
	// se você for usar callbacks, mas manteremos a opção para flexibilidade.
	const confirm = (opts: ConfirmOptions) => {
		state.options = opts;
		state.isOpen = true;
	};

	const onConfirm = async () => {
		const action = state.options?.confirm;
		if (action) await action(); // Executa o callback de sucesso

		state.isOpen = false;
		state.options = null;
	};

	const onCancel = () => {
		const action = state.options?.cancel;
		if (action) action(); // Executa o callback de cancelamento

		state.isOpen = false;
		state.options = null;
	};

	return {
		state,
		confirm,
		onConfirm,
		onCancel,
		handleClose: (isOpen: boolean) => {
			if (!isOpen) onCancel();
		},
	};
}
