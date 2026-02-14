import { Request, Response } from 'express';
import { ValidacaoService } from './validacao.service';
import { ValidacaoTipo } from '@prisma/client';

const service = new ValidacaoService();

export class ValidacaoController {
  async getLogs(req: Request, res: Response) {
    const result = await service.getLogs(req.clinicaId!, {
      tipo: req.query.tipo as ValidacaoTipo | undefined,
      veterinario_id: req.query.veterinario_id as string | undefined,
      data_inicio: req.query.data_inicio ? new Date(req.query.data_inicio as string) : undefined,
      data_fim: req.query.data_fim ? new Date(req.query.data_fim as string) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json({ success: true, data: result });
  }

  async getLogsPorPrescricao(req: Request, res: Response) {
    const result = await service.getLogsPorPrescricao(req.params.prescricaoId);
    res.json({ success: true, data: result });
  }
}
