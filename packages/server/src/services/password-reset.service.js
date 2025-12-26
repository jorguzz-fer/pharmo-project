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
exports.PasswordResetService = void 0;
var client_1 = require("@prisma/client");
var crypto_1 = require("crypto");
var bcryptjs_1 = require("bcryptjs");
var email_service_1 = require("./email.service");
var prisma = new client_1.PrismaClient();
var emailService = new email_service_1.EmailService();
var PasswordResetService = /** @class */ (function () {
    function PasswordResetService() {
    }
    // Gerar token único
    PasswordResetService.prototype.generateToken = function () {
        return crypto_1.default.randomBytes(32).toString('hex');
    };
    // Solicitar recuperação de senha
    PasswordResetService.prototype.requestPasswordReset = function (email, userType) {
        return __awaiter(this, void 0, void 0, function () {
            var userExists, vet, admin, token, expiresAt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userExists = false;
                        if (!(userType === 'veterinario')) return [3 /*break*/, 2];
                        return [4 /*yield*/, prisma.veterinario.findUnique({ where: { email: email } })];
                    case 1:
                        vet = _a.sent();
                        userExists = !!vet;
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, prisma.usuarioAdmin.findUnique({ where: { email: email } })];
                    case 3:
                        admin = _a.sent();
                        userExists = !!admin;
                        _a.label = 4;
                    case 4:
                        if (!userExists) {
                            // Por segurança, não revelar se o email existe ou não
                            return [2 /*return*/, { success: true, message: 'Se o email existir, você receberá instruções para redefinir sua senha.' }];
                        }
                        // Invalidar tokens anteriores
                        return [4 /*yield*/, prisma.passwordResetToken.updateMany({
                                where: {
                                    email: email,
                                    user_type: userType,
                                    used: false
                                },
                                data: { used: true }
                            })];
                    case 5:
                        // Invalidar tokens anteriores
                        _a.sent();
                        token = this.generateToken();
                        expiresAt = new Date();
                        expiresAt.setHours(expiresAt.getHours() + 1);
                        return [4 /*yield*/, prisma.passwordResetToken.create({
                                data: {
                                    email: email,
                                    token: token,
                                    user_type: userType,
                                    expires_at: expiresAt
                                }
                            })];
                    case 6:
                        _a.sent();
                        // Enviar email
                        return [4 /*yield*/, emailService.sendPasswordResetEmail(email, token, userType)];
                    case 7:
                        // Enviar email
                        _a.sent();
                        return [2 /*return*/, { success: true, message: 'Se o email existir, você receberá instruções para redefinir sua senha.' }];
                }
            });
        });
    };
    // Validar token
    PasswordResetService.prototype.validateToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var resetToken;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.passwordResetToken.findUnique({
                            where: { token: token }
                        })];
                    case 1:
                        resetToken = _a.sent();
                        if (!resetToken) {
                            return [2 /*return*/, { valid: false, error: 'Token inválido' }];
                        }
                        if (resetToken.used) {
                            return [2 /*return*/, { valid: false, error: 'Token já foi utilizado' }];
                        }
                        if (new Date() > resetToken.expires_at) {
                            return [2 /*return*/, { valid: false, error: 'Token expirado' }];
                        }
                        return [2 /*return*/, { valid: true, email: resetToken.email, userType: resetToken.user_type }];
                }
            });
        });
    };
    // Redefinir senha
    PasswordResetService.prototype.resetPassword = function (token, newPassword) {
        return __awaiter(this, void 0, void 0, function () {
            var validation, hashedPassword;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.validateToken(token)];
                    case 1:
                        validation = _a.sent();
                        if (!validation.valid) {
                            throw new Error(validation.error);
                        }
                        return [4 /*yield*/, bcryptjs_1.default.hash(newPassword, 10)];
                    case 2:
                        hashedPassword = _a.sent();
                        if (!(validation.userType === 'veterinario')) return [3 /*break*/, 4];
                        return [4 /*yield*/, prisma.veterinario.update({
                                where: { email: validation.email },
                                data: { senha_hash: hashedPassword }
                            })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, prisma.usuarioAdmin.update({
                            where: { email: validation.email },
                            data: { senha_hash: hashedPassword }
                        })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: 
                    // Marcar token como usado
                    return [4 /*yield*/, prisma.passwordResetToken.update({
                            where: { token: token },
                            data: {
                                used: true,
                                used_at: new Date()
                            }
                        })];
                    case 7:
                        // Marcar token como usado
                        _a.sent();
                        return [2 /*return*/, { success: true, message: 'Senha redefinida com sucesso' }];
                }
            });
        });
    };
    // Limpar tokens expirados (executar periodicamente)
    PasswordResetService.prototype.cleanupExpiredTokens = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.passwordResetToken.deleteMany({
                            where: {
                                OR: [
                                    { expires_at: { lt: new Date() } },
                                    { used: true, used_at: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // 7 dias
                                ]
                            }
                        })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, { deleted: result.count }];
                }
            });
        });
    };
    return PasswordResetService;
}());
exports.PasswordResetService = PasswordResetService;
