import emailjs from "@emailjs/browser";

// To use EmailJS, the user needs to create an account at emailjs.com
// and set these environment variables in their .env file.
const EMAILJS_SERVICE_ID =
	import.meta.env.VITE_EMAILJS_SERVICE_ID || "default_service";
const EMAILJS_TEMPLATE_GIFT =
	import.meta.env.VITE_EMAILJS_TEMPLATE_GIFT || "template_gift";
const EMAILJS_TEMPLATE_RSVP =
	import.meta.env.VITE_EMAILJS_TEMPLATE_RSVP || "template_rsvp";
const EMAILJS_TEMPLATE_FEEDBACK =
	import.meta.env.VITE_EMAILJS_TEMPLATE_FEEDBACK || "template_feedback";
const EMAILJS_PUBLIC_KEY =
	import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "YOUR_PUBLIC_KEY";

/**
 * Initialize EmailJS with the public key.
 * This can be done once globally, or before sending.
 */
export interface IGiftEmailParams {
	guest_name: string;
	guest_email: string;
	couple_name: string;
	product_name: string;
	quantity: number;
	total_paid: string;
	method: string;
}

export interface IRsvpEmailParams {
	guest_name: string;
	guest_email: string;
	couple_name: string;
	status: "confirmed" | "declined";
}

export const EmailService = {
	init() {
		emailjs.init(EMAILJS_PUBLIC_KEY);
	},

	async sendGiftConfirmation(params: IGiftEmailParams) {
		try {
			const response = await emailjs.send(
				EMAILJS_SERVICE_ID,
				EMAILJS_TEMPLATE_GIFT,
				{
					to_name: params.guest_name,
					to_email: params.guest_email,
					couple_name: params.couple_name,
					product_name: params.product_name,
					quantity: params.quantity,
					total_paid: params.total_paid,
					method: params.method === "pix" ? "PIX" : "Loja",
				},
				EMAILJS_PUBLIC_KEY,
			);
			console.log("SUCCESS!", response.status, response.text);
			return response;
		} catch (error) {
			console.error("FAILED...", error);
			throw error;
		}
	},

	async sendRsvpConfirmation(params: IRsvpEmailParams) {
		try {
			const response = await emailjs.send(
				EMAILJS_SERVICE_ID,
				EMAILJS_TEMPLATE_RSVP,
				{
					to_name: params.guest_name,
					to_email: params.guest_email,
					couple_name: params.couple_name,
					status_text:
						params.status === "confirmed"
							? "Presença Confirmada"
							: "Ausência Registrada",
					message_text:
						params.status === "confirmed"
							? "Que alegria! Estamos muito felizes que você celebrará conosco."
							: "Que pena! Sentiremos sua falta, mas agradecemos por nos avisar.",
				},
				EMAILJS_PUBLIC_KEY,
			);
			console.log("SUCCESS!", response.status, response.text);
			return response;
		} catch (error) {
			console.error("FAILED...", error);
			throw error;
		}
	},

	async sendFeedback(params: {
		name: string;
		email: string;
		type: string;
		message: string;
	}) {
		try {
			const response = await emailjs.send(
				EMAILJS_SERVICE_ID,
				EMAILJS_TEMPLATE_FEEDBACK,
				{
					from_name: params.name,
					from_email: params.email,
					feedback_type: params.type,
					message: params.message,
					system: "WeddingGift SaaS",
				},
				EMAILJS_PUBLIC_KEY,
			);
			console.log("FEEDBACK SUCCESS!", response.status, response.text);
			return response;
		} catch (error) {
			console.error("FEEDBACK FAILED...", error);
			throw error;
		}
	},
};
