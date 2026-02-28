import { NextResponse } from 'next/server';
import { instagramGetUrl } from 'instagram-url-direct';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url || !url.includes('instagram.com')) {
            return NextResponse.json({ error: 'Please enter a valid Instagram URL' }, { status: 400 });
        }

        const cleanUrl = url.split('?')[0].trim();

        // STRATEGY 1: Use instagram-url-direct which calls Instagram's own internal
        // GraphQL API directly — this works from cloud servers like Vercel.
        try {
            const result = await instagramGetUrl(cleanUrl, { retries: 3, delay: 1000 });

            if (result && result.url_list && result.url_list.length > 0) {
                const mediaUrl = result.url_list[0];
                const isVideo = result.media_details?.[0]?.type === 'video';

                // Return all media items (for carousel posts)
                const allMedia = result.url_list.map((url: string, i: number) => ({
                    url,
                    isVideo: result.media_details?.[i]?.type === 'video'
                }));

                return NextResponse.json({
                    mediaUrl,
                    isVideo,
                    allMedia,
                    count: result.results_number
                });
            }
        } catch (e: any) {
            console.log('Strategy 1 (instagram-url-direct) failed:', e?.message);
        }

        // STRATEGY 2: Directly hit Instagram's GraphQL API ourselves
        // by first getting a CSRF token then querying the media data
        try {
            // Step 1: Extract shortcode from URL
            const parts = cleanUrl.split('/').filter(Boolean);
            const postIndex = parts.findIndex(p => ['p', 'reel', 'tv', 'reels'].includes(p));
            const shortcode = postIndex !== -1 ? parts[postIndex + 1] : null;

            if (!shortcode) throw new Error('Could not extract shortcode');

            // Step 2: Get CSRF token from Instagram
            const homeRes = await fetch('https://www.instagram.com/', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                signal: AbortSignal.timeout(10000)
            });

            const setCookieHeader = homeRes.headers.get('set-cookie') || '';
            const csrfMatch = setCookieHeader.match(/csrftoken=([^;]+)/);
            const csrfToken = csrfMatch ? csrfMatch[1] : '';
            const cookies = setCookieHeader.split(',').map(c => c.split(';')[0].trim()).join('; ');

            // Step 3: Query Instagram's GraphQL directly
            const postData = new URLSearchParams({
                variables: JSON.stringify({
                    shortcode,
                    fetch_tagged_user_count: null,
                    hoisted_comment_id: null,
                    hoisted_reply_id: null
                }),
                doc_id: '9510064595728286'
            });

            const graphRes = await fetch('https://www.instagram.com/graphql/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.instagram.com/',
                    'Cookie': cookies,
                },
                body: postData.toString(),
                signal: AbortSignal.timeout(10000)
            });

            const graphData = await graphRes.json();
            const media = graphData?.data?.xdt_shortcode_media;

            if (media) {
                if (media.is_video && media.video_url) {
                    return NextResponse.json({ mediaUrl: media.video_url, isVideo: true, count: 1 });
                } else if (media.display_url) {
                    return NextResponse.json({ mediaUrl: media.display_url, isVideo: false, count: 1 });
                }
            }
        } catch (e: any) {
            console.log('Strategy 2 (Direct GraphQL) failed:', e?.message);
        }

        // STRATEGY 3: Parse the Instagram embed page  
        // The /embed/captioned/ endpoint serves a static HTML page with media URLs in JSON
        try {
            const parts = cleanUrl.split('/').filter(Boolean);
            const postIndex = parts.findIndex(p => ['p', 'reel', 'tv', 'reels'].includes(p));
            const shortcode = postIndex !== -1 ? parts[postIndex + 1] : null;

            if (shortcode) {
                const embedRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    },
                    signal: AbortSignal.timeout(10000)
                });

                const html = await embedRes.text();

                // Look for video URL patterns in the embedded JS data
                const videoUrlMatch = html.match(/"video_url":"(https:[^"]+\.mp4[^"]*)"/);
                const displayUrlMatch = html.match(/"display_url":"(https:[^"]+)"/);

                if (videoUrlMatch?.[1]) {
                    const mediaUrl = videoUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
                    return NextResponse.json({ mediaUrl, isVideo: true, count: 1 });
                } else if (displayUrlMatch?.[1]) {
                    const mediaUrl = displayUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
                    return NextResponse.json({ mediaUrl, isVideo: false, count: 1 });
                }
            }
        } catch (e: any) {
            console.log('Strategy 3 (Embed page) failed:', e?.message);
        }

        // All strategies failed
        return NextResponse.json({
            error: 'Could not extract media from this post. It may be private, or Instagram has updated their API. Please try a different public post.'
        }, { status: 404 });

    } catch (error: any) {
        console.error('Instagram API Error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
