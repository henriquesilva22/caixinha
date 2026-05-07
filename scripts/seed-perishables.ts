import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2/promise';

config({ path: '.env' });

type Category = { name: string; slug: string };
type Warehouse = { name: string; code: string; description: string };

type SeedItem = {
  name: string;
  codigoInterno: string;
  barcode: string;
  description: string;
  precoVenda: number;
  precoCusto: number;
  qtdAtual: number;
  ncm: string;
  categoryName: string;
  isPerishable: boolean;
};

const categories: Category[] = [
  { name: 'Grains and Cereals', slug: 'grains-and-cereals' },
  { name: 'Dairy', slug: 'dairy' },
  { name: 'Beverages', slug: 'beverages' },
  { name: 'Canned', slug: 'canned' },
  { name: 'Bakery', slug: 'bakery' },
  { name: 'Snacks', slug: 'snacks' },
  { name: 'Condiments', slug: 'condiments' },
  { name: 'Sweets', slug: 'sweets' },
  { name: 'Frozen', slug: 'frozen' },
  { name: 'Produce', slug: 'produce' },
];

const warehouses: Warehouse[] = [
  { name: 'Shelf A1', code: 'P-A1', description: 'Top shelf A' },
  { name: 'Shelf A2', code: 'P-A2', description: 'Middle shelf A' },
  { name: 'Shelf B1', code: 'P-B1', description: 'Top shelf B' },
  { name: 'Shelf B2', code: 'P-B2', description: 'Middle shelf B' },
  { name: 'Freezer 1', code: 'F-1', description: 'Freezer' },
];

