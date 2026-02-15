import { Request, Response } from 'express';
import { TutorService } from './tutor.service';

const service = new TutorService();

export class TutorController {
  async create(req: Request, res: Response) {
    const result = await service.create(req.clinicaId!, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async findAll(req: Request, res: Response) {
    const search = req.query.search as string | undefined;
    const result = await service.findAll(req.clinicaId!, search);
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
}
