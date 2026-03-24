import env from "@/config/env"

function toCloudinaryUrl(src: string): string {
  if (!src) return src
  if (src.startsWith("http://") || src.startsWith("https://")) return src

  const cloudName = env.cloudinaryCloudName
  if (!cloudName) return src

  const normalized = src.replace(/^\/+/, "")
  return `https://res.cloudinary.com/${cloudName}/image/upload/${normalized}`
}

export function transformCloudinaryUrl(
  src: string,
  transformations: string
): string {
  const url = toCloudinaryUrl(src)
  if (!url.includes("/upload/")) return url

  return url.replace("/upload/", `/upload/${transformations}/`)
}

export function cloudinarySizes(src: string) {
  return {
    thumb: transformCloudinaryUrl(
      src,
      "w_200,c_limit,c_fill,q_auto,f_auto"
    ),
    cover: transformCloudinaryUrl(
      src,
      "w_480,c_limit,c_fill,q_auto,f_auto"
    ),
    preview: transformCloudinaryUrl(
      src,
      "w_1280,c_limit,q_auto,f_auto"
    ),
  }
}
