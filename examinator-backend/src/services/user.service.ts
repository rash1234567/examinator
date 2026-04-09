import e from "express";
import prisma from "../prisma/client";
import bcrypt from "bcrypt";

export async function createUser({
  firstName,
  lastName,
  email,
  password,
  role,
  matricNumber,
  school,
}: {
  firstName: string;
  lastName: string;
  email?: string;
  password: string;
  role: "STUDENT" | "EXAMINER";
  matricNumber?: string;
  school: string;
}) {
  let hashedPassword;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  } else {
    hashedPassword = await bcrypt.hash(lastName, 10);
  }
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      matricNumber: role === "STUDENT" ? matricNumber : null,
      school,
    },
  });
  return user;
}
