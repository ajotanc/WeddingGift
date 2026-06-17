export interface TenantSettings {
	id: string;
	slug: string;
	coupleName: string;
	groomName?: string;
	brideName?: string;
	coupleHistory?: string;
	pixKey: string;
	status: "active" | "inactive";
	theme: {
		primaryColor: string;
		backgroundImage?: string; // optional background image URL
		backgroundColor?: string; // optional header background color (hex or CSS class)
	};
	createdAt: number;
	eventDate?: string; // ISO string for the event date
	eventTime?: string; // string for the event time
	eventLocation?: string; // address string for the event location
	settings?: {
		guestLimit?: number; // optional guest limit
		showCountdown?: boolean; // toggle to show/hide countdown
	};
}

export interface StoreOffer {
	merchant: string;
	price?: string;
	link: string;
	thumbnail?: string;
}

export interface Product {
	id: string;
	tenantId: string;
	type: "physical" | "quota";
	name: string;
	desiredQuantity?: number;
	claimedQuantity?: number;
	totalValue?: number; // Used for quotas
	fixedQuotaValue?: number; // Used for quotas
	price?: number; // Used for physical
	links?: StoreOffer[]; // Used for physical
	imageUrl?: string;
	category?: string;
	createdAt: number;
}

export interface SerperItem {
	title: string;
	snippet?: string;
	price?: string;
	source?: string;
	link: string;
	imageUrl?: string;
	thumbnail?: string;
}

export interface Guest {
	id: string;
	email: string;
	displayName: string;
	photoURL?: string;
	createdAt: number;
}

export interface Rsvp {
	id: string;
	tenantId: string;
	guestName: string;
	email: string;
	phone: string;
	status: "confirmed" | "declined";
	totalAdults: number;
	totalChildren: number;
	confirmedAt: number;
}

export interface Message {
	id: string;
	tenantId: string;
	guestName: string;
	content: string;
	createdAt: number;
}
