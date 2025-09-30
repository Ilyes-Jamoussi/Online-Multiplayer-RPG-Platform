import { ASSETS_URL_PREFIX, BASE64_IMAGE_REGEX, FILENAME_CLEANUP_REGEX, ASSETS_FOLDER_NAME, BASE64_ENCODING } from '@app/constants/image.constants';
import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class ImageService {
    private readonly assetsPath = join(process.cwd(), ASSETS_FOLDER_NAME);

    async saveImage(base64Data: string, filename: string, folder: string): Promise<string> {
        const folderPath = join(this.assetsPath, folder);
        await fs.mkdir(folderPath, { recursive: true });

        const base64Image = base64Data.replace(BASE64_IMAGE_REGEX, '');
        const buffer = Buffer.from(base64Image, BASE64_ENCODING);

        const cleanFilename = filename.replace(FILENAME_CLEANUP_REGEX, '-');

        const filePath = join(folderPath, cleanFilename);
        await fs.writeFile(filePath, buffer);

        return `${ASSETS_URL_PREFIX}${folder}/${cleanFilename}`;
    }

    async deleteImage(filepath: string): Promise<void> {
        const fullPath = join(this.assetsPath, filepath.replace(ASSETS_URL_PREFIX, ''));
        await fs.unlink(fullPath);
    }
}
