const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
    cloud_name: 'drljj29ua',
    api_key: '785645623123381',
    api_secret: '3nKS97ebIyjxRexEU95SrVZMTwI'
});

const categoriesDir = 'c:\\Users\\venka\\Downloads\\AN\\public\\categories';
const files = fs.readdirSync(categoriesDir);

async function checkFiles() {
    console.log('--- MAPPING ---');
    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        const isVideo = ext === '.mp4';
        const type = isVideo ? 'video' : 'image';
        const publicId = `assetnest/categories/${path.parse(file).name}`;
        const url = `https://res.cloudinary.com/drljj29ua/${type}/upload/${publicId}`;
        console.log(`${file} => ${url}`);
    }
}

checkFiles();
