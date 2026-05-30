import "server-only";

export type InstagramPost = {
  id: string;
  permalink: string;
  imageUrl: string;
  alt: string;
};

type GraphMediaNode = {
  id?: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
};

/**
 * Fetches recent Instagram posts via the Meta Graph API when configured.
 *
 * Requires a long-lived access token from a Meta app with Instagram API access:
 *   INSTAGRAM_ACCESS_TOKEN
 *   INSTAGRAM_USER_ID (optional — defaults to "me")
 *
 * @see https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
 */
export async function getInstagramPosts(limit = 6): Promise<InstagramPost[] | null> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!token) return null;

  const userId = process.env.INSTAGRAM_USER_ID?.trim() || "me";

  try {
    const url = new URL(`https://graph.instagram.com/${userId}/media`);
    url.searchParams.set(
      "fields",
      "id,caption,media_type,media_url,permalink,thumbnail_url",
    );
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("access_token", token);

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const json = (await res.json()) as { data?: GraphMediaNode[] };
    const nodes = json.data ?? [];

    const posts = nodes
      .map((node) => {
        if (!node.id || !node.permalink) return null;

        const imageUrl =
          node.media_type === "VIDEO"
            ? node.thumbnail_url || node.media_url
            : node.media_url;

        if (!imageUrl) return null;

        const alt = node.caption?.trim().slice(0, 120) || "Studio Amrita on Instagram";

        return {
          id: node.id,
          permalink: node.permalink,
          imageUrl,
          alt,
        } satisfies InstagramPost;
      })
      .filter((post): post is InstagramPost => post != null);

    return posts.length > 0 ? posts : null;
  } catch {
    return null;
  }
}
