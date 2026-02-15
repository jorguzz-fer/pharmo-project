import { Request, Response } from 'express';
import { PrescricaoService } from './prescricao.service';

const service = new PrescricaoService();

export class PrescricaoController {
  async create(req: Request, res: Response) {
    const result = await service.create(req.user!, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async findAll(req: Request, res: Response) {
    const result = await service.findAll(req.clinicaId!, {
      status: req.query.status as string,
      veterinario_id: req.query.veterinario_id as string,
      tutor_id: req.query.tutor_id as string,
      animal_id: req.query.animal_id as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    });
    res.json({ success: true, data: result });
  }

  async findById(req: Request, res: Response) {
    const result = await service.findById(req.clinicaId!, req.params.id as string);
    res.json({ success: true, data: result });
  }

  async update(req: Request, res: Response) {
    const result = await service.update(req.clinicaId!, req.params.id as string, req.body);
    res.json({ success: true, data: result });
  }

  async cancelar(req: Request, res: Response) {
    const result = await service.cancelar(req.clinicaId!, req.params.id as string);
    res.json({ success: true, data: result });
  }

  async validar(req: Request, res: Response) {
    const result = await service.validar(req.clinicaId!, req.params.id as string);
    res.json({ success: true, data: result });
  }

  async aceite(req: Request, res: Response) {
    const ip = req.ip || req.headers['x-forwarded-for'] as string;
    const ua = req.headers['user-agent'];
    const result = await service.aceiteForaFaixa(req.user!, req.params.id as string, req.body, ip, ua);
    res.json({ success: true, data: result });
  }

  async assinar(req: Request, res: Response) {
    const result = await service.assinar(req.user!, req.params.id as string);
    res.json({ success: true, data: result });
  }

  async calcular(req: Request, res: Response) {
    const result = await service.calcularPreview(req.clinicaId!, req.body);
    res.json({ success: true, data: result });
  }
}
