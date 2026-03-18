const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
    cloud_name: 'drljj29ua',
    api_key: '785645623123381',
    api_secret: '3nKS97ebIyjxRexEU95SrVZMTwI'
});

const promptsimgDir = 'c:\\Users\\venka\\Downloads\\AN\\public\\promptsimg';
const files = fs.readdirSync(promptsimgDir);

async function uploadPrompts() {
    console.log('--- STARTING UPLOAD ---');
    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
            const filePath = path.join(promptsimgDir, file);
            // Just use the filename as the public_id, and let 'folder' handle the path
            const publicId = path.parse(file).name;
            
            console.log(`Uploading ${file}...`);
            try {
                const result = await cloudinary.uploader.upload(filePath, {
                    public_id: publicId,
                    folder: 'assetnest/promptsimg',
                    resource_type: 'image',
                    overwrite: true
                });
                console.log(`Success: ${file} => ${result.secure_url}`);
            } catch (error) {
                console.error(`Error uploading ${file}:`, error.message);
            }
        }
    }
    console.log('--- FINISHED ---');
}

uploadPrompts();
