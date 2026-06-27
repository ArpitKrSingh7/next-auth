import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "../../../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, username } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if credentials email is already taken
    const existingByEmail = await prisma.user.findUnique({
      where: { credentialsEmail: email },
    });

    if (existingByEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Check if username is taken
    if (username) {
      const existingByUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingByUsername) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        credentialsEmail: email,
        username: username || null,
        name: name || null,
        passwordHash,
      },
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.credentialsEmail,
          username: user.username,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
