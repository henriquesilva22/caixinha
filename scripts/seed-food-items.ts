import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2/promise';

// Load environment variables
config({ path: '.env' });

const foodItems = [
  {
    name: 'Arroz Integral 5kg',
    codigoInterno: 'ARR-001',
    barcode: '7898123456781',
    description: 'Arroz integral de qualidade premium',
    precoVenda: 28.50,
    precoCusto: 15.00,
    qtdAtual: 50,
    ncm: '10061010',
    categoryName: 'Grãos e Cereais',
  },
  {
    name: 'Feijão Preto 1kg',
    codigoInterno: 'FEI-001',
    barcode: '7898123456782',
    description: 'Feijão preto selecionado',
    precoVenda: 8.90,
    precoCusto: 4.50,
    qtdAtual: 100,
    ncm: '07133190',
    categoryName: 'Grãos e Cereais',
  },
  {
    name: 'Macarrão Integral 500g',
    codigoInterno: 'MAC-001',
    barcode: '7898123456783',
    description: 'Macarrão integral 100% natural',
    precoVenda: 6.50,
    precoCusto: 2.80,
    qtdAtual: 150,
    ncm: '19021100',
    categoryName: 'Massas e Cereais',
  },
  {
    name: 'Óleo de Soja 900ml',
    codigoInterno: 'OLE-001',
    barcode: '7898123456784',
    description: 'Óleo de soja refinado',
    precoVenda: 7.20,
    precoCusto: 3.50,
    qtdAtual: 80,
    ncm: '15071090',
    categoryName: 'Óleos e Condimentos',
  },
  {
    name: 'Sal Refinado 1kg',
    codigoInterno: 'SAL-001',
    barcode: '7898123456785',
    description: 'Sal refinado iodado',
    precoVenda: 3.50,
    precoCusto: 1.20,
    qtdAtual: 200,
    ncm: '25010091',
    categoryName: 'Óleos e Condimentos',
  },
  {
    name: 'Açúcar Cristal 1kg',
    codigoInterno: 'AÇU-001',
    barcode: '7898123456786',
    description: 'Açúcar cristal premium',
    precoVenda: 5.80,
    precoCusto: 2.90,
    qtdAtual: 120,
    ncm: '17019090',
    categoryName: 'Açúcares e Doces',
  },
  {
    name: 'Café Premium 500g',
    codigoInterno: 'CAF-001',
    barcode: '7898123456787',
    description: 'Café torrado e moído premium',
    precoVenda: 24.90,
    precoCusto: 12.00,
    qtdAtual: 60,
    ncm: '09012100',
    categoryName: 'Bebidas',
  },
  {
    name: 'Leite em Pó 400g',
    codigoInterno: 'LEI-001',
    barcode: '7898123456788',
    description: 'Leite em pó integral',
    precoVenda: 12.50,
    precoCusto: 6.00,
    qtdAtual: 90,
    ncm: '04022110',
    categoryName: 'Laticínios',
  },
  {
    name: 'Queijo Meia Cura 500g',
    codigoInterno: 'QUE-001',
    barcode: '7898123456789',
    description: 'Queijo meia cura de qualidade',
    precoVenda: 32.00,
    precoCusto: 16.00,
    qtdAtual: 40,
    ncm: '04069099',
    categoryName: 'Laticínios',
  },
  {
    name: 'Pão Integral 400g',
    codigoInterno: 'PÃO-001',
    barcode: '7898123456790',
    description: 'Pão integral fresco',
    precoVenda: 8.50,
    precoCusto: 3.50,
    qtdAtual: 30,
    ncm: '19051000',
    categoryName: 'Panificados',
  },
  {
    name: 'Tomate Industrializado 500g',
    codigoInterno: 'TOM-001',
    barcode: '7898123456791',
    description: 'Tomate pelado e prensado',
    precoVenda: 5.20,
    precoCusto: 2.10,
    qtdAtual: 110,
    ncm: '20029099',
    categoryName: 'Enlatados',
  },
  {
    name: 'Conserva de Azeitona 250g',
    codigoInterno: 'AZE-001',
    barcode: '7898123456792',
    description: 'Azeitona verde em conserva',
    precoVenda: 12.80,
    precoCusto: 6.00,
    qtdAtual: 70,
    ncm: '20019099',
    categoryName: 'Enlatados',
  },
  {
    name: 'Mel Puro 500g',
    codigoInterno: 'MEL-001',
    barcode: '7898123456793',
    description: 'Mel puro de abelha',
    precoVenda: 28.00,
    precoCusto: 14.00,
    qtdAtual: 50,
    ncm: '04090000',
    categoryName: 'Açúcares e Doces',
  },
  {
    name: 'Chocolate 70% Cacau 100g',
    codigoInterno: 'CHO-001',
    barcode: '7898123456794',
    description: 'Chocolate com 70% de cacau',
    precoVenda: 15.90,
    precoCusto: 7.50,
    qtdAtual: 85,
    ncm: '18063000',
    categoryName: 'Doces e Chocolates',
  },
  {
    name: 'Biscoito Integral 200g',
    codigoInterno: 'BIS-001',
    barcode: '7898123456795',
    description: 'Biscoito integral saudável',
    precoVenda: 6.90,
    precoCusto: 2.80,
    qtdAtual: 140,
    ncm: '19052090',
    categoryName: 'Biscoitos e Bolachas',
  },
  {
    name: 'Farinha de Trigo 1kg',
    codigoInterno: 'FAR-001',
    barcode: '7898123456796',
    description: 'Farinha de trigo tipo 1',
    precoVenda: 4.50,
    precoCusto: 1.80,
    qtdAtual: 160,
    ncm: '11010100',
    categoryName: 'Farinhas e Pós',
  },
  {
    name: 'Geléia de Morango 250g',
    codigoInterno: 'GEL-001',
    barcode: '7898123456797',
    description: 'Geléia de morango natural',
    precoVenda: 9.50,
    precoCusto: 4.20,
    qtdAtual: 95,
    ncm: '20079100',
    categoryName: 'Açúcares e Doces',
  },
  {
    name: 'Achocolatado 400g',
    codigoInterno: 'ACH-001',
    barcode: '7898123456798',
    description: 'Pó para achocolatado premium',
    precoVenda: 11.20,
    precoCusto: 5.00,
    qtdAtual: 105,
    ncm: '19019000',
    categoryName: 'Bebidas',
  },
  {
    name: 'Granola 500g',
    codigoInterno: 'GRA-001',
    barcode: '7898123456799',
    description: 'Granola com frutas secas',
    precoVenda: 18.50,
    precoCusto: 8.50,
    qtdAtual: 75,
    ncm: '19041090',
    categoryName: 'Cereais',
  },
];

