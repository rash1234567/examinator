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
  country,
  department,
  faculty,
}: {
  firstName: string;
  lastName: string;
  email?: string;
  password: string;
  role: "STUDENT" | "EXAMINER";
  matricNumber?: string;
  school: string;
  country?: string;
  department?: string;
  faculty?: string;
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
      country,
      department: department,
      faculty: faculty,
    },
  });
  return user;
}

export async function updateUser({
  id,
  firstName,
  lastName,
  email,
  password,
  role,
  matricNumber,
  school,
  country,
}: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "STUDENT" | "EXAMINER";
  matricNumber?: string;
  school: string;
  country: string;
}) {
  const user = await prisma.user.update({
    where: { id },
    data: {
      firstName,
      lastName,
      email,
      password,
      role,
      matricNumber,
      school,
      country,
    },
  });
  return user;
}

// export async function deleteAllUsers(): Promise<{ count: number }> {
//   const result = await prisma.user.deleteMany({});
//   return { count: result.count };
// }
