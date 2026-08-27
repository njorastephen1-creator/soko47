import { useEffect } from "react";
export function useSeo(opts: { title?: string; description?: string; image?: string; url?: string; type?: string }) {
  const { title, description, image, url, type } = opts;
  useEffect(() => {
    if (title) document.title = title;
    const setMeta = (attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector('meta[' + attr + '="' + key + '"]') as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    if (description) { setMeta("name", "description", description); setMeta("property", "og:description", description); }
    if (title) setMeta("property", "og:title", title);
    if (image) setMeta("property", "og:image", image);
    if (url) setMeta("property", "og:url", url);
    setMeta("property", "og:type", type || "website");
    setMeta("property", "og:site_name", "Soko47");
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
  }, [title, description, image, url, type]);
}
