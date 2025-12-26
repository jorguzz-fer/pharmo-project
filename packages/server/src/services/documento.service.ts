import { PrismaClient } from '@prisma/client';
import { uploadFile, deleteFile, validateFileType, validateFileSize } from './storage.service';

const prisma = new PrismaClient();

const ALLOWED_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg'
];

const MAX_SIZE_MB = 10;
const BUCKET_NAME = 'clinica-documentos';

export class DocumentoService {
    async upload(
        clinicaId: string,
        tipoDocumento: string,
        file: Express.Multer.File,
        uploadedBy: string
    ) {
        // Validar tipo
        if (!validateFileType(file.mimetype, ALLOWED_TYPES)) {
            throw new Error('Tipo de arquivo não permitido. Use PDF, PNG ou JPG.');
        }

        // Validar tamanho
        if (!validateFileSize(file.size, MAX_SIZE_MB)) {
            throw new Error(`Arquivo muito grande. Máximo: ${MAX_SIZE_MB}MB`);
        }

        // Upload para Supabase
        const { url, error } = await uploadFile(
            file,
            BUCKET_NAME,
            clinicaId
        );

        if (error || !url) {
            throw new Error(`Erro ao fazer upload: ${error}`);
        }

        // Salvar no banco
        const documento = await prisma.clinicaDocumento.create({
            data: {
                clinica_id: clinicaId,
                tipo_documento: tipoDocumento,
                nome_arquivo: file.originalname,
                url_arquivo: url,
                mime_type: file.mimetype,
                tamanho_bytes: file.size,
                uploaded_by: uploadedBy
            }
        });

        return documento;
    }

    async list(clinicaId: string) {
        return prisma.clinicaDocumento.findMany({
            where: { clinica_id: clinicaId },
            orderBy: { created_at: 'desc' }
        });
    }

    async delete(documentoId: string) {
        const documento = await prisma.clinicaDocumento.findUnique({
            where: { id: documentoId }
        });

        if (!documento) {
            throw new Error('Documento não encontrado');
        }

        // Extrair path do URL
        const urlParts = documento.url_arquivo.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const clinicaId = urlParts[urlParts.length - 2];
        const filePath = `${clinicaId}/${fileName}`;

        // Deletar do Supabase
        await deleteFile(BUCKET_NAME, filePath);

        // Deletar do banco
        await prisma.clinicaDocumento.delete({
            where: { id: documentoId }
        });

        return { success: true };
    }
}
