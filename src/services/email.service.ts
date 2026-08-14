import { PROJECT_NAME, SUPPORT_EMAIL } from "@/lib/defaults";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_GENERAL;

export interface IGiftEmailParams {
	guest_name: string;
	guest_email: string;
	couple_name: string;
	product_name: string;
	quantity: number;
	total_paid: number;
	image_url?: string;
	method: string;
}

export interface IRsvpEmailParams {
	guest_name: string;
	guest_email: string;
	couple_name: string;
	status: "confirmed" | "declined";
	message: string;
}

export interface IFeedbackEmailParams {
	name: string;
	email: string;
	type: string;
	message: string;
}

async function loadRenderer() {
	const { render } = await import("@vue-email/render");
	return render;
}

export const EmailService = {
	init() {
		emailjs.init(EMAILJS_PUBLIC_KEY);
	},

	async sendGiftConfirmation(params: IGiftEmailParams) {
		try {
			const subject = `${PROJECT_NAME} • Obrigado pelo seu presente: ${params.product_name}!`;
			const [render, { default: GiftEmail }] = await Promise.all([
				loadRenderer(),
				import("@/emails/GiftEmail.vue"),
			]);
			const message_html = await render(GiftEmail, params);

			const response = await emailjs.send(
				EMAILJS_SERVICE_ID,
				EMAILJS_TEMPLATE_ID,
				{
					subject,
					to_email: params.guest_email,
					from_name: params.couple_name,
					reply_to: SUPPORT_EMAIL,
					message_html,
				},
				EMAILJS_PUBLIC_KEY,
			);
			return response;
		} catch (error) {
			console.error("FAILED...", error);
			throw error;
		}
	},

	async sendRsvpConfirmation(params: IRsvpEmailParams) {
		try {
			const message =
				params.status !== "confirmed"
					? "Que pena! Sentiremos sua falta, mas agradecemos por nos avisar."
					: params.message;

			const subject = `${PROJECT_NAME} • Confirmação de Presença`;
			const [render, { default: RsvpEmail }] = await Promise.all([
				loadRenderer(),
				import("@/emails/RsvpEmail.vue"),
			]);
			const message_html = await render(RsvpEmail, { ...params, message });
			const response = await emailjs.send(
				EMAILJS_SERVICE_ID,
				EMAILJS_TEMPLATE_ID,
				{
					subject,
					to_email: params.guest_email,
					from_name: params.couple_name,
					reply_to: SUPPORT_EMAIL,
					message_html,
				},
				EMAILJS_PUBLIC_KEY,
			);
			return response;
		} catch (error) {
			console.error("FAILED...", error);
			throw error;
		}
	},

	async sendFeedback(params: IFeedbackEmailParams) {
		try {
			const subject = `${PROJECT_NAME} • Feedback`;
			const [render, { default: FeedbackEmail }] = await Promise.all([
				loadRenderer(),
				import("@/emails/FeedbackEmail.vue"),
			]);
			const message_html = await render(FeedbackEmail, params);
			const response = await emailjs.send(
				EMAILJS_SERVICE_ID,
				EMAILJS_TEMPLATE_ID,
				{
					subject,
					to_email: SUPPORT_EMAIL,
					from_name: `Suporte ${PROJECT_NAME}`,
					reply_to: params.email,
					message_html,
				},
				EMAILJS_PUBLIC_KEY,
			);
			return response;
		} catch (error) {
			console.error("FAILED...", error);
			throw error;
		}
	},
};
