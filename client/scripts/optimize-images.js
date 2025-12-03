#!/usr/bin/env node

/**
 * Script d'optimisation des images
 * Optimise les images PNG et JPG dans le dossier assets/images
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../src/assets/images');
const MAX_SIZE_KB = 500; // Taille maximale recommandée en KB

function getAllImageFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getAllImageFiles(filePath, fileList);
        } else if (/\.(png|jpg|jpeg|gif)$/i.test(file)) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function checkImageSizes() {
    console.log('🔍 Vérification de la taille des images...\n');
    
    const imageFiles = getAllImageFiles(ASSETS_DIR);
    const largeFiles = [];
    let totalSize = 0;

    imageFiles.forEach((filePath) => {
        const stats = fs.statSync(filePath);
        const sizeKB = stats.size / 1024;
        totalSize += stats.size;

        if (sizeKB > MAX_SIZE_KB) {
            largeFiles.push({
                path: path.relative(ASSETS_DIR, filePath),
                size: stats.size,
                sizeKB: Math.round(sizeKB * 100) / 100
            });
        }
    });

    console.log(`📊 Total: ${imageFiles.length} images trouvées`);
    console.log(`📦 Taille totale: ${formatBytes(totalSize)}\n`);

    if (largeFiles.length > 0) {
        console.log(`⚠️  ${largeFiles.length} image(s) dépassent ${MAX_SIZE_KB}KB:\n`);
        largeFiles
            .sort((a, b) => b.sizeKB - a.sizeKB)
            .forEach((file) => {
                console.log(`   ${file.path}: ${file.sizeKB}KB`);
            });
        console.log('\n💡 Recommandations:');
        console.log('   1. Utilisez TinyPNG (https://tinypng.com/) pour compresser les PNG');
        console.log('   2. Utilisez Squoosh (https://squoosh.app/) pour optimiser les images');
        console.log('   3. Pour les GIFs animés, considérez les convertir en vidéo MP4');
        console.log('   4. Réduisez la résolution si les images sont trop grandes\n');
    } else {
        console.log('✅ Toutes les images sont sous la taille recommandée!\n');
    }

    return largeFiles;
}

// Exécuter le script
if (require.main === module) {
    try {
        checkImageSizes();
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

module.exports = { checkImageSizes, getAllImageFiles };

