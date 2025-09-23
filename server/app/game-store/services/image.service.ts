import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class ImageService {
    private readonly assetsPath = join(process.cwd(), 'assets');

    async saveImage(base64Data: string, filename: string, folder: string): Promise<string> {
        const folderPath = join(this.assetsPath, folder);
        await fs.mkdir(folderPath, { recursive: true });

        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Image, 'base64');

        // Nettoyer le nom de fichier (remplacer espaces et caractères spéciaux)
        const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '-');

        const filePath = join(folderPath, cleanFilename);
        await fs.writeFile(filePath, buffer);

        return `/assets/${folder}/${cleanFilename}`;
    }

    async deleteImage(filepath: string): Promise<void> {
        const fullPath = join(this.assetsPath, filepath.replace('/assets/', ''));
        await fs.unlink(fullPath);
    }

    getImageUrl(filepath: string): string {
        return filepath;
    }
}
