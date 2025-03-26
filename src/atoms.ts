import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { z } from "zod";

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
  { getOnInit: true }
);

interface TagsResponse {
  tags: string[];
}

export const tagsAtom = atom(async () => {
  try {
    const response = await fetch("http://staffordwilliams.com/tags.json");
    const data: TagsResponse = await response.json();
    return data.tags;
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return [];
  }
});
