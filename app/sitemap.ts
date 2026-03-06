import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.assetnest.space'
    const now = new Date()

    return [
        // Home
        {
            url: baseUrl,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        // Tools index
        {
            url: `${baseUrl}/tools`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        // Individual tool pages
        { url: `${baseUrl}/tools/billing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/tools/ig-grid`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/tools/image-compressor`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/tools/image-converter`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/tools/image-cropper`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/tools/media-hub`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/tools/pomodoro`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/tools/qr`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/tools/typing-test`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
        // Keywords page
        {
            url: `${baseUrl}/keywords`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        // About page
        {
            url: `${baseUrl}/about`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.7,
        },
        // Legal pages
        {
            url: `${baseUrl}/privacy`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.2,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.2,
        },
        {
            url: `${baseUrl}/disclaimer`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.1,
        },
    ]
}
