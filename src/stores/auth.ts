import { account } from "@/lib/appwrite";
import { GuestService, IGuest } from "@/services/guest.service";
import {
	type ITenant,
	TenantService
} from "@/services/tenant.service";
import { type Models, OAuthProvider } from "appwrite";
import { defineStore } from "pinia";

interface AuthState {
	user: Models.User<Models.Preferences> | null;
	tenant: ITenant;
	guest: IGuest;
	loading: boolean;
}

export const useAuthStore = defineStore("auth", {
	state: (): AuthState => ({
		user: null,
		tenant: {} as ITenant,
		guest: {} as IGuest,
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
									}
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

						window.location.href = `/${data.slug}/admin`;
						return;
					}

					const t = await TenantService.get(sessionUser.$id);
					this.tenant = t;

					this.guest = await GuestService.get(sessionUser.$id);
				}
			} catch (err) {
				this.user = null;
				this.tenant = {} as ITenant;
				this.guest = {} as IGuest;
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
			await account.deleteSession({ sessionId: "current" });
			this.user = null;
			this.tenant = {} as ITenant;
			this.guest = {} as IGuest
		},
		async registerTenant(data: ITenant) {
			if (!this.user) return;
			const t = await TenantService.create(data, this.user.$id);
			this.tenant = t;
		},
	},
});
