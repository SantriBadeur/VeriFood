import { NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';

export async function GET() {
  try {
    const users = await authService.listUsers();
    return NextResponse.json(users);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user = await authService.createUser(body);
    return NextResponse.json(user, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, isActive } = await req.json();
    const user = await authService.toggleActive(userId, isActive);
    return NextResponse.json(user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

