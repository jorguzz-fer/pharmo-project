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
exports.whatsappService = exports.WhatsappService = void 0;
var WhatsappService = /** @class */ (function () {
    function WhatsappService() {
        this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
        this.token = process.env.WHATSAPP_TOKEN || 'mock_token';
    }
    WhatsappService.prototype.sendText = function (to, message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Debug log to use private vars (cleaner than @ts-ignore for mock)
                // console.log(`[DEBUG] API: ${this.apiUrl} Token: ${this.token}`);
                console.log("[WHATSAPP] Sending to ".concat(to, ": \"").concat(message, "\" using ").concat(this.apiUrl, " and ").concat(this.token));
                // In production: axios.post(`${this.apiUrl}/messages`, { ... })
                return [2 /*return*/, true];
            });
        });
    };
    WhatsappService.prototype.sendPrescriptionLink = function (to, tutorName, link) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                message = "Ol\u00E1 ".concat(tutorName, ", sua receita digital da Pharmo est\u00E1 pronta! Acesse e fa\u00E7a seu pedido aqui: ").concat(link);
                return [2 /*return*/, this.sendText(to, message)];
            });
        });
    };
    WhatsappService.prototype.sendPaymentConfirmation = function (to, tutorName, orderId) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                message = "Ol\u00E1 ".concat(tutorName, ", confirmamos o pagamento do seu pedido #").concat(orderId, ". Em breve iniciaremos a manipula\u00E7\u00E3o! \uD83D\uDC3E");
                return [2 /*return*/, this.sendText(to, message)];
            });
        });
    };
    return WhatsappService;
}());
exports.WhatsappService = WhatsappService;
exports.whatsappService = new WhatsappService();
