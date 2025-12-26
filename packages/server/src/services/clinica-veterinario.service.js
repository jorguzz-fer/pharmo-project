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
exports.ClinicaVeterinarioService = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var ClinicaVeterinarioService = /** @class */ (function () {
    function ClinicaVeterinarioService() {
    }
    ClinicaVeterinarioService.prototype.vincular = function (clinicaId, veterinarioId, cargo) {
        return __awaiter(this, void 0, void 0, function () {
            var clinica, veterinario, vinculacaoExistente, vinculacao_1, vinculacao, EmailService, emailService;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.clinica.findUnique({
                            where: { id: clinicaId }
                        })];
                    case 1:
                        clinica = _a.sent();
                        if (!clinica) {
                            throw new Error('Clínica não encontrada');
                        }
                        if (clinica.status !== 'APROVADA') {
                            throw new Error('Apenas clínicas aprovadas podem ter veterinários vinculados');
                        }
                        return [4 /*yield*/, prisma.veterinario.findUnique({
                                where: { id: veterinarioId }
                            })];
                    case 2:
                        veterinario = _a.sent();
                        if (!veterinario) {
                            throw new Error('Veterinário não encontrado');
                        }
                        return [4 /*yield*/, prisma.clinicaVeterinario.findUnique({
                                where: {
                                    clinica_id_veterinario_id: {
                                        clinica_id: clinicaId,
                                        veterinario_id: veterinarioId
                                    }
                                }
                            })];
                    case 3:
                        vinculacaoExistente = _a.sent();
                        if (!vinculacaoExistente) return [3 /*break*/, 5];
                        if (vinculacaoExistente.status === 'ativo') {
                            throw new Error('Veterinário já está vinculado a esta clínica');
                        }
                        return [4 /*yield*/, prisma.clinicaVeterinario.update({
                                where: { id: vinculacaoExistente.id },
                                data: {
                                    status: 'ativo',
                                    cargo: cargo || vinculacaoExistente.cargo
                                },
                                include: {
                                    clinica: true,
                                    veterinario: true
                                }
                            })];
                    case 4:
                        vinculacao_1 = _a.sent();
                        return [2 /*return*/, vinculacao_1];
                    case 5: return [4 /*yield*/, prisma.clinicaVeterinario.create({
                            data: {
                                clinica_id: clinicaId,
                                veterinario_id: veterinarioId,
                                cargo: cargo || 'Veterinário',
                                status: 'ativo'
                            },
                            include: {
                                clinica: true,
                                veterinario: true
                            }
                        })];
                    case 6:
                        vinculacao = _a.sent();
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./email.service'); })];
                    case 7:
                        EmailService = (_a.sent()).EmailService;
                        emailService = new EmailService();
                        return [4 /*yield*/, emailService.sendVeterinarioVinculado(vinculacao)];
                    case 8:
                        _a.sent();
                        return [2 /*return*/, vinculacao];
                }
            });
        });
    };
    ClinicaVeterinarioService.prototype.desvincular = function (clinicaId, veterinarioId) {
        return __awaiter(this, void 0, void 0, function () {
            var vinculacao, updated, EmailService, emailService;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.clinicaVeterinario.findUnique({
                            where: {
                                clinica_id_veterinario_id: {
                                    clinica_id: clinicaId,
                                    veterinario_id: veterinarioId
                                }
                            },
                            include: {
                                clinica: true,
                                veterinario: true
                            }
                        })];
                    case 1:
                        vinculacao = _a.sent();
                        if (!vinculacao) {
                            throw new Error('Vinculação não encontrada');
                        }
                        return [4 /*yield*/, prisma.clinicaVeterinario.update({
                                where: { id: vinculacao.id },
                                data: { status: 'inativo' },
                                include: {
                                    clinica: true,
                                    veterinario: true
                                }
                            })];
                    case 2:
                        updated = _a.sent();
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./email.service'); })];
                    case 3:
                        EmailService = (_a.sent()).EmailService;
                        emailService = new EmailService();
                        return [4 /*yield*/, emailService.sendVeterinarioDesvinculado(updated)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    ClinicaVeterinarioService.prototype.listarVeterinarios = function (clinicaId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.clinicaVeterinario.findMany({
                        where: {
                            clinica_id: clinicaId,
                            status: 'ativo'
                        },
                        include: {
                            veterinario: {
                                select: {
                                    id: true,
                                    nome: true,
                                    cpf: true,
                                    crv: true,
                                    email: true,
                                    telefone: true,
                                    especialidades: true,
                                    status: true
                                }
                            }
                        },
                        orderBy: { created_at: 'desc' }
                    })];
            });
        });
    };
    ClinicaVeterinarioService.prototype.listarClinicas = function (veterinarioId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.clinicaVeterinario.findMany({
                        where: {
                            veterinario_id: veterinarioId,
                            status: 'ativo'
                        },
                        include: {
                            clinica: {
                                select: {
                                    id: true,
                                    nome_fantasia: true,
                                    razao_social: true,
                                    cnpj: true,
                                    cidade: true,
                                    estado: true,
                                    status: true,
                                    telefone: true,
                                    email: true
                                }
                            }
                        },
                        orderBy: { created_at: 'desc' }
                    })];
            });
        });
    };
    return ClinicaVeterinarioService;
}());
exports.ClinicaVeterinarioService = ClinicaVeterinarioService;
