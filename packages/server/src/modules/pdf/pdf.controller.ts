import { Request, Response } from 'express';
import { PdfService } from './pdf.service';

const service = new PdfService();

export class PdfController {
  async gerarPdf(req: Request, res: Response) {
    const buffer = await service.gerarPdf(req.clinicaId!, req.params.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=prescricao-${req.params.id}.pdf`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }
}
