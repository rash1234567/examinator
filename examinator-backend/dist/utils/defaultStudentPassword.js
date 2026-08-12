"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultStudentPassword = defaultStudentPassword;
/** Initial password for lecturer-created students when none is provided. */
function defaultStudentPassword(lastName) {
    return lastName.trim();
}
