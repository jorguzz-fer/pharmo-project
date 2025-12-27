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
        console.log('📤 Starting file upload to Supabase...');
        console.log('Bucket:', bucket);
        console.log('Path:', path);
        console.log('File:', file.originalname);
        console.log('Supabase URL:', supabaseUrl);
        console.log('Supabase Key configured:', !!supabaseKey);

        const fileName = `${path}/${Date.now()}_${file.originalname}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('❌ Supabase upload error:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            return { url: '', error: error.message };
        }

        console.log('✅ Upload successful, getting public URL...');

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        console.log('✅ Public URL:', publicUrl);

        return { url: publicUrl };
    } catch (error: any) {
        console.error('❌ Upload error:', error);
        console.error('Error stack:', error.stack);
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
