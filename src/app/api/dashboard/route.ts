import { NextResponse } from 'next/server';
import { db, productionEntries, wasteEntries, damageEntries, reprocessingEntries, products, profiles } from '@/shared/lib/db';
import { eq, gte, sql, desc } from 'drizzle-orm';
import { auth } from '@/auth';

/**
 * Compute today's calendar date in the configured factory time zone, as
 * YYYY-MM-DD. Live data-entry pages use the user's browser TZ; this server
 * route uses a single canonical TZ so cross-user dashboards agree on "today."
 * See specs/001-backdated-production-entries/research.md (Decision 2).
 */
function factoryTodayISO(): string {
  const tz = process.env.FACTORY_TIMEZONE || 'Africa/Cairo';
  // Intl gives us Y/M/D parts in the requested TZ without monkey-patching Date.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const factoryToday = factoryTodayISO();

    // Today's production count — keyed by production_date (FR-016).
    const [productionResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productionEntries)
      .where(eq(productionEntries.productionDate, factoryToday));

    // Pending waste approvals (unrelated to production_date).
    const [pendingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(wasteEntries)
      .where(eq(wasteEntries.approvalStatus, 'pending'));

    // Today's waste / reprocessing — out of scope; still keyed by created_at.
    const [wasteResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(wasteEntries)
      .where(gte(wasteEntries.createdAt, today));

    const [reprocessingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reprocessingEntries)
      .where(gte(reprocessingEntries.createdAt, today));

    // Recent production entries — sorted by production_date then insertion.
    const recentProduction = await db
      .select({
        id: productionEntries.id,
        quantity: productionEntries.quantity,
        createdAt: productionEntries.createdAt,
        productionDate: productionEntries.productionDate,
        productName: products.name,
        userName: profiles.fullName,
      })
      .from(productionEntries)
      .leftJoin(products, eq(productionEntries.productId, products.id))
      .leftJoin(profiles, eq(productionEntries.createdBy, profiles.id))
      .orderBy(desc(productionEntries.productionDate), desc(productionEntries.createdAt))
      .limit(5);

    // Recent waste / damage — out of scope; still by created_at.
    const recentWaste = await db
      .select({
        id: wasteEntries.id,
        quantity: wasteEntries.quantity,
        createdAt: wasteEntries.createdAt,
        productName: products.name,
        userName: profiles.fullName,
      })
      .from(wasteEntries)
      .leftJoin(products, eq(wasteEntries.productId, products.id))
      .leftJoin(profiles, eq(wasteEntries.createdBy, profiles.id))
      .orderBy(desc(wasteEntries.createdAt))
      .limit(5);

    const recentDamage = await db
      .select({
        id: damageEntries.id,
        quantity: damageEntries.quantity,
        createdAt: damageEntries.createdAt,
        productName: products.name,
        userName: profiles.fullName,
      })
      .from(damageEntries)
      .leftJoin(products, eq(damageEntries.productId, products.id))
      .leftJoin(profiles, eq(damageEntries.createdBy, profiles.id))
      .orderBy(desc(damageEntries.createdAt))
      .limit(5);

    // Combine and format activities. Production rows expose production_date;
    // damage / waste rows continue to use created_at as their day key.
    const activities = [
      ...recentProduction.map(e => ({
        id: e.id,
        type: 'production' as const,
        product_name: e.productName || 'Unknown',
        quantity: Number(e.quantity),
        created_at: e.createdAt.toISOString(),
        production_date: e.productionDate,
        user_name: e.userName || 'Unknown',
      })),
      ...recentWaste.map(e => ({
        id: e.id,
        type: 'waste' as const,
        product_name: e.productName || 'Unknown',
        quantity: Number(e.quantity),
        created_at: e.createdAt.toISOString(),
        user_name: e.userName || 'Unknown',
      })),
      ...recentDamage.map(e => ({
        id: e.id,
        type: 'damage' as const,
        product_name: e.productName || 'Unknown',
        quantity: Number(e.quantity),
        created_at: e.createdAt.toISOString(),
        user_name: e.userName || 'Unknown',
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return NextResponse.json({
      stats: {
        todayProduction: Number(productionResult?.count || 0),
        pendingApprovals: Number(pendingResult?.count || 0),
        todayWaste: Number(wasteResult?.count || 0),
        todayReprocessing: Number(reprocessingResult?.count || 0),
      },
      recentActivity: activities,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
