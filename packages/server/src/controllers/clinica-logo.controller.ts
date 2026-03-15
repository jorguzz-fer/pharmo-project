import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { uploadFile, deleteFile, validateFileType, validateFileSize } from '../services/storage.service';

const prisma = new PrismaClient();

export const logoUpload = multer({ storage: multer.memoryStorage() });

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE_MB = 2;
const BUCKET = 'clinica-documentos';

export class ClinicaLogoController {
    /**
     * Upload clinic logo (admin route — receives clinica ID from params)
     */
    async uploadLogoAdmin(req: Request, res: Response) {
        const clinicaId = req.params.id;
        return ClinicaLogoController.handleUpload(req, res, clinicaId);
    }

    /**
     * Upload clinic logo (clinic's own route — clinica ID from JWT)
     */
    async uploadLogoOwn(req: Request, res: Response) {
        const clinicaId = (req as any).user?.id;
        if (!clinicaId) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        return ClinicaLogoController.handleUpload(req, res, clinicaId);
    }

    private static async handleUpload(req: Request, res: Response, clinicaId: string) {
        try {
            const file = req.file;
            if (!file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            if (!validateFileType(file.mimetype, ALLOWED_TYPES)) {
                return res.status(400).json({ error: 'Tipo de arquivo inválido. Use PNG, JPEG ou WebP.' });
            }

            if (!validateFileSize(file.size, MAX_SIZE_MB)) {
                return res.status(400).json({ error: `Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.` });
            }

            const clinica = await prisma.clinica.findUnique({ where: { id: clinicaId } });
            if (!clinica) {
                return res.status(404).json({ error: 'Clínica não encontrada' });
            }

            // Delete old logo if exists
            if (clinica.logo_url) {
                try {
                    const url = new URL(clinica.logo_url);
                    const pathParts = url.pathname.split('/storage/v1/object/public/');
                    if (pathParts[1]) {
                        const bucketAndPath = pathParts[1];
                        const slashIndex = bucketAndPath.indexOf('/');
                        if (slashIndex > -1) {
                            await deleteFile(BUCKET, bucketAndPath.slice(slashIndex + 1));
                        }
                    }
                } catch {
                    // If delete fails, continue with upload
                }
            }

            const { url, error } = await uploadFile(file, BUCKET, `logos/${clinicaId}`);
            if (error || !url) {
                return res.status(500).json({ error: error || 'Erro ao fazer upload' });
            }

            await prisma.clinica.update({
                where: { id: clinicaId },
                data: { logo_url: url },
            });

            return res.json({ logo_url: url });
        } catch (error) {
            console.error('Logo upload error:', error);
            return res.status(500).json({ error: 'Erro interno ao fazer upload do logo' });
        }
    }

    /**
     * Delete clinic logo
     */
    async deleteLogo(req: Request, res: Response) {
        const clinicaId = req.params.id || (req as any).user?.id;
        if (!clinicaId) {
            return res.status(400).json({ error: 'ID da clínica não informado' });
        }

        try {
            const clinica = await prisma.clinica.findUnique({ where: { id: clinicaId } });
            if (!clinica || !clinica.logo_url) {
                return res.status(404).json({ error: 'Logo não encontrado' });
            }

            try {
                const url = new URL(clinica.logo_url);
                const pathParts = url.pathname.split('/storage/v1/object/public/');
                if (pathParts[1]) {
                    const bucketAndPath = pathParts[1];
                    const slashIndex = bucketAndPath.indexOf('/');
                    if (slashIndex > -1) {
                        await deleteFile(BUCKET, bucketAndPath.slice(slashIndex + 1));
                    }
                }
            } catch { /* continue */ }

            await prisma.clinica.update({
                where: { id: clinicaId },
                data: { logo_url: null },
            });

            return res.json({ success: true });
        } catch (error) {
            console.error('Logo delete error:', error);
            return res.status(500).json({ error: 'Erro ao remover logo' });
        }
    }
}
