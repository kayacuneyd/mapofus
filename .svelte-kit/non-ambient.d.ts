
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/admin" | "/api" | "/api/admin" | "/api/admin/maps" | "/api/admin/maps/[id]" | "/api/download" | "/api/download/[id]" | "/api/generate" | "/api/payment-webhook" | "/auth" | "/auth/login" | "/auth/logout" | "/auth/register" | "/create" | "/dashboard" | "/preview" | "/preview/[id]";
		RouteParams(): {
			"/api/admin/maps/[id]": { id: string };
			"/api/download/[id]": { id: string };
			"/preview/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string };
			"/admin": Record<string, never>;
			"/api": { id?: string };
			"/api/admin": { id?: string };
			"/api/admin/maps": { id?: string };
			"/api/admin/maps/[id]": { id: string };
			"/api/download": { id?: string };
			"/api/download/[id]": { id: string };
			"/api/generate": Record<string, never>;
			"/api/payment-webhook": Record<string, never>;
			"/auth": Record<string, never>;
			"/auth/login": Record<string, never>;
			"/auth/logout": Record<string, never>;
			"/auth/register": Record<string, never>;
			"/create": Record<string, never>;
			"/dashboard": Record<string, never>;
			"/preview": { id?: string };
			"/preview/[id]": { id: string }
		};
		Pathname(): "/" | "/admin" | "/admin/" | "/api" | "/api/" | "/api/admin" | "/api/admin/" | "/api/admin/maps" | "/api/admin/maps/" | `/api/admin/maps/${string}` & {} | `/api/admin/maps/${string}/` & {} | "/api/download" | "/api/download/" | `/api/download/${string}` & {} | `/api/download/${string}/` & {} | "/api/generate" | "/api/generate/" | "/api/payment-webhook" | "/api/payment-webhook/" | "/auth" | "/auth/" | "/auth/login" | "/auth/login/" | "/auth/logout" | "/auth/logout/" | "/auth/register" | "/auth/register/" | "/create" | "/create/" | "/dashboard" | "/dashboard/" | "/preview" | "/preview/" | `/preview/${string}` & {} | `/preview/${string}/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}