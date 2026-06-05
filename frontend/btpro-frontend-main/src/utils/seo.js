import { useEffect } from 'react'

const BASE_URL = 'https://planneralger.com'
const OG_IMAGE = `${BASE_URL}/og-image.png`

function setMeta(attr, key, value) {
    let el = document.querySelector(`meta[${attr}="${key}"]`)
    if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
    }
    el.setAttribute('content', value)
}

function setLink(rel, href) {
    let el = document.querySelector(`link[rel="${rel}"]`)
    if (!el) {
        el = document.createElement('link')
        el.setAttribute('rel', rel)
        document.head.appendChild(el)
    }
    el.setAttribute('href', href)
}

function setSchema(id, data) {
    let el = document.getElementById(id)
    if (!el) {
        el = document.createElement('script')
        el.id = id
        el.type = 'application/ld+json'
        document.head.appendChild(el)
    }
    el.textContent = JSON.stringify(data)
    return () => { el.remove() }
}

export default function useSEO({ title, description, path = '/', schema = null }) {
    const canonical = `${BASE_URL}${path}`
    const fullTitle = title.includes('Planner') ? title : `${title} — Planner`

    useEffect(() => {
        document.title = fullTitle
        setMeta('name', 'description', description)
        setLink('canonical', canonical)

        setMeta('property', 'og:title', fullTitle)
        setMeta('property', 'og:description', description)
        setMeta('property', 'og:url', canonical)
        setMeta('property', 'og:image', OG_IMAGE)

        setMeta('name', 'twitter:title', fullTitle)
        setMeta('name', 'twitter:description', description)
        setMeta('name', 'twitter:image', OG_IMAGE)

        const breadcrumb = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Accueil', item: BASE_URL },
                ...(path !== '/' ? [{ '@type': 'ListItem', position: 2, name: title.split('—')[0].trim(), item: canonical }] : []),
            ],
        }

        const cleanBreadcrumb = setSchema('seo-breadcrumb', breadcrumb)
        let cleanSchema
        if (schema) cleanSchema = setSchema('seo-page-schema', schema)

        return () => {
            cleanBreadcrumb?.()
            cleanSchema?.()
        }
    }, [fullTitle, description, canonical])
}
