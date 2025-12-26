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
exports.AuthController = void 0;
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var jsonwebtoken_1 = require("jsonwebtoken");
var zod_1 = require("zod");
var prisma = new client_1.PrismaClient();
var AuthController = /** @class */ (function () {
    function AuthController() {
    }
    AuthController.prototype.loginVet = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var schema, _a, crv, password, vet, isValidPassword, token, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        schema = zod_1.z.object({
                            crv: zod_1.z.string(),
                            password: zod_1.z.string(),
                        });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        _a = schema.parse(req.body), crv = _a.crv, password = _a.password;
                        return [4 /*yield*/, prisma.veterinario.findUnique({
                                where: { crv: crv },
                            })];
                    case 2:
                        vet = _b.sent();
                        if (!vet) {
                            return [2 /*return*/, res.status(401).json({ error: 'Veterinário não encontrado' })];
                        }
                        return [4 /*yield*/, bcryptjs_1.default.compare(password, vet.senha_hash)];
                    case 3:
                        isValidPassword = _b.sent();
                        if (!isValidPassword) {
                            return [2 /*return*/, res.status(401).json({ error: 'Senha incorreta' })];
                        }
                        token = jsonwebtoken_1.default.sign({ id: vet.id, role: 'VET' }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '1d' });
                        return [2 /*return*/, res.json({
                                user: {
                                    id: vet.id,
                                    name: vet.nome,
                                    crv: vet.crv,
                                    email: vet.email,
                                    role: 'VET'
                                },
                                token: token,
                            })];
                    case 4:
                        error_1 = _b.sent();
                        if (error_1 instanceof zod_1.z.ZodError) {
                            return [2 /*return*/, res.status(400).json({ error: error_1.errors })];
                        }
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    AuthController.prototype.loginAdmin = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var schema, _a, email, password, admin, isValidPassword, token, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        schema = zod_1.z.object({
                            email: zod_1.z.string().email(),
                            password: zod_1.z.string(),
                        });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        _a = schema.parse(req.body), email = _a.email, password = _a.password;
                        return [4 /*yield*/, prisma.usuarioAdmin.findUnique({
                                where: { email: email },
                            })];
                    case 2:
                        admin = _b.sent();
                        if (!admin) {
                            return [2 /*return*/, res.status(401).json({ error: 'Administrador não encontrado' })];
                        }
                        return [4 /*yield*/, bcryptjs_1.default.compare(password, admin.senha_hash)];
                    case 3:
                        isValidPassword = _b.sent();
                        if (!isValidPassword) {
                            return [2 /*return*/, res.status(401).json({ error: 'Senha incorreta' })];
                        }
                        token = jsonwebtoken_1.default.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '1d' });
                        return [2 /*return*/, res.json({
                                user: {
                                    id: admin.id,
                                    name: admin.nome,
                                    email: admin.email,
                                    role: admin.role
                                },
                                token: token,
                            })];
                    case 4:
                        error_2 = _b.sent();
                        if (error_2 instanceof zod_1.z.ZodError) {
                            return [2 /*return*/, res.status(400).json({ error: error_2.errors })];
                        }
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return AuthController;
}());
exports.AuthController = AuthController;
