import { account } from "@/lib/appwrite";
import {
	DEFAULT_BACKGROUND_COLOR,
	DEFAULT_BODY_FONT,
	DEFAULT_PRIMARY_COLOR,
	DEFAULT_TITLE_FONT,
	FREE_BACKGROUND_COLORS,
	FREE_PRIMARY_COLORS,
} from "@/lib/defaults";
import { ConsentService } from "@/services/consent.service";
import { GuestService, type IGuest } from "@/services/guest.service";
import { type ITenant, TenantService } from "@/services/tenant.service";
import { type Models, OAuthProvider } from "appwrite";
import dayjs from "dayjs";
import { defineStore } from "pinia";

export interface IUserPreferences extends Models.Preferences {
	photo_url?: string;
	accepted_terms?: boolean;
	accepted_terms_at?: string;
	confirmed_age?: boolean;
	confirmed_age_at?: string;
	fetched_avatar?: boolean;
}

export type IUser = Models.User<IUserPreferences> | null;

interface AuthState {
	user: IUser;
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

			// Mock developer auth bypass for UI testing
			const isMockAuth = typeof window !== "undefined" && (localStorage.getItem("mock_auth") === "true" || window.location.search.includes("mock_auth=true"));
			if (isMockAuth) {
				this.user = {
					$id: "mock-user-123",
					name: "Convidado de Teste",
					email: "test@example.com",
					prefs: {
						accepted_terms: true,
						confirmed_age: true,
					},
					$createdAt: new Date().toISOString(),
					$updatedAt: new Date().toISOString(),
					status: true,
					emailVerification: true,
					phoneVerification: true,
					registration: new Date().toISOString(),
					passwordUpdate: new Date().toISOString(),
					phone: "+5511999999999",
					accessedAt: new Date().toISOString(),
				} as IUser;

				this.guest = {
					$id: "mock-guest-123",
					name: "Convidado de Teste",
					email: "test@example.com",
					phone: "+5511999999999",
					$createdAt: new Date().toISOString(),
					$updatedAt: new Date().toISOString(),
					$databaseId: "DBWG",
					$collectionId: "guests",
					$permissions: [],
				} as unknown as IGuest;

				this.loading = false;
				return;
			}

