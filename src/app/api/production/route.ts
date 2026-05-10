import { NextRequest, NextResponse } from 'next/server';
import { db, productionEntries, products, lines, profiles } from '@/shared/lib/db';
import { eq, desc, gte, and } from 'drizzle-orm';
import { auth } from '@/auth';

/** Match YYYY-MM-DD strictly. */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Difference in whole calendar days between two YYYY-MM-DD strings (a − b). */
function diffDaysISO(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  // Use UTC arithmetic so DST never shifts the count.
  const at = Date.UTC(ay, am - 1, ad);
  const bt = Date.UTC(by, bm - 1, bd);
  return Math.round((at - bt) / 86_400_000);
}

/** UTC calendar date as YYYY-MM-DD — used for the anti-spoof bound only. */
function utcTodayISO(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lineId = searchParams.get('line_id');
    const date = searchParams.get('date');         // YYYY-MM-DD — preferred
    const startDate = searchParams.get('start_date'); // legacy back-compat

    const conditions = [];
    if (lineId) {
      conditions.push(eq(productionEntries.lineId, lineId));
    }
    if (date && ISO_DATE_RE.test(date)) {
      // New, preferred path: filter by the production calendar day.
      conditions.push(eq(productionEntries.productionDate, date));
    } else if (startDate) {
      // Legacy: any caller still sending an ISO timestamp is reinterpreted
      // as a production-date floor (its calendar day in UTC).
      const floor = new Date(startDate);
      if (!Number.isNaN(floor.getTime())) {
        const yyyy = floor.getUTCFullYear();
        const mm = String(floor.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(floor.getUTCDate()).padStart(2, '0');
        conditions.push(gte(productionEntries.productionDate, `${yyyy}-${mm}-${dd}`));
      }
    }

    const entries = await db
      .select({
        id: productionEntries.id,
        lineId: productionEntries.lineId,
        productId: productionEntries.productId,
        quantity: productionEntries.quantity,
        unitOfMeasure: productionEntries.unitOfMeasure,
        batchNumber: productionEntries.batchNumber,
        notes: productionEntries.notes,
        createdBy: productionEntries.createdBy,
        createdAt: productionEntries.createdAt,
        productionDate: productionEntries.productionDate,
        product: {
          id: products.id,
          name: products.name,
          code: products.code,
        },
        line: {
          id: lines.id,
          name: lines.name,
          code: lines.code,
        },
        profile: {
          id: profiles.id,
          fullName: profiles.fullName,
        },
      })
      .from(productionEntries)
      .leftJoin(products, eq(productionEntries.productId, products.id))
      .leftJoin(lines, eq(productionEntries.lineId, lines.id))
      .leftJoin(profiles, eq(productionEntries.createdBy, profiles.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(productionEntries.productionDate), desc(productionEntries.createdAt))
      .limit(100);

    const result = entries.map(entry => ({
      id: entry.id,
      line_id: entry.lineId,
      product_id: entry.productId,
      quantity: Number(entry.quantity),
      unit_of_measure: entry.unitOfMeasure,
      batch_number: entry.batchNumber,
      notes: entry.notes,
      created_by: entry.createdBy,
      created_at: entry.createdAt?.toISOString(),
      production_date: entry.productionDate,
      products: entry.product,
      lines: entry.line,
      profiles: entry.profile ? {
        id: entry.profile.id,
        full_name: entry.profile.fullName,
      } : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Production API error:', error);
    return NextResponse.json({ error: 'Failed to fetch production entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      line_id,
      product_id,
      quantity,
      unit_of_measure,
      batch_number,
      notes,
      production_date,
      client_today,
    } = body;

    // ---- Date / role guard (FR-014, FR-012) -------------------------------
    // 1. Format check.
    if (typeof production_date !== 'string' || !ISO_DATE_RE.test(production_date)
        || typeof client_today !== 'string' || !ISO_DATE_RE.test(client_today)) {
      return NextResponse.json({ error: 'invalid_production_date' }, { status: 400 });
    }
    // 2. Anti-spoof bound: client_today must be within ±2 calendar days of UTC today.
    const utcToday = utcTodayISO();
    if (Math.abs(diffDaysISO(client_today, utcToday)) > 2) {
      return NextResponse.json({ error: 'invalid_production_date' }, { status: 400 });
    }
    // 3. No future dates for anyone.
    if (diffDaysISO(production_date, client_today) > 0) {
      return NextResponse.json({ error: 'invalid_production_date' }, { status: 400 });
    }
    // 4. Role gate. Non-admins capped at client_today − 1 day.
    const isAdmin = (session.user as { role?: string }).role === 'admin';
    if (!isAdmin && diffDaysISO(client_today, production_date) > 1) {
      return NextResponse.json({ error: 'backdate_not_allowed_for_role' }, { status: 403 });
    }

    const [newEntry] = await db.insert(productionEntries).values({
      lineId: line_id,
      productId: product_id,
      quantity: quantity.toString(),
      unitOfMeasure: unit_of_measure,
      batchNumber: batch_number,
      notes,
      createdBy: session.user.id,
      productionDate: production_date,
    }).returning();

    return NextResponse.json({
      id: newEntry.id,
      line_id: newEntry.lineId,
      product_id: newEntry.productId,
      quantity: Number(newEntry.quantity),
      unit_of_measure: newEntry.unitOfMeasure,
      batch_number: newEntry.batchNumber,
      notes: newEntry.notes,
      created_by: newEntry.createdBy,
      created_at: newEntry.createdAt?.toISOString(),
      production_date: newEntry.productionDate,
    });
  } catch (error) {
    console.error('Create production entry error:', error);
    return NextResponse.json({ error: 'Failed to create production entry' }, { status: 500 });
  }
}
