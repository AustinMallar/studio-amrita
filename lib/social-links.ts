export const SOCIAL_LINKS = {
  instagram: {
    href: "https://www.instagram.com/shopstudioamrita/",
    label: "Instagram",
    handle: "@shopstudioamrita",
  },
  tiktok: {
    href: "https://www.tiktok.com/@shopstudioamrita",
    label: "TikTok",
    handle: "@shopstudioamrita",
  },
} as const;

export type SocialPlatform = keyof typeof SOCIAL_LINKS;