			try {
				const sessionUser = await account.get<IUserPreferences>();
				this.user = sessionUser;

				if (sessionUser) {
					try {
						const session = await account.getSession({ sessionId: "current" });

						if (
							session.provider === "google" &&
							session.providerAccessToken &&
							!sessionUser.prefs?.fetched_avatar
						) {
							const res = await fetch(
								`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${session.providerAccessToken}`,
							);

							let pictureUrl: string | undefined = undefined;
							if (res.ok) {
								const data = (await res.json()) as { picture?: string };
								pictureUrl = data.picture;
							} else {
								console.warn(
									`Google API returned status ${res.status} when fetching userinfo.`,
								);
							}

							const newPrefs = {
								...sessionUser.prefs,
								fetched_avatar: true,
							};

							if (pictureUrl) {
								newPrefs.photo_url = pictureUrl;
							}

							await account.updatePrefs({ prefs: newPrefs });
							if (this.user) {
								this.user.prefs = newPrefs as IUserPreferences;
							}

							if (pictureUrl && sessionUser.$id) {
								try {
									const updatedGuest = await GuestService.upsert(sessionUser.$id, {
										photo_url: pictureUrl,
										email: sessionUser.email,
										name: sessionUser.name,
									});
									this.guest = updatedGuest;
								} catch (err) {
									console.error("Failed to sync guest photo_url:", err);
								}
							}
						}
					} catch (e) {
						console.error("Failed to fetch Google Avatar:", e);
					}

					const pending = localStorage.getItem("pending_tenant");
					if (pending) {
						const data = JSON.parse(pending) as ITenant;
						const created = await TenantService.create(data, sessionUser.$id);
						localStorage.removeItem("pending_tenant");

						// Save LGPD consent status and age confirmation in User Preferences
						const pendingConsent = localStorage.getItem("pending_consent");
						if (pendingConsent) {
							const consentData = JSON.parse(pendingConsent) as {
								accepted_terms: boolean;
								accepted_terms_at: string;
								confirmed_age: boolean;
								confirmed_age_at: string;
							};
							try {
								const prefsPayload = {
									...sessionUser.prefs,
									accepted_terms: true,
									accepted_terms_at: consentData.accepted_terms_at,
									confirmed_age: consentData.confirmed_age,
									confirmed_age_at: consentData.confirmed_age_at,
								};

								await account.updatePrefs({
									prefs: prefsPayload,
								});

								if (this.user) {
									this.user.prefs = prefsPayload as IUserPreferences;
								}

								await ConsentService.log({
									user_id: sessionUser.$id,
									email: sessionUser.email,
									accepted_terms: true,
									accepted_terms_at: consentData.accepted_terms_at,
								});
							} catch (e) {
								console.error("Failed to update user consent preferences:", e);
							}
							localStorage.removeItem("pending_consent");
						}

						this.tenant = this.sanitizeTenant(created);
						try {
							const g = await GuestService.upsert(sessionUser.$id, {
								name: sessionUser.name || "Convidado",
								email: sessionUser.email || "",
								photo_url: sessionUser.prefs?.photo_url || undefined,
							});
							this.guest = g;
						} catch (e) {
							this.guest = {
								$id: sessionUser.$id,
								email: sessionUser.email,
								name: sessionUser.name,
								photo_url: sessionUser.prefs?.photo_url,
							} as IGuest;
						}
						return;
					}

					try {
						let t = await TenantService.get(sessionUser.$id);
						if (!t && sessionUser.email) {
							t = await TenantService.getByCoOwner(sessionUser.email);
						}
						this.tenant = this.sanitizeTenant(t);
					} catch (e) {
						if (sessionUser.email) {
							try {
								const tCoOwner = await TenantService.getByCoOwner(sessionUser.email);
								this.tenant = this.sanitizeTenant(tCoOwner);
							} catch (err) {
								this.tenant = null;
							}
						} else {
							this.tenant = null;
						}
					}

					try {
						const g = await GuestService.upsert(sessionUser.$id, {
							name: sessionUser.name || "Convidado",
							email: sessionUser.email || "",
							photo_url: sessionUser.prefs?.photo_url || undefined,
						});
						this.guest = g;
					} catch (e) {
						this.guest = {
							$id: sessionUser.$id,
							email: sessionUser.email,
							name: sessionUser.name,
							photo_url: sessionUser.prefs?.photo_url,
						} as IGuest;
					}
				}
			} catch (err) {
				console.error("Erro crítico no carregamento da sessão (authStore.init):", err);
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
		sanitizeTenant(t: ITenant | null): ITenant | null {
			if (!t || !t.$id) return null;
			const copy = { ...t };
			const isTenantPremium =
				copy.plan === "premium" &&
				(!copy.premium_until || dayjs(copy.premium_until).isAfter(dayjs()));
			copy.is_premium = isTenantPremium;

			if (!isTenantPremium) {
				if (!FREE_PRIMARY_COLORS.includes(copy.primary_color)) {
					copy.primary_color = DEFAULT_PRIMARY_COLOR;
				}
				if (
					copy.background_color &&
					!FREE_BACKGROUND_COLORS.includes(copy.background_color)
				) {
					copy.background_color = DEFAULT_BACKGROUND_COLOR;
				}
				copy.title_font = DEFAULT_TITLE_FONT;
				copy.body_font = DEFAULT_BODY_FONT;
				copy.show_countdown = false;
				copy.music_url = null;
				copy.ambient_effect = null;
			}
			return copy;
		},
	},
});
