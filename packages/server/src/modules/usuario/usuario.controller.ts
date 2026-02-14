import { Request, Response } from 'express';
import { UsuarioService } from './usuario.service';

const service = new UsuarioService();

export class UsuarioController {
  async create(req: Request, res: Response) {
    const result = await service.create(req.clinicaId!, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async findAll(req: Request, res: Response) {
    const result = await service.findAll(req.clinicaId!);
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

  async deactivate(req: Request, res: Response) {
    await service.deactivate(req.clinicaId!, req.params.id);
    res.json({ success: true, message: 'Usuario desativado' });
  }
}
