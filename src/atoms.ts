import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { z } from "zod";

// Auth storage with 1 month expiry
const AUTH_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type AuthData = {
	secret: string;
	expiresAt: number;
};

const authStorage = createJSONStorage<AuthData | null>(() => localStorage);
const authStorageKey = "link-ninja-auth";

const baseAuthAtom = atomWithStorage<AuthData | null>(
	authStorageKey,
	null,
	authStorage,
	{ getOnInit: true },
);

export const authAtom = atom(
	(get) => {
		const auth = get(baseAuthAtom);
		if (!auth) return null;
		if (Date.now() > auth.expiresAt) return null;
		return auth.secret;
	},
	(_get, set, secret: string | null) => {
		if (secret === null) {
			set(baseAuthAtom, null);
		} else {
			set(baseAuthAtom, {
				secret,
				expiresAt: Date.now() + AUTH_EXPIRY_MS,
			});
		}
	},
);

// Form schema definition for type safety
export const formSchema = z.object({
	tags: z.array(z.string()).min(1, "At least one tag is required").default([]),
	slug: z.string().min(3, "Slug must be at least 3 characters").trim(),
	content: z.string().min(1, "Content is required").trim(),
	timestamp: z.date().default(new Date()),
});

export type FormData = z.infer<typeof formSchema>;

// Default form state
export const defaultFormState: FormData = {
	tags: [],
	slug: "",
	content: "",
	timestamp: new Date(),
};

const formStateKey = "blog-extension-form";
export const formStateAtom = atomWithStorage<FormData>(
	formStateKey,
	defaultFormState,
	undefined,
	{ getOnInit: true },
);

type TagsResponse = {
	tags: string[];
};

export const tagsAtom = atom(async () => {
	try {
		const response = await fetch("https://staffordwilliams.com/tags.json");
		const data: TagsResponse = await response.json();
		return data.tags;
	} catch (error) {
		console.error("Failed to fetch tags:", error);
		return [];
	}
});