const shelves = [
  { name: 'Prateleira A1', code: 'P-A1', description: 'Prateleira superior linha A' },
  { name: 'Prateleira A2', code: 'P-A2', description: 'Prateleira média linha A' },
  { name: 'Prateleira A3', code: 'P-A3', description: 'Prateleira inferior linha A' },
  { name: 'Prateleira B1', code: 'P-B1', description: 'Prateleira superior linha B' },
  { name: 'Prateleira B2', code: 'P-B2', description: 'Prateleira média linha B' },
  { name: 'Prateleira B3', code: 'P-B3', description: 'Prateleira inferior linha B' },
  { name: 'Freezer 1', code: 'F-1', description: 'Congelador 1' },
  { name: 'Freezer 2', code: 'F-2', description: 'Congelador 2' },
];

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3307'),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'estoque_simples',
  });

  try {
    console.log('🌱 Iniciando seed de dados de comida...\n');

    // Create product categories
    console.log('📁 Criando categorias de produtos...');
    const categories: Record<string, string> = {};
    const categoryNames = new Set(foodItems.map(item => item.categoryName));

    for (const categoryName of categoryNames) {
      const categoryId = uuidv4();
      const slug = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[çã]/g, (m) => m === 'ç' ? 'c' : 'a');
      
      await connection.execute(
        `INSERT INTO product_categories (id, name, slug, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, 1, NOW(), NOW())`,
        [categoryId, categoryName, slug]
      );
      
      categories[categoryName] = categoryId;
      console.log(`  ✓ Categoria: ${categoryName}`);
    }

    // Create warehouses (shelves)
    console.log('\n🏗️  Criando prateleiras de estoque...');
    const shelfIds: string[] = [];
    
    for (const shelf of shelves) {
      const shelfId = uuidv4();
      await connection.execute(
        `INSERT INTO warehouses (id, name, code, description, is_main, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [shelfId, shelf.name, shelf.code, shelf.description, shelf.code === 'P-A1' ? 1 : 0]
      );
      
      shelfIds.push(shelfId);
      console.log(`  ✓ Prateleira: ${shelf.name} (${shelf.code})`);
    }

    // Create products and allocate to shelves
    console.log('\n🛒 Criando produtos de comida e alocando nas prateleiras...');
    let productIndex = 0;

    for (const item of foodItems) {
      const productId = uuidv4();
      
      await connection.execute(
        `INSERT INTO products (
          id, codigo_interno, barcode, name, description, preco_venda, preco_custo, 
          qtd_entrada_total, qtd_saida_total, qtd_atual, ncm, category_id,
          estoque_baixo_limite, low_stock_threshold, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 5, 1, NOW(), NOW())`,
        [
          productId,
          item.codigoInterno,
          item.barcode,
          item.name,
          item.description,
          item.precoVenda,
          item.precoCusto,
          item.qtdAtual,
          item.qtdAtual,
          item.ncm,
          categories[item.categoryName],
        ]
      );

      // Allocate product to 2-3 random shelves
      const shelvesToAllocate = Math.floor(Math.random() * 2) + 2;
      const selectedShelves: number[] = [];
      
      for (let i = 0; i < shelvesToAllocate; i++) {
        const randomShelfIndex = Math.floor(Math.random() * shelfIds.length);
        if (!selectedShelves.includes(randomShelfIndex)) {
          selectedShelves.push(randomShelfIndex);
        }
      }

      for (const shelfIndex of selectedShelves) {
        const stockLevelId = uuidv4();
        const allocatedQuantity = Math.floor(item.qtdAtual / selectedShelves.length);
        
        await connection.execute(
          `INSERT INTO stock_levels (id, product_id, warehouse_id, quantity, reserved_quantity, updated_at)
           VALUES (?, ?, ?, ?, 0, NOW())`,
          [stockLevelId, productId, shelfIds[shelfIndex], allocatedQuantity]
        );
      }

      productIndex++;
      console.log(`  ✓ ${productIndex}. ${item.name} - ${item.qtdAtual} unidades`);
    }

    console.log(`\n✅ Seed completado com sucesso!`);
    console.log(`📊 Resumo:`);
    console.log(`   - ${Object.keys(categories).length} categorias criadas`);
    console.log(`   - ${shelves.length} prateleiras criadas`);
    console.log(`   - ${foodItems.length} produtos criados`);
    console.log(`   - Total de ${foodItems.reduce((sum, item) => sum + item.qtdAtual, 0)} unidades alocadas`);

  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed();
