import { NextResponse } from "next/server";
import os from "os";

// Prevent Next.js from caching GET responses
export const dynamic = "force-dynamic";

interface PendingTx { id: string; amount: number; description: string; timestamp: number; }
interface TxResult  { id: string; status: "approved" | "declined"; }

// globalThis persists across Turbopack hot-reloads in dev
const g = globalThis as typeof globalThis & {
  _termPending?: PendingTx | null;
  _termResult?:  TxResult  | null;
};
if (g._termPending === undefined) g._termPending = null;
if (g._termResult  === undefined) g._termResult  = null;

function getLocalIPs(): string[] {
  const nets = os.networkInterfaces();
  const ips: string[] = [];
  for (const ifaces of Object.values(nets)) {
    for (const iface of ifaces ?? []) {
      if (iface.family === "IPv4" && !iface.internal) ips.push(iface.address);
    }
  }
  return ips;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "result") return NextResponse.json({ result: g._termResult });
  if (action === "ip")     return NextResponse.json({ ips: getLocalIPs() });

  return NextResponse.json({ pending: g._termPending });
}

export async function POST(req: Request) {
  const body = await req.json();

  if (body.action === "request") {
    g._termPending = { id: body.id, amount: body.amount, description: body.description, timestamp: Date.now() };
    g._termResult  = null;
    return NextResponse.json({ ok: true });
  }
  if (body.action === "approve") {
    g._termResult  = { id: body.id, status: "approved" };
    g._termPending = null;
    return NextResponse.json({ ok: true });
  }
  if (body.action === "decline") {
    g._termResult  = { id: body.id, status: "declined" };
    g._termPending = null;
    return NextResponse.json({ ok: true });
  }
  if (body.action === "cancel") {
    if (g._termPending?.id === body.id) g._termPending = null;
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
