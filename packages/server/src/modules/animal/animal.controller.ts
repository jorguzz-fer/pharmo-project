import { Request, Response } from 'express';
import { AnimalService } from './animal.service';

const service = new AnimalService();

export class AnimalController {
  async create(req: Request, res: Response) {
    const result = await service.create(req.clinicaId!, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async findAll(req: Request, res: Response) {
    const tutorId = req.query.tutor_id as string | undefined;
    const result = await service.findAll(req.clinicaId!, tutorId);
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
}
