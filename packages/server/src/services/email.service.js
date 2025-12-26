"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
var resend_1 = require("resend");
var client_1 = require("@prisma/client");
var resend = new resend_1.Resend(process.env.RESEND_API_KEY);
var prisma = new client_1.PrismaClient();
var FROM_EMAIL = 'PharmoPet <noreply@pharmopet.com.br>';
var EmailService = /** @class */ (function () {
    function EmailService() {
    }
    // Log de email para auditoria
    EmailService.prototype.logEmail = function (destinatario, assunto, template, status, errorMessage) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.emailLog.create({
                                data: {
                                    destinatario: destinatario,
                                    assunto: assunto,
                                    template: template,
                                    status: status,
                                    error_message: errorMessage
                                }
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error logging email:', error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Clínica Cadastrada
    EmailService.prototype.sendClinicaCadastrada = function (clinica) {
        return __awaiter(this, void 0, void 0, function () {
            var assunto, html, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assunto = '📋 Clínica cadastrada no PharmoPet';
                        html = "\n      <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n        <h2 style=\"color: #16a34a;\">Cl\u00EDnica Cadastrada com Sucesso!</h2>\n        <p>Ol\u00E1 <strong>".concat(clinica.responsavel_legal, "</strong>,</p>\n        <p>Sua cl\u00EDnica <strong>").concat(clinica.nome_fantasia, "</strong> foi cadastrada no sistema PharmoPet.</p>\n        \n        <div style=\"background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;\">\n          <h3 style=\"margin-top: 0;\">Dados da Cl\u00EDnica:</h3>\n          <p><strong>Raz\u00E3o Social:</strong> ").concat(clinica.razao_social, "</p>\n          <p><strong>CNPJ:</strong> ").concat(clinica.cnpj, "</p>\n          <p><strong>Status:</strong> ").concat(clinica.status, "</p>\n        </div>\n\n        <p><strong>Pr\u00F3ximos passos:</strong></p>\n        <ol>\n          <li>Aguarde a an\u00E1lise da documenta\u00E7\u00E3o</li>\n          <li>Voc\u00EA receber\u00E1 um email quando a cl\u00EDnica for aprovada</li>\n          <li>Ap\u00F3s aprova\u00E7\u00E3o, seus veterin\u00E1rios poder\u00E3o acessar o sistema</li>\n        </ol>\n\n        <p style=\"color: #6b7280; font-size: 14px; margin-top: 30px;\">\n          Equipe PharmoPet<br>\n          <a href=\"mailto:suporte@pharmopet.com.br\">suporte@pharmopet.com.br</a>\n        </p>\n      </div>\n    ");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 6]);
                        return [4 /*yield*/, resend.emails.send({
                                from: FROM_EMAIL,
                                to: clinica.email,
                                subject: assunto,
                                html: html
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.logEmail(clinica.email, assunto, 'clinica_cadastrada', 'sent')];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        error_2 = _a.sent();
                        console.error('Error sending email:', error_2);
                        return [4 /*yield*/, this.logEmail(clinica.email, assunto, 'clinica_cadastrada', 'failed', error_2.message)];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Clínica Aprovada
    EmailService.prototype.sendClinicaAprovada = function (clinica) {
        return __awaiter(this, void 0, void 0, function () {
            var assunto, html, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assunto = '🎉 Sua clínica foi aprovada no PharmoPet!';
                        html = "\n      <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n        <h2 style=\"color: #16a34a;\">\uD83C\uDF89 Cl\u00EDnica Aprovada!</h2>\n        <p>Ol\u00E1 <strong>".concat(clinica.responsavel_legal, "</strong>,</p>\n        <p>Temos \u00F3timas not\u00EDcias! A cl\u00EDnica <strong>").concat(clinica.nome_fantasia, "</strong> foi aprovada e j\u00E1 est\u00E1 ativa no sistema PharmoPet.</p>\n        \n        <div style=\"background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;\">\n          <h3 style=\"margin-top: 0; color: #16a34a;\">Dados da Cl\u00EDnica:</h3>\n          <p><strong>CNPJ:</strong> ").concat(clinica.cnpj, "</p>\n          <p><strong>Endere\u00E7o:</strong> ").concat(clinica.logradouro, ", ").concat(clinica.numero, " - ").concat(clinica.cidade, "/").concat(clinica.estado, "</p>\n          <p><strong>Data de aprova\u00E7\u00E3o:</strong> ").concat(new Date(clinica.approved_at).toLocaleDateString('pt-BR'), "</p>\n        </div>\n\n        <p><strong>Pr\u00F3ximos passos:</strong></p>\n        <ol>\n          <li>Seus veterin\u00E1rios j\u00E1 podem acessar o sistema</li>\n          <li>Comece a emitir prescri\u00E7\u00F5es digitais</li>\n          <li>Acompanhe os relat\u00F3rios no painel administrativo</li>\n        </ol>\n\n        <p style=\"color: #6b7280; font-size: 14px; margin-top: 30px;\">\n          Precisa de ajuda? Responda este email ou acesse nosso suporte.<br><br>\n          Equipe PharmoPet<br>\n          <a href=\"mailto:suporte@pharmopet.com.br\">suporte@pharmopet.com.br</a>\n        </p>\n      </div>\n    ");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 6]);
                        return [4 /*yield*/, resend.emails.send({
                                from: FROM_EMAIL,
                                to: clinica.email,
                                subject: assunto,
                                html: html
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.logEmail(clinica.email, assunto, 'clinica_aprovada', 'sent')];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        error_3 = _a.sent();
                        console.error('Error sending email:', error_3);
                        return [4 /*yield*/, this.logEmail(clinica.email, assunto, 'clinica_aprovada', 'failed', error_3.message)];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Clínica Suspensa
    EmailService.prototype.sendClinicaSuspensa = function (clinica, motivo) {
        return __awaiter(this, void 0, void 0, function () {
            var assunto, html, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assunto = '⚠️ Aviso importante sobre sua clínica';
                        html = "\n      <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n        <h2 style=\"color: #dc2626;\">\u26A0\uFE0F Cl\u00EDnica Suspensa</h2>\n        <p>Ol\u00E1 <strong>".concat(clinica.responsavel_legal, "</strong>,</p>\n        <p>Informamos que a cl\u00EDnica <strong>").concat(clinica.nome_fantasia, "</strong> foi temporariamente suspensa no sistema PharmoPet.</p>\n        \n        ").concat(motivo ? "\n        <div style=\"background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;\">\n          <h3 style=\"margin-top: 0; color: #dc2626;\">Motivo:</h3>\n          <p>".concat(motivo, "</p>\n        </div>\n        ") : '', "\n\n        <p><strong>Durante a suspens\u00E3o:</strong></p>\n        <ul>\n          <li>Novas prescri\u00E7\u00F5es n\u00E3o podem ser emitidas</li>\n          <li>O acesso dos veterin\u00E1rios est\u00E1 bloqueado</li>\n          <li>Prescri\u00E7\u00F5es anteriores permanecem v\u00E1lidas</li>\n        </ul>\n\n        <p>Para regularizar a situa\u00E7\u00E3o, entre em contato conosco:</p>\n        <p style=\"background: #f3f4f6; padding: 15px; border-radius: 8px;\">\n          \uD83D\uDCE7 Email: <a href=\"mailto:suporte@pharmopet.com.br\">suporte@pharmopet.com.br</a><br>\n          \uD83D\uDCF1 WhatsApp: (11) 99999-9999\n        </p>\n\n        <p style=\"color: #6b7280; font-size: 14px; margin-top: 30px;\">\n          Equipe PharmoPet\n        </p>\n      </div>\n    ");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 6]);
                        return [4 /*yield*/, resend.emails.send({
                                from: FROM_EMAIL,
                                to: clinica.email,
                                subject: assunto,
                                html: html
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.logEmail(clinica.email, assunto, 'clinica_suspensa', 'sent')];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        error_4 = _a.sent();
                        console.error('Error sending email:', error_4);
                        return [4 /*yield*/, this.logEmail(clinica.email, assunto, 'clinica_suspensa', 'failed', error_4.message)];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Veterinário Vinculado
    EmailService.prototype.sendVeterinarioVinculado = function (vinculacao) {
        return __awaiter(this, void 0, void 0, function () {
            var assunto, html, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assunto = "Voc\u00EA foi adicionado \u00E0 cl\u00EDnica ".concat(vinculacao.clinica.nome_fantasia);
                        html = "\n      <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n        <h2 style=\"color: #16a34a;\">Bem-vindo \u00E0 ".concat(vinculacao.clinica.nome_fantasia, "!</h2>\n        <p>Ol\u00E1 <strong>Dr(a). ").concat(vinculacao.veterinario.nome, "</strong>,</p>\n        <p>Voc\u00EA foi vinculado como veterin\u00E1rio na cl\u00EDnica <strong>").concat(vinculacao.clinica.nome_fantasia, "</strong>.</p>\n        \n        <div style=\"background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;\">\n          <h3 style=\"margin-top: 0;\">Detalhes:</h3>\n          <p><strong>Cl\u00EDnica:</strong> ").concat(vinculacao.clinica.nome_fantasia, "</p>\n          <p><strong>CNPJ:</strong> ").concat(vinculacao.clinica.cnpj, "</p>\n          <p><strong>Endere\u00E7o:</strong> ").concat(vinculacao.clinica.logradouro, ", ").concat(vinculacao.clinica.numero, " - ").concat(vinculacao.clinica.cidade, "/").concat(vinculacao.clinica.estado, "</p>\n          <p><strong>Seu cargo:</strong> ").concat(vinculacao.cargo, "</p>\n        </div>\n\n        <p>Agora voc\u00EA pode:</p>\n        <ul>\n          <li>Emitir prescri\u00E7\u00F5es digitais pela cl\u00EDnica</li>\n          <li>Acessar o hist\u00F3rico de prescri\u00E7\u00F5es</li>\n          <li>Gerenciar seus pacientes</li>\n        </ul>\n\n        <p style=\"color: #6b7280; font-size: 14px; margin-top: 30px;\">\n          Equipe PharmoPet<br>\n          <a href=\"mailto:suporte@pharmopet.com.br\">suporte@pharmopet.com.br</a>\n        </p>\n      </div>\n    ");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 6]);
                        return [4 /*yield*/, resend.emails.send({
                                from: FROM_EMAIL,
                                to: vinculacao.veterinario.email,
                                subject: assunto,
                                html: html
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.logEmail(vinculacao.veterinario.email, assunto, 'veterinario_vinculado', 'sent')];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        error_5 = _a.sent();
                        console.error('Error sending email:', error_5);
                        return [4 /*yield*/, this.logEmail(vinculacao.veterinario.email, assunto, 'veterinario_vinculado', 'failed', error_5.message)];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Veterinário Desvinculado
    EmailService.prototype.sendVeterinarioDesvinculado = function (vinculacao) {
        return __awaiter(this, void 0, void 0, function () {
            var assunto, html, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assunto = "Desvincula\u00E7\u00E3o da cl\u00EDnica ".concat(vinculacao.clinica.nome_fantasia);
                        html = "\n      <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n        <h2 style=\"color: #6b7280;\">Desvincula\u00E7\u00E3o de Cl\u00EDnica</h2>\n        <p>Ol\u00E1 <strong>Dr(a). ".concat(vinculacao.veterinario.nome, "</strong>,</p>\n        <p>Informamos que voc\u00EA foi desvinculado da cl\u00EDnica <strong>").concat(vinculacao.clinica.nome_fantasia, "</strong>.</p>\n        \n        <div style=\"background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;\">\n          <p><strong>Cl\u00EDnica:</strong> ").concat(vinculacao.clinica.nome_fantasia, "</p>\n          <p><strong>Data de desvincula\u00E7\u00E3o:</strong> ").concat(new Date().toLocaleDateString('pt-BR'), "</p>\n        </div>\n\n        <p>A partir de agora:</p>\n        <ul>\n          <li>Voc\u00EA n\u00E3o poder\u00E1 mais emitir prescri\u00E7\u00F5es por esta cl\u00EDnica</li>\n          <li>Prescri\u00E7\u00F5es anteriores permanecem v\u00E1lidas</li>\n          <li>Seu acesso \u00E0s outras cl\u00EDnicas n\u00E3o foi afetado</li>\n        </ul>\n\n        <p>Se voc\u00EA acredita que isso foi um erro, entre em contato conosco.</p>\n\n        <p style=\"color: #6b7280; font-size: 14px; margin-top: 30px;\">\n          Equipe PharmoPet<br>\n          <a href=\"mailto:suporte@pharmopet.com.br\">suporte@pharmopet.com.br</a>\n        </p>\n      </div>\n    ");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 6]);
                        return [4 /*yield*/, resend.emails.send({
                                from: FROM_EMAIL,
                                to: vinculacao.veterinario.email,
                                subject: assunto,
                                html: html
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.logEmail(vinculacao.veterinario.email, assunto, 'veterinario_desvinculado', 'sent')];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        error_6 = _a.sent();
                        console.error('Error sending email:', error_6);
                        return [4 /*yield*/, this.logEmail(vinculacao.veterinario.email, assunto, 'veterinario_desvinculado', 'failed', error_6.message)];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Recuperação de Senha
    EmailService.prototype.sendPasswordResetEmail = function (email, token, userType) {
        return __awaiter(this, void 0, void 0, function () {
            var resetUrl, assunto, html, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resetUrl = "".concat(process.env.FRONTEND_URL || 'http://localhost:5173', "/reset-password?token=").concat(token);
                        assunto = '🔑 Recuperação de senha - PharmoPet';
                        html = "\n      <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n        <h2 style=\"color: #2563eb;\">Recupera\u00E7\u00E3o de Senha</h2>\n        <p>Ol\u00E1,</p>\n        <p>Voc\u00EA solicitou a recupera\u00E7\u00E3o de senha da sua conta no PharmoPet.</p>\n        \n        <div style=\"background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;\">\n          <p style=\"margin: 0;\"><strong>Clique no bot\u00E3o abaixo para redefinir sua senha:</strong></p>\n        </div>\n\n        <div style=\"text-align: center; margin: 30px 0;\">\n          <a href=\"".concat(resetUrl, "\" style=\"background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;\">\n            Redefinir Senha\n          </a>\n        </div>\n\n        <p style=\"color: #6b7280; font-size: 14px;\">\n          Ou copie e cole este link no seu navegador:<br>\n          <a href=\"").concat(resetUrl, "\" style=\"color: #2563eb; word-break: break-all;\">").concat(resetUrl, "</a>\n        </p>\n\n        <div style=\"background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;\">\n          <p style=\"margin: 0; color: #92400e;\"><strong>\u26A0\uFE0F Importante:</strong></p>\n          <ul style=\"margin: 10px 0; color: #92400e;\">\n            <li>Este link expira em <strong>1 hora</strong></li>\n            <li>Se voc\u00EA n\u00E3o solicitou esta recupera\u00E7\u00E3o, ignore este email</li>\n            <li>Nunca compartilhe este link com outras pessoas</li>\n          </ul>\n        </div>\n\n        <p style=\"color: #6b7280; font-size: 14px; margin-top: 30px;\">\n          Equipe PharmoPet<br>\n          <a href=\"mailto:suporte@pharmopet.com.br\">suporte@pharmopet.com.br</a>\n        </p>\n      </div>\n    ");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 6]);
                        return [4 /*yield*/, resend.emails.send({
                                from: FROM_EMAIL,
                                to: email,
                                subject: assunto,
                                html: html
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.logEmail(email, assunto, 'password_reset', 'sent')];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        error_7 = _a.sent();
                        console.error('Error sending email:', error_7);
                        return [4 /*yield*/, this.logEmail(email, assunto, 'password_reset', 'failed', error_7.message)];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return EmailService;
}());
exports.EmailService = EmailService;
