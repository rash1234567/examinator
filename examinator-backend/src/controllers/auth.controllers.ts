import { Request, Response } from "express";
import { createUser } from "../services/user.service";
import prisma from "../prisma/client";

export async function registerAccountForExaminer(req: Request, res: Response) {
  try {
    const { firstName, lastName, email, password, school } = req.body;
    const user = await createUser({
      firstName,
      lastName,
      email,
      password,
      role: "EXAMINER",
      school,
    });
    res.status(201).json(user);
  } catch (error: any) {
    console.log(error);
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Something went wrong" });
  }
}


export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}
