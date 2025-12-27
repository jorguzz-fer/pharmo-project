import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';

const resend = new Resend(process.env.RESEND_API_KEY);
const prisma = new PrismaClient();

const FROM_EMAIL = 'PharmoPet <noreply@pharmopet.com.br>';

export class EmailService {
  // Log de email para auditoria
  private async logEmail(
    destinatario: string,
    assunto: string,
    template: string,
    status: 'sent' | 'failed',
    errorMessage?: string
  ) {
    try {
      await prisma.emailLog.create({
        data: {
          destinatario,
          assunto,
          template,
          status,
          error_message: errorMessage
        }
      });
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }

  // Clínica Cadastrada
  async sendClinicaCadastrada(clinica: any) {
    const assunto = '📋 Clínica cadastrada no PharmoPet';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Clínica Cadastrada com Sucesso!</h2>
        <p>Olá <strong>${clinica.responsavel_legal}</strong>,</p>
        <p>Sua clínica <strong>${clinica.nome_fantasia}</strong> foi cadastrada no sistema PharmoPet.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Dados da Clínica:</h3>
          <p><strong>Razão Social:</strong> ${clinica.razao_social}</p>
          <p><strong>CNPJ:</strong> ${clinica.cnpj}</p>
          <p><strong>Status:</strong> ${clinica.status}</p>
        </div>

        <p><strong>Próximos passos:</strong></p>
        <ol>
          <li>Aguarde a análise da documentação</li>
          <li>Você receberá um email quando a clínica for aprovada</li>
          <li>Após aprovação, seus veterinários poderão acessar o sistema</li>
        </ol>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Equipe PharmoPet<br>
          <a href="mailto:suporte@pharmopet.com.br">suporte@pharmopet.com.br</a>
        </p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: clinica.email,
        subject: assunto,
        html
      });
      await this.logEmail(clinica.email, assunto, 'clinica_cadastrada', 'sent');
    } catch (error: any) {
      console.error('Error sending email:', error);
      await this.logEmail(clinica.email, assunto, 'clinica_cadastrada', 'failed', error.message);
    }
  }

  // Clínica Aprovada
  async sendClinicaAprovada(clinica: any) {
    const assunto = '🎉 Sua clínica foi aprovada no PharmoPet!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">🎉 Clínica Aprovada!</h2>
        <p>Olá <strong>${clinica.responsavel_legal}</strong>,</p>
        <p>Temos ótimas notícias! A clínica <strong>${clinica.nome_fantasia}</strong> foi aprovada e já está ativa no sistema PharmoPet.</p>
        
        <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="margin-top: 0; color: #16a34a;">Dados da Clínica:</h3>
          <p><strong>CNPJ:</strong> ${clinica.cnpj}</p>
          <p><strong>Endereço:</strong> ${clinica.logradouro}, ${clinica.numero} - ${clinica.cidade}/${clinica.estado}</p>
          <p><strong>Data de aprovação:</strong> ${new Date(clinica.approved_at).toLocaleDateString('pt-BR')}</p>
        </div>

        <p><strong>Próximos passos:</strong></p>
        <ol>
          <li>Seus veterinários já podem acessar o sistema</li>
          <li>Comece a emitir prescrições digitais</li>
          <li>Acompanhe os relatórios no painel administrativo</li>
        </ol>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Precisa de ajuda? Responda este email ou acesse nosso suporte.<br><br>
          Equipe PharmoPet<br>
          <a href="mailto:suporte@pharmopet.com.br">suporte@pharmopet.com.br</a>
        </p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: clinica.email,
        subject: assunto,
        html
      });
      await this.logEmail(clinica.email, assunto, 'clinica_aprovada', 'sent');
    } catch (error: any) {
      console.error('Error sending email:', error);
      await this.logEmail(clinica.email, assunto, 'clinica_aprovada', 'failed', error.message);
    }
  }

  // Enviar Credenciais de Acesso ao Dashboard
  async sendClinicaCredenciais(clinica: any, senhaTemporaria: string) {
    const assunto = '🔐 Suas credenciais de acesso - PharmoPet Dashboard';
    const loginUrl = `${process.env.FRONTEND_URL || 'https://app.pharmopet.com.br'}/clinica/login`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">🎉 Bem-vindo ao PharmoPet Dashboard!</h2>
        <p>Olá <strong>${clinica.responsavel_legal}</strong>,</p>
        <p>Sua clínica <strong>${clinica.nome_fantasia}</strong> foi aprovada! Agora você tem acesso ao dashboard exclusivo para acompanhar suas métricas e prescrições.</p>
        
        <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
          <h3 style="margin-top: 0; color: #7c3aed;">🔑 Suas Credenciais de Acesso:</h3>
          <p><strong>Email:</strong> ${clinica.email}</p>
          <p><strong>Senha Temporária:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${senhaTemporaria}</code></p>
          <p style="margin-top: 15px;">
            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Acessar Dashboard
            </a>
          </p>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0;"><strong>⚠️ Importante:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Esta é uma senha temporária</li>
            <li>Recomendamos alterar sua senha no primeiro acesso</li>
            <li>Use a opção "Esqueci minha senha" para redefinir quando quiser</li>
          </ul>
        </div>

        <p><strong>O que você pode fazer no dashboard:</strong></p>
        <ul>
          <li>📊 Visualizar métricas em tempo real</li>
          <li>💊 Acompanhar prescrições dos seus veterinários</li>
          <li>💰 Monitorar receita e pagamentos</li>
          <li>👥 Gerenciar veterinários vinculados</li>
        </ul>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Precisa de ajuda? Responda este email ou acesse nosso suporte.<br><br>
          Equipe PharmoPet<br>
          <a href="mailto:suporte@pharmopet.com.br">suporte@pharmopet.com.br</a>
        </p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: clinica.email,
        subject: assunto,
        html
      });
      await this.logEmail(clinica.email, assunto, 'clinica_credenciais', 'sent');
      console.log(`✅ Credenciais enviadas para ${clinica.email}`);
    } catch (error: any) {
      console.error('Error sending credentials email:', error);
      await this.logEmail(clinica.email, assunto, 'clinica_credenciais', 'failed', error.message);
      throw error; // Re-throw para que o controller saiba que falhou
    }
  }

  // Clínica Suspensa
  async sendClinicaSuspensa(clinica: any, motivo?: string) {
    const assunto = '⚠️ Aviso importante sobre sua clínica';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Clínica Suspensa</h2>
        <p>Olá <strong>${clinica.responsavel_legal}</strong>,</p>
        <p>Informamos que a clínica <strong>${clinica.nome_fantasia}</strong> foi temporariamente suspensa no sistema PharmoPet.</p>
        
        ${motivo ? `
        <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0; color: #dc2626;">Motivo:</h3>
          <p>${motivo}</p>
        </div>
        ` : ''}

        <p><strong>Durante a suspensão:</strong></p>
        <ul>
          <li>Novas prescrições não podem ser emitidas</li>
          <li>O acesso dos veterinários está bloqueado</li>
          <li>Prescrições anteriores permanecem válidas</li>
        </ul>

        <p>Para regularizar a situação, entre em contato conosco:</p>
        <p style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
          📧 Email: <a href="mailto:suporte@pharmopet.com.br">suporte@pharmopet.com.br</a><br>
          📱 WhatsApp: (11) 99999-9999
        </p>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Equipe PharmoPet
        </p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: clinica.email,
        subject: assunto,
        html
      });
      await this.logEmail(clinica.email, assunto, 'clinica_suspensa', 'sent');
    } catch (error: any) {
      console.error('Error sending email:', error);
      await this.logEmail(clinica.email, assunto, 'clinica_suspensa', 'failed', error.message);
    }
  }

  // Veterinário Vinculado
  async sendVeterinarioVinculado(vinculacao: any) {
    const assunto = `Você foi adicionado à clínica ${vinculacao.clinica.nome_fantasia}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Bem-vindo à ${vinculacao.clinica.nome_fantasia}!</h2>
        <p>Olá <strong>Dr(a). ${vinculacao.veterinario.nome}</strong>,</p>
        <p>Você foi vinculado como veterinário na clínica <strong>${vinculacao.clinica.nome_fantasia}</strong>.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalhes:</h3>
          <p><strong>Clínica:</strong> ${vinculacao.clinica.nome_fantasia}</p>
          <p><strong>CNPJ:</strong> ${vinculacao.clinica.cnpj}</p>
          <p><strong>Endereço:</strong> ${vinculacao.clinica.logradouro}, ${vinculacao.clinica.numero} - ${vinculacao.clinica.cidade}/${vinculacao.clinica.estado}</p>
          <p><strong>Seu cargo:</strong> ${vinculacao.cargo}</p>
        </div>

        <p>Agora você pode:</p>
        <ul>
          <li>Emitir prescrições digitais pela clínica</li>
          <li>Acessar o histórico de prescrições</li>
          <li>Gerenciar seus pacientes</li>
        </ul>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Equipe PharmoPet<br>
          <a href="mailto:suporte@pharmopet.com.br">suporte@pharmopet.com.br</a>
        </p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: vinculacao.veterinario.email,
        subject: assunto,
        html
      });
      await this.logEmail(vinculacao.veterinario.email, assunto, 'veterinario_vinculado', 'sent');
    } catch (error: any) {
      console.error('Error sending email:', error);
      await this.logEmail(vinculacao.veterinario.email, assunto, 'veterinario_vinculado', 'failed', error.message);
    }
  }

  // Veterinário Desvinculado
  async sendVeterinarioDesvinculado(vinculacao: any) {
    const assunto = `Desvinculação da clínica ${vinculacao.clinica.nome_fantasia}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6b7280;">Desvinculação de Clínica</h2>
        <p>Olá <strong>Dr(a). ${vinculacao.veterinario.nome}</strong>,</p>
        <p>Informamos que você foi desvinculado da clínica <strong>${vinculacao.clinica.nome_fantasia}</strong>.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Clínica:</strong> ${vinculacao.clinica.nome_fantasia}</p>
          <p><strong>Data de desvinculação:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <p>A partir de agora:</p>
        <ul>
          <li>Você não poderá mais emitir prescrições por esta clínica</li>
          <li>Prescrições anteriores permanecem válidas</li>
          <li>Seu acesso às outras clínicas não foi afetado</li>
        </ul>

        <p>Se você acredita que isso foi um erro, entre em contato conosco.</p>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Equipe PharmoPet<br>
          <a href="mailto:suporte@pharmopet.com.br">suporte@pharmopet.com.br</a>
        </p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: vinculacao.veterinario.email,
        subject: assunto,
        html
      });
      await this.logEmail(vinculacao.veterinario.email, assunto, 'veterinario_desvinculado', 'sent');
    } catch (error: any) {
      console.error('Error sending email:', error);
      await this.logEmail(vinculacao.veterinario.email, assunto, 'veterinario_desvinculado', 'failed', error.message);
    }
  }

  // Recuperação de Senha
  async sendPasswordResetEmail(email: string, token: string, userType: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const assunto = '🔑 Recuperação de senha - PharmoPet';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Recuperação de Senha</h2>
        <p>Olá,</p>
        <p>Você solicitou a recuperação de senha da sua conta no PharmoPet.</p>
        
        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <p style="margin: 0;"><strong>Clique no botão abaixo para redefinir sua senha:</strong></p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Redefinir Senha
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          Ou copie e cole este link no seu navegador:<br>
          <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
        </p>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;"><strong>⚠️ Importante:</strong></p>
          <ul style="margin: 10px 0; color: #92400e;">
            <li>Este link expira em <strong>1 hora</strong></li>
            <li>Se você não solicitou esta recuperação, ignore este email</li>
            <li>Nunca compartilhe este link com outras pessoas</li>
          </ul>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Equipe PharmoPet<br>
          <a href="mailto:suporte@pharmopet.com.br">suporte@pharmopet.com.br</a>
        </p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: assunto,
        html
      });
      await this.logEmail(email, assunto, 'password_reset', 'sent');
    } catch (error: any) {
      console.error('Error sending email:', error);
      await this.logEmail(email, assunto, 'password_reset', 'failed', error.message);
    }
  }
}
