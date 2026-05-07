import { config } from 'dotenv';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

config({ path: '.env' });

async function seedMovements() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3307'),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'estoque_simples',
  });

  try {
    console.log('📦 Criando movimentações de estoque (entrada e saída)...\n');

    // Get all products
    const [products]: any = await connection.query('SELECT id, preco_venda, preco_custo, qtd_atual, name FROM products');

    if (products.length === 0) {
      console.log('❌ Nenhum produto encontrado!');
      return;
    }

    console.log(`✓ ${products.length} produtos encontrados\n`);

    let totalMovements = 0;

    for (const product of products) {
      // Create entry movements (entrada)
      const entryQuantities = [
        Math.floor(product.qtd_atual * 0.3),
        Math.floor(product.qtd_atual * 0.4),
        Math.floor(product.qtd_atual * 0.3),
      ];

      for (let i = 0; i < entryQuantities.length; i++) {
        const movementId = uuidv4();
        const quantity = entryQuantities[i];
        const days = Math.floor(Math.random() * 30) + 1;
        const movementDate = new Date();
        movementDate.setDate(movementDate.getDate() - days);

        await connection.execute(
          `INSERT INTO movements (id, produto_id, tipo, quantidade, preco_unitario, data, referencia, created_at)
           VALUES (?, ?, 'entrada', ?, ?, ?, ?, NOW())`,
          [
            movementId,
            product.id,
            quantity,
            product.preco_custo,
            movementDate.toISOString().split('T')[0],
            `NF-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
          ]
        );

        totalMovements++;
      }

      // Create exit movements (saída) - 20-40% of current stock
      const exitQuantity = Math.floor(product.qtd_atual * (0.2 + Math.random() * 0.2));
      if (exitQuantity > 0) {
        const movementId = uuidv4();
        const days = Math.floor(Math.random() * 15) + 1;
        const movementDate = new Date();
        movementDate.setDate(movementDate.getDate() - days);

        await connection.execute(
          `INSERT INTO movements (id, produto_id, tipo, quantidade, preco_unitario, data, referencia, created_at)
           VALUES (?, ?, 'saida', ?, ?, ?, ?, NOW())`,
          [
            movementId,
            product.id,
            exitQuantity,
            product.preco_venda,
            movementDate.toISOString().split('T')[0],
            `PED-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
          ]
        );

        totalMovements++;
      }

      console.log(`✓ ${product.name}: ${entryQuantities.length} entradas + 1 saída`);
    }

    console.log(`\n✅ Movimentações criadas com sucesso!`);
    console.log(`📊 Resumo:`);
    console.log(`   - ${totalMovements} movimentações registradas`);
    console.log(`   - ${products.length} produtos com entradas e saídas`);

  } catch (error) {
    console.error('❌ Erro ao criar movimentações:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedMovements();
