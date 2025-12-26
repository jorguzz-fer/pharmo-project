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
exports.DocumentoService = void 0;
var client_1 = require("@prisma/client");
var storage_service_1 = require("./storage.service");
var prisma = new client_1.PrismaClient();
var ALLOWED_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg'
];
var MAX_SIZE_MB = 10;
var BUCKET_NAME = 'clinica-documentos';
var DocumentoService = /** @class */ (function () {
    function DocumentoService() {
    }
    DocumentoService.prototype.upload = function (clinicaId, tipoDocumento, file, uploadedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, url, error, documento;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Validar tipo
                        if (!(0, storage_service_1.validateFileType)(file.mimetype, ALLOWED_TYPES)) {
                            throw new Error('Tipo de arquivo não permitido. Use PDF, PNG ou JPG.');
                        }
                        // Validar tamanho
                        if (!(0, storage_service_1.validateFileSize)(file.size, MAX_SIZE_MB)) {
                            throw new Error("Arquivo muito grande. M\u00E1ximo: ".concat(MAX_SIZE_MB, "MB"));
                        }
                        return [4 /*yield*/, (0, storage_service_1.uploadFile)(file, BUCKET_NAME, clinicaId)];
                    case 1:
                        _a = _b.sent(), url = _a.url, error = _a.error;
                        if (error || !url) {
                            throw new Error("Erro ao fazer upload: ".concat(error));
                        }
                        return [4 /*yield*/, prisma.clinicaDocumento.create({
                                data: {
                                    clinica_id: clinicaId,
                                    tipo_documento: tipoDocumento,
                                    nome_arquivo: file.originalname,
                                    url_arquivo: url,
                                    mime_type: file.mimetype,
                                    tamanho_bytes: file.size,
                                    uploaded_by: uploadedBy
                                }
                            })];
                    case 2:
                        documento = _b.sent();
                        return [2 /*return*/, documento];
                }
            });
        });
    };
    DocumentoService.prototype.list = function (clinicaId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.clinicaDocumento.findMany({
                        where: { clinica_id: clinicaId },
                        orderBy: { created_at: 'desc' }
                    })];
            });
        });
    };
    DocumentoService.prototype.delete = function (documentoId) {
        return __awaiter(this, void 0, void 0, function () {
            var documento, urlParts, fileName, clinicaId, filePath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.clinicaDocumento.findUnique({
                            where: { id: documentoId }
                        })];
                    case 1:
                        documento = _a.sent();
                        if (!documento) {
                            throw new Error('Documento não encontrado');
                        }
                        urlParts = documento.url_arquivo.split('/');
                        fileName = urlParts[urlParts.length - 1];
                        clinicaId = urlParts[urlParts.length - 2];
                        filePath = "".concat(clinicaId, "/").concat(fileName);
                        // Deletar do Supabase
                        return [4 /*yield*/, (0, storage_service_1.deleteFile)(BUCKET_NAME, filePath)];
                    case 2:
                        // Deletar do Supabase
                        _a.sent();
                        // Deletar do banco
                        return [4 /*yield*/, prisma.clinicaDocumento.delete({
                                where: { id: documentoId }
                            })];
                    case 3:
                        // Deletar do banco
                        _a.sent();
                        return [2 /*return*/, { success: true }];
                }
            });
        });
    };
    return DocumentoService;
}());
exports.DocumentoService = DocumentoService;
