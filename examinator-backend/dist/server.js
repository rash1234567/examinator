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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const client_1 = __importDefault(require("./prisma/client"));
const port = process.env.PORT || 8989;
// app.get("/test", (req, res) => {
//     res.send("Test working");
// });
app_1.default.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
const server = app_1.default.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
const gracefulShutdown = (signal) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`${signal} received. Starting graceful shutdown...`);
    server.close(() => __awaiter(void 0, void 0, void 0, function* () {
        console.log("HTTP server closed.");
        try {
            yield client_1.default.$disconnect();
            console.log("Database connection closed.");
            process.exit(0);
        }
        catch (error) {
            console.error("Error closing database connection:", error);
            process.exit(1);
        }
    }));
});
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
