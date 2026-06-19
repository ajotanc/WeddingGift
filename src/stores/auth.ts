import { account } from "@/lib/appwrite";
import { ConsentService } from "@/services/consent.service";
import { GuestService, type IGuest } from "@/services/guest.service";
import { type ITenant, TenantService } from "@/services/tenant.service";
import { type Models, OAuthProvider } from "appwrite";
import dayjs from "dayjs";
import { defineStore } from "pinia";

interface AuthState {
	user: Models.User<Models.Preferences> | null;
	tenant: ITenant | null;
	guest: IGuest | null;
	loading: boolean;
}

export const useAuthStore = defineStore("auth", {
	state: (): AuthState => ({
		user: null,
		tenant: null,
		guest: null,
		loading: true,
	}),
	getters: {
		isPremium: (state): boolean => {
			if (!state.tenant) return false;
			if (state.tenant.plan === "premium") {
				if (!state.tenant.premium_until) return true;
				return dayjs(state.tenant.premium_until).isAfter(dayjs());
			}
			return false;
		},
	},
	actions: {
		async init() {
			this.loading = true;
			try {
				const sessionUser = await account.get();
				this.user = sessionUser;

				if (sessionUser) {
					try {
						const session = await account.getSession({ sessionId: "current" });

						if (
							session.provider === "google" &&
							session.providerAccessToken &&
							!sessionUser.prefs?.photoURL
						) {
							const res = await fetch(
								`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${session.providerAccessToken}`,
							);
							const data = (await res.json()) as { picture?: string };

							if (data.picture) {
								await account.updatePrefs({
									prefs: {
										...sessionUser.prefs,
										photoURL: data.picture,
									},
								});
								this.user.prefs = {
									...sessionUser.prefs,
									photoURL: data.picture,
								};
							}
						}
					} catch (e) {
						console.error("Failed to fetch Google Avatar:", e);
					}

					const pending = localStorage.getItem("pending_tenant");
					if (pending) {
						const data = JSON.parse(pending) as ITenant & {
							accepted_terms?: boolean;
							accepted_terms_at?: string;
						};
						await TenantService.create(data, sessionUser.$id);
						localStorage.removeItem("pending_tenant");

						// Save LGPD consent status in User Preferences
						if (data.accepted_terms) {
							try {
								await account.updatePrefs({
									prefs: {
										...sessionUser.prefs,
										accepted_terms: true,
										accepted_terms_at: data.accepted_terms_at,
									},
								});
								this.user.prefs = {
									...sessionUser.prefs,
									accepted_terms: true,
									accepted_terms_at: data.accepted_terms_at,
								};

								await ConsentService.log({
									user_id: sessionUser.$id,
									email: sessionUser.email,
									accepted_terms: true,
									accepted_terms_at:
										data.accepted_terms_at || dayjs().toISOString()
								});
							} catch (e) {
								console.error("Failed to update user consent preferences:", e);
							}
						}

						const t = await TenantService.get(sessionUser.$id);
						this.tenant = this.sanitizeTenant(t);
						const g = await GuestService.get(sessionUser.$id);
						this.guest = g?.$id
							? g
							: ({
									$id: sessionUser.$id,
									email: sessionUser.email,
									name: sessionUser.name,
								} as IGuest);
						return;
					}

					try {
						const t = await TenantService.get(sessionUser.$id);
						this.tenant = this.sanitizeTenant(t);
					} catch (e) {
						this.tenant = null;
					}

					try {
						const g = await GuestService.get(sessionUser.$id);
						this.guest = g?.$id
							? g
							: ({
									$id: sessionUser.$id,
									email: sessionUser.email,
									name: sessionUser.name,
								} as IGuest);
					} catch (e) {
						this.guest = {
							$id: sessionUser.$id,
							email: sessionUser.email,
							name: sessionUser.name,
						} as IGuest;
					}
				}
			} catch (err) {
				this.user = null;
				this.tenant = null;
				this.guest = null;
			} finally {
				this.loading = false;
			}
		},
		async loginWithGoogle(successUrl: string, failureUrl: string) {
			account.createOAuth2Session({
				provider: OAuthProvider.Google,
				success: successUrl,
				failure: failureUrl,
				scopes: [
					"https://www.googleapis.com/auth/userinfo.email",
					"https://www.googleapis.com/auth/userinfo.profile",
					"openid",
				],
			});
		},
		async logout() {
			try {
				await account.deleteSession({ sessionId: "current" });
			} catch (e) {
				console.error(e);
			}
			this.user = null;
			this.tenant = null;
			this.guest = null;
		},
		async registerTenant(data: ITenant) {
			if (!this.user) return;
			const t = await TenantService.create(data, this.user.$id);
			this.tenant = this.sanitizeTenant(t);
		},
		async upgradeTenant(planType: "quarterly" | "semestral") {
			if (!this.tenant) return;
			const months = planType === "quarterly" ? 3 : 6;
			const expiresAt = dayjs().add(months, "month");

			const updated = await TenantService.update(this.tenant.$id, {
				plan: "premium",
				premium_until: expiresAt.toISOString(),
			});

			this.tenant = this.sanitizeTenant(updated);
		},
		sanitizeTenant(t: ITenant): ITenant {
			const copy = { ...t };
			if (!this.isPremium) {
				const freeColors = ["#ec4899", "#2e7d32", "#d4af37", "#1976d2"];
				if (!freeColors.includes(copy.primary_color)) {
					copy.primary_color = "#ec4899";
				}
				const freeBackgrounds = ["#ffffff", "#f8fafc", "#fffaf0", "#f5f5f4"];
				if (
					copy.background_color &&
					!freeBackgrounds.includes(copy.background_color)
				) {
					copy.background_color = "#ffffff";
				}
				copy.title_font = "playfair";
				copy.body_font = "inter";
				copy.show_countdown = false;
				copy.music_url = null;
				copy.ambient_effect = null;
			}
			return copy;
		},
	},
});
