import { Request, Response } from 'express';
import { DocumentoService } from '../services/documento.service';
import multer from 'multer';

const documentoService = new DocumentoService();

// Configurar multer para memória (buffer)
const storage = multer.memoryStorage();
export const upload = multer({ storage });

export class DocumentoController {
    async uploadDocumento(req: Request, res: Response) {
        try {
            const { id: clinicaId } = req.params;
            const { tipo_documento } = req.body;
            const file = req.file;
            const userId = req.userId!;

            if (!file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            // Validar tipo de documento
            const tiposPermitidos = [
                'contrato_social',
                'cartao_cnpj',
                'comprovante_endereco',
                'contrato_assinado'
            ];

            if (!tiposPermitidos.includes(tipo_documento)) {
                return res.status(400).json({
                    error: 'Tipo de documento inválido',
                    tipos_permitidos: tiposPermitidos
                });
            }

            const documento = await documentoService.upload(
                clinicaId,
                tipo_documento,
                file,
                userId
            );

            return res.status(201).json(documento);
        } catch (error: any) {
            console.error('Error uploading document:', error);
            return res.status(500).json({ error: error.message || 'Erro ao fazer upload' });
        }
    }

    async listDocumentos(req: Request, res: Response) {
        try {
            const { id: clinicaId } = req.params;
            const documentos = await documentoService.list(clinicaId);
            return res.json(documentos);
        } catch (error) {
            console.error('Error listing documents:', error);
            return res.status(500).json({ error: 'Erro ao listar documentos' });
        }
    }

    async deleteDocumento(req: Request, res: Response) {
        try {
            const { docId } = req.params;
            const result = await documentoService.delete(docId);
            return res.json(result);
        } catch (error: any) {
            console.error('Error deleting document:', error);
            return res.status(500).json({ error: error.message || 'Erro ao deletar documento' });
        }
    }
}
