import { MetadataRoute } from 'next'
import { ALL_TOOLS } from '@/lib/tools'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://assetnest.gloyas.com'
    const now = new Date()

    // 1. Static high-priority pages
    const staticPages = [
        {
            url: baseUrl,
            lastModified: now,
            changeFrequency: 'daily' as const,
            priority: 1.0,
        },
        {
            url: `${baseUrl}/tools`,
            lastModified: now,
            changeFrequency: 'weekly' as const,
            priority: 0.9,
        },
        {
            url: `${baseUrl}/prompts`,
            lastModified: now,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: now,
            changeFrequency: 'yearly' as const,
            priority: 0.7,
        },
    ]

    // 2. Dynamic tool pages from ALL_TOOLS
    const toolPages = ALL_TOOLS.map((tool) => ({
        url: `${baseUrl}${tool.href}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
    }))

    // 3. Legal pages
    const legalPages = [
        {
            url: `${baseUrl}/privacy`,
            lastModified: now,
            changeFrequency: 'yearly' as const,
            priority: 0.2,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: now,
            changeFrequency: 'yearly' as const,
            priority: 0.2,
        },
        {
            url: `${baseUrl}/disclaimer`,
            lastModified: now,
            changeFrequency: 'yearly' as const,
            priority: 0.1,
        },
    ]

    return [...staticPages, ...toolPages, ...legalPages]
}