const baseItems: Omit<SeedItem, 'codigoInterno' | 'barcode' | 'qtdAtual'>[] = [
  {
    name: 'Rice 5kg',
    description: 'Whole grain rice',
    precoVenda: 28.5,
    precoCusto: 15,
    ncm: '10061010',
    categoryName: 'Grains and Cereals',
    isPerishable: false,
  },
  {
    name: 'Beans 1kg',
    description: 'Black beans',
    precoVenda: 8.9,
    precoCusto: 4.5,
    ncm: '07133190',
    categoryName: 'Grains and Cereals',
    isPerishable: false,
  },
  {
    name: 'Milk Powder 400g',
    description: 'Whole milk powder',
    precoVenda: 12.5,
    precoCusto: 6,
    ncm: '04022110',
    categoryName: 'Dairy',
    isPerishable: true,
  },
  {
    name: 'Cheese 500g',
    description: 'Semi-cured cheese',
    precoVenda: 32,
    precoCusto: 16,
    ncm: '04069099',
    categoryName: 'Dairy',
    isPerishable: true,
  },
  {
    name: 'Coffee 500g',
    description: 'Premium coffee',
    precoVenda: 24.9,
    precoCusto: 12,
    ncm: '09012100',
    categoryName: 'Beverages',
    isPerishable: false,
  },
  {
    name: 'Granola 500g',
    description: 'Granola with dried fruits',
    precoVenda: 18.5,
    precoCusto: 8.5,
    ncm: '19041090',
    categoryName: 'Snacks',
    isPerishable: false,
  },
  {
    name: 'Tomato Sauce 500g',
    description: 'Canned tomato',
    precoVenda: 5.2,
    precoCusto: 2.1,
    ncm: '20029099',
    categoryName: 'Canned',
    isPerishable: false,
  },
  {
    name: 'Bread 400g',
    description: 'Whole wheat bread',
    precoVenda: 8.5,
    precoCusto: 3.5,
    ncm: '19051000',
    categoryName: 'Bakery',
    isPerishable: true,
  },
  {
    name: 'Chocolate 100g',
    description: '70% cocoa',
    precoVenda: 15.9,
    precoCusto: 7.5,
    ncm: '18063000',
    categoryName: 'Sweets',
    isPerishable: false,
  },
  {
    name: 'Frozen Vegetables 1kg',
    description: 'Mixed frozen veggies',
    precoVenda: 14.2,
    precoCusto: 7.1,
    ncm: '07109000',
    categoryName: 'Frozen',
    isPerishable: true,
  },
  {
    name: 'Lettuce 1 unit',
    description: 'Fresh lettuce',
    precoVenda: 4.5,
    precoCusto: 1.8,
    ncm: '07051100',
    categoryName: 'Produce',
    isPerishable: true,
  },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function toDateString(date: Date) {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function columnExists(connection: mysql.Connection, table: string, column: string) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) as cnt
     FROM information_schema.columns
     WHERE table_schema = ? AND table_name = ? AND column_name = ?`,
    [process.env.DATABASE_NAME, table, column]
  );
  const result = rows as Array<{ cnt: number }>;
  return result[0]?.cnt > 0;
}

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3307'),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'estoque_simples',
  });

  try {
    const hasProductsExpiry = await columnExists(connection, 'products', 'expiry_date');
    const hasProductsPerishable = await columnExists(connection, 'products', 'is_perishable');
    const hasBatchesExpiry = await columnExists(connection, 'product_batches', 'expiry_date');

    if (!hasProductsExpiry || !hasProductsPerishable || !hasBatchesExpiry) {
      throw new Error(
        'Missing columns. Run drizzle/0014_add_perishable_and_expiry.sql before seeding.'
      );
    }

    console.log('Seeding demo products and batches...');

    // Categories
    const categoryIds: Record<string, string> = {};
    for (const category of categories) {
      const [existing] = await connection.execute(
        'SELECT id FROM product_categories WHERE slug = ? LIMIT 1',
        [category.slug]
      );
      const rows = existing as Array<{ id: string }>;
      if (rows.length > 0) {
        categoryIds[category.name] = rows[0].id;
        continue;
      }
      const id = uuidv4();
      await connection.execute(
        `INSERT INTO product_categories (id, name, slug, is_active, created_at, updated_at)
         VALUES (?, ?, ?, 1, NOW(), NOW())`,
        [id, category.name, category.slug]
      );
      categoryIds[category.name] = id;
    }

    // Warehouses
    const warehouseIds: string[] = [];
    for (const wh of warehouses) {
      const [existing] = await connection.execute(
        'SELECT id FROM warehouses WHERE code = ? LIMIT 1',
        [wh.code]
      );
      const rows = existing as Array<{ id: string }>;
      if (rows.length > 0) {
        warehouseIds.push(rows[0].id);
        continue;
      }
      const id = uuidv4();
      await connection.execute(
        `INSERT INTO warehouses (id, name, code, description, is_main, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [id, wh.name, wh.code, wh.description, wh.code === 'P-A1' ? 1 : 0]
      );
      warehouseIds.push(id);
    }

    // Build 60 items
    const items: SeedItem[] = [];
    let barcodeBase = 7898123456800;

    for (let i = 0; i < 60; i++) {
      const base = baseItems[i % baseItems.length];
      const variantIndex = Math.floor(i / baseItems.length) + 1;
      const name = `${base.name} v${variantIndex}`;
      const codigoInterno = `DEM-${String(i + 1).padStart(3, '0')}`;
      const barcode = String(barcodeBase + i);
      const qtdAtual = randomInt(10, 200);

      items.push({
        ...base,
        name,
        codigoInterno,
        barcode,
        qtdAtual,
      });
    }

    for (const item of items) {
      const [existing] = await connection.execute(
        'SELECT id FROM products WHERE codigo_interno = ? LIMIT 1',
        [item.codigoInterno]
      );
      const rows = existing as Array<{ id: string }>;
      if (rows.length > 0) {
        continue;
      }

      const productId = uuidv4();
      const batchesToCreate = randomInt(1, 3);
      const today = new Date();
      let totalQty = 0;
      let earliestExpiry: string | null = null;

      // Create product first
      await connection.execute(
        `INSERT INTO products (
          id, codigo_interno, barcode, name, description, preco_venda, preco_custo,
          qtd_entrada_total, qtd_saida_total, qtd_atual, ncm, category_id,
          estoque_baixo_limite, low_stock_threshold, is_perishable, expiry_date,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 5, 1, ?, ?, NOW(), NOW())`,
        [
          productId,
          item.codigoInterno,
          item.barcode,
          item.name,
          item.description,
          item.precoVenda,
          item.precoCusto,
          0,
          0,
          item.ncm,
          categoryIds[item.categoryName] || null,
          item.isPerishable ? 1 : 0,
          null,
        ]
      );

      for (let b = 0; b < batchesToCreate; b++) {
        const batchId = uuidv4();
        const purchaseDate = addDays(today, -randomInt(1, 60));
        let expiryDate: string | null = null;

        if (item.isPerishable) {
          const expiryDelta = randomInt(-10, 90);
          expiryDate = toDateString(addDays(today, expiryDelta));
          if (!earliestExpiry || expiryDate < earliestExpiry) {
            earliestExpiry = expiryDate;
          }
        }

        const qty = Math.max(1, Math.floor(item.qtdAtual / batchesToCreate) + randomInt(-5, 5));
        totalQty += qty;

        await connection.execute(
          `INSERT INTO product_batches (
            id, product_id, purchase_date, expiry_date, cost_price, selling_price,
            quantity_received, quantity_remaining, xml_reference, observation
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Seed', 'seeded batch')`,
          [
            batchId,
            productId,
            toDateString(purchaseDate),
            expiryDate,
            item.precoCusto,
            item.precoVenda,
            qty,
            qty,
          ]
        );

        const warehouseId = warehouseIds[b % warehouseIds.length];
        await connection.execute(
          `INSERT INTO stock_levels (
            id, product_id, warehouse_id, batch_id, quantity, reserved_quantity, updated_at
          ) VALUES (?, ?, ?, ?, ?, 0, NOW())`,
          [uuidv4(), productId, warehouseId, batchId, qty]
        );
      }

      await connection.execute(
        `UPDATE products
         SET qtd_entrada_total = ?, qtd_atual = ?, data_ultima_compra = ?, expiry_date = ?
         WHERE id = ?`,
        [
          totalQty,
          totalQty,
          toDateString(new Date()),
          earliestExpiry,
          productId,
        ]
      );
    }

    console.log('Seed completed.');

    // Expiry report
    const [expiring] = await connection.execute(
      `SELECT
         p.name AS product_name,
         p.codigo_interno AS internal_code,
         pb.expiry_date AS expiry_date,
         DATEDIFF(pb.expiry_date, CURDATE()) AS days_to_expiry,
         w.name AS warehouse_name,
         sl.quantity AS quantity
       FROM product_batches pb
       JOIN products p ON p.id = pb.product_id
       LEFT JOIN stock_levels sl ON sl.batch_id = pb.id
       LEFT JOIN warehouses w ON w.id = sl.warehouse_id
       WHERE pb.expiry_date IS NOT NULL
         AND DATEDIFF(pb.expiry_date, CURDATE()) BETWEEN 0 AND 30
       ORDER BY pb.expiry_date ASC
       LIMIT 50`
    );

    const expiringRows = expiring as Array<Record<string, unknown>>;
    console.log('\nBatches expiring within 30 days:');
    console.table(expiringRows);

    const [expired] = await connection.execute(
      `SELECT
         p.name AS product_name,
         p.codigo_interno AS internal_code,
         pb.expiry_date AS expiry_date,
         DATEDIFF(pb.expiry_date, CURDATE()) AS days_to_expiry,
         w.name AS warehouse_name,
         sl.quantity AS quantity
       FROM product_batches pb
       JOIN products p ON p.id = pb.product_id
       LEFT JOIN stock_levels sl ON sl.batch_id = pb.id
       LEFT JOIN warehouses w ON w.id = sl.warehouse_id
       WHERE pb.expiry_date IS NOT NULL
         AND DATEDIFF(pb.expiry_date, CURDATE()) < 0
       ORDER BY pb.expiry_date ASC
       LIMIT 50`
    );

    const expiredRows = expired as Array<Record<string, unknown>>;
    console.log('\nExpired batches:');
    console.table(expiredRows);
  } finally {
    await connection.end();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error.message || error);
  process.exit(1);
});
