import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { movements, products } from '../../../lib/schema';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Filtros de data
    let dateFilter = undefined;
    if (startDate && endDate) {
      dateFilter = and(
        gte(movements.data, startDate),
        lte(movements.data, endDate)
      );
    }

    // Buscar movimentos
    const movementsData = await db
      .select({
        id: movements.id,
        type: movements.tipo,
        quantity: movements.quantidade,
        unitPrice: movements.precoUnitario,
        date: sql<string>`DATE(${movements.data})`,
        reference: movements.referencia,
        productName: products.name,
        productCode: products.codigoInterno,
      })
      .from(movements)
      .innerJoin(products, eq(movements.produtoId, products.id))
      .where(dateFilter)
      .orderBy(desc(movements.data));

    // Estatísticas gerais
    const stats = await db
      .select({
        totalProducts: sql<number>`count(distinct ${products.id})`,
        totalStock: sql<number>`sum(${products.qtdAtual})`,
      })
      .from(products)
      .leftJoin(movements, eq(products.id, movements.produtoId))
      .where(dateFilter);

    return NextResponse.json({
      movements: movementsData,
      stats: stats[0],
    });
  } catch (error) {
    console.error('Erro ao gerar dados do dashboard:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
