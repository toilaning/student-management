import { NextResponse } from 'next/server';
import { repo } from '@/repositories';

export async function GET() {
  const logs = await repo.getAllAuditLogs();
  return NextResponse.json({ logs });
}
