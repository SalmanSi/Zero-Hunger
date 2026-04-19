"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const listings_1 = __importDefault(require("./routes/listings"));
const users_1 = __importDefault(require("./routes/users"));
const geocode_1 = __importDefault(require("./routes/geocode"));
const rides_1 = __importDefault(require("./routes/rides"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173'];
app.use((0, cors_1.default)({
    origin: corsOrigins,
    credentials: true
}));
app.use(express_1.default.json({ limit: '10kb' }));
app.use('/api/auth', auth_1.default);
app.use('/api/listings', listings_1.default);
app.use('/api/admin/users', users_1.default);
app.use('/api/geocode', geocode_1.default);
app.use('/api/rides', rides_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ZeroHunger API is running' });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`ZeroHunger API running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map