import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    const { email, senha } = req.body;
    const result = await authService.login(email, senha);
    res.json({ success: true, data: result });
  }

  async refresh(req: Request, res: Response) {
    const { refresh_token } = req.body;
    const result = await authService.refresh(refresh_token);
    res.json({ success: true, data: result });
  }

  async logout(req: Request, res: Response) {
    await authService.logout(req.user!.id);
    res.json({ success: true, message: 'Logout realizado com sucesso' });
  }

  async me(req: Request, res: Response) {
    const result = await authService.me(req.user!.id);
    res.json({ success: true, data: result });
  }
}
