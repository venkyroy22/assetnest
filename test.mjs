async function run() {
    try {
        const url = 'https://www.instagram.com/reel/CGhM_Q-lGBX/embed/captioned/';
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0 Safari/537.36' }
        });
        const html = await res.text();
        // Regex to find standard MP4 references in Instagram embedded players
        const mp4Match = html.match(/v\/t[^\"]*\.mp4[^\"]*/g);

        let foundMediaUrl = null;
        if (mp4Match && mp4Match.length > 0) {
            foundMediaUrl = 'https://instagram.com/' + mp4Match[0].replace(/\\u0026/g, '&');
            console.log("Found mp4:", foundMediaUrl.substring(0, 150));
        } else {
            console.log("No MP4 matched inside the embed.");

            // Wait, look for other video source formats!
            const videoUrlMatch = html.match(/"video_url":"([^"]+)"/);
            if (videoUrlMatch) {
                console.log("Found video_url:", videoUrlMatch[1].replace(/\\u0026/g, '&').substring(0, 150));
            }

            const thumbnailMatch = html.match(/background-image: url\((.+?)\)/);
            console.log("Thumbnail:", thumbnailMatch ? thumbnailMatch[1] : "not found");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
