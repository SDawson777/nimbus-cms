const remoteUrl = 'https://preview.jars.com'
const localUrl = 'http://localhost:3000'

export default function resolvePreviewUrl(doc: {_type: string; slug?: {current: string}}) {
  const base = window?.location?.hostname === 'localhost' ? localUrl : remoteUrl
  const path = doc.slug?.current ? `/${doc.slug.current}` : ''
  return `${base}${path}`
}
