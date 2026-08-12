"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEmail = normalizeEmail;
exports.normalizeMatric = normalizeMatric;
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function normalizeMatric(matric) {
    return matric.trim().toUpperCase();
}
