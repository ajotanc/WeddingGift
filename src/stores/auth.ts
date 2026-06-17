import { account } from "@/lib/appwrite";
import { GuestService, type IGuest } from "@/services/guest.service";
import { type ITenant, TenantService } from "@/services/tenant.service";
import { type Models, OAuthProvider } from "appwrite";
import { defineStore } from "pinia";

interface AuthState {
	user: Models.User<Models.Preferences> | null;
	tenant: ITenant | null; // Alterado para aceitar null
	guest: IGuest | null; // Alterado para aceitar null
	loading: boolean;
}

export const useAuthStore = defineStore("auth", {
	state: (): AuthState => ({
		user: null,
		tenant: null, // Começa estritamente como null
		guest: null, // Começa estritamente como null
		loading: true,
	}),
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
							const data = await res.json();

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
						const data = JSON.parse(pending);
						await TenantService.create(data, sessionUser.$id);
						localStorage.removeItem("pending_tenant");
						const t = await TenantService.get(sessionUser.$id);
						this.tenant = t;
						this.guest = await GuestService.get(sessionUser.$id);
						return;
					}

					try {
						const t = await TenantService.get(sessionUser.$id);
						this.tenant = t;
						this.guest = await GuestService.get(sessionUser.$id);
					} catch (e) {
						this.tenant = null;
						this.guest = null;
					}
				}
			} catch (err) {
				// Certifica que o estado fica nulo caso não haja sessão ativa
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
				scopes: ["profile", "email"],
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
			this.tenant = t;
		},
	},
});
