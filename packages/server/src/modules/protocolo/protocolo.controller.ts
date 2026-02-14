import { Request, Response } from 'express';
import { ProtocoloService } from './protocolo.service';

const service = new ProtocoloService();

export class ProtocoloController {
  async create(req: Request, res: Response) {
    const result = await service.create(req.clinicaId!, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async findAll(req: Request, res: Response) {
    const especie = req.query.especie as string | undefined;
    const result = await service.findAll(req.clinicaId!, especie);
    res.json({ success: true, data: result });
  }

  async findById(req: Request, res: Response) {
    const result = await service.findById(req.clinicaId!, req.params.id);
    res.json({ success: true, data: result });
  }

  async update(req: Request, res: Response) {
    const result = await service.update(req.clinicaId!, req.params.id, req.body);
    res.json({ success: true, data: result });
  }

  async delete(req: Request, res: Response) {
    await service.delete(req.clinicaId!, req.params.id);
    res.json({ success: true, message: 'Protocolo desativado' });
  }
}
