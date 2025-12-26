import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase credentials not configured. Document upload will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadFile(
    file: Express.Multer.File,
    bucket: string,
    path: string
): Promise<{ url: string; error?: string }> {
    try {
        const fileName = `${path}/${Date.now()}_${file.originalname}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return { url: '', error: error.message };
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return { url: publicUrl };
    } catch (error: any) {
        console.error('Upload error:', error);
        return { url: '', error: error.message };
    }
}

export async function deleteFile(bucket: string, filePath: string): Promise<boolean> {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            console.error('Supabase delete error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Delete error:', error);
        return false;
    }
}

// Validar tipo de arquivo
export function validateFileType(mimetype: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimetype);
}

// Validar tamanho (em bytes)
export function validateFileSize(size: number, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
}
