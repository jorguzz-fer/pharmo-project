"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var helmet_1 = require("helmet");
var dotenv_1 = require("dotenv");
var auth_routes_1 = require("./routes/auth.routes");
var vet_routes_1 = require("./routes/vet.routes");
var prescricao_routes_1 = require("./routes/prescricao.routes");
var payment_routes_1 = require("./routes/payment.routes");
var admin_routes_1 = require("./routes/admin.routes");
var clinica_routes_1 = require("./routes/clinica.routes");
var veterinario_routes_1 = require("./routes/veterinario.routes");
var password_reset_routes_1 = require("./routes/password-reset.routes");
dotenv_1.default.config();
var app = (0, express_1.default)();
var PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api', auth_routes_1.authRoutes);
app.use('/api', vet_routes_1.vetRoutes);
app.use('/api', prescricao_routes_1.prescricaoRoutes);
app.use('/api', payment_routes_1.paymentRoutes);
app.use('/api', admin_routes_1.adminRoutes);
app.use('/api', clinica_routes_1.clinicaRoutes);
app.use('/api', veterinario_routes_1.veterinarioRoutes);
app.use('/api', password_reset_routes_1.passwordResetRoutes);
app.get('/health', function (_req, res) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.listen(PORT, function () {
    console.log("Server running on port ".concat(PORT));
});
