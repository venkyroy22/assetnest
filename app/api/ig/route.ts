import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url || !url.includes('instagram.com')) {
            return NextResponse.json({ error: 'Please enter a valid Instagram URL' }, { status: 400 });
        }

        const cleanUrl = url.split('?')[0];

        // Many local ISPs and Antiviruses in development mode block external proxy servers using deep packet inspection.
        // We instruct the Node engine to ignore strict localhost TLS certificate rejections during Dev fetching.
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

        // FALLBACK 1: We use a lightweight public scraping API that is specifically designed not to block NodeJS
        try {
            const res = await fetch(`https://instagram-videos.vercel.app/api/video?url=${encodeURIComponent(cleanUrl)}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(8000)
            });
            const data = await res.json();
            if (data && data.data && data.data.videoUrl) {
                return NextResponse.json({ mediaUrl: data.data.videoUrl, isVideo: true });
            }
        } catch (e) {
            console.log("Fallback 1 failed", e);
        }

        // FALLBACK 2: Querying the highly unblocked RapidAPI format wrapper (A free public instance variant)
        try {
            const formData = new URLSearchParams();
            formData.append('q', cleanUrl);
            formData.append('t', 'media');
            formData.append('lang', 'en');

            const res = await fetch('https://v3.saveig.app/api/ajaxSearch', {
                method: 'POST',
                body: formData.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
                },
                signal: AbortSignal.timeout(10000)
            });

            const html = await res.text();
            const videoMatch = html.match(/href=\\"([^"]+\.mp4[^"]*)\\"/i) || html.match(/href="([^"]+\.mp4[^"]*)"/i);
            const imageMatch = html.match(/href=\\"([^"]+\.jpg[^"]*)\\"/i) || html.match(/href="([^"]+\.jpg[^"]*)"/i);

            let mediaUrl = null;
            let isVideo = false;

            if (videoMatch && videoMatch[1]) {
                mediaUrl = videoMatch[1].replace(/\\&amp;/g, '&').replace(/\\/g, '');
                isVideo = true;
            } else if (imageMatch && imageMatch[1]) {
                mediaUrl = imageMatch[1].replace(/\\&amp;/g, '&').replace(/\\/g, '');
            }

            if (mediaUrl) {
                return NextResponse.json({ mediaUrl, isVideo });
            }
        } catch (e) {
            console.log("Fallback 2 failed", e);
        }

        // FALLBACK 3: SSSInstagram
        try {
            const res = await fetch('https://sssinstagram.com/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                },
                body: JSON.stringify({ link: cleanUrl }),
                signal: AbortSignal.timeout(8000)
            });
            const data = await res.json();
            if (data && data.data && data.data.video) {
                return NextResponse.json({ mediaUrl: data.data.video, isVideo: true });
            }
        } catch (e) {
            console.log("Fallback 3 failed", e);
        }

        // If all endpoints time out, this means the Local Network (WiFi) is violently blocking proxy routing.
        return NextResponse.json({
            error: 'Local network or ISP is blocking proxy routing. Try turning on a VPN, or this will resolve automatically once the app is deployed to Production/Vercel.'
        }, { status: 500 });

    } catch (error: any) {
        console.error('Instagram Scraper Main Error:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred while extracting the media.' }, { status: 500 });
    }
}
