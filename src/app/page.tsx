'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  BarChart, Bar, 
  LineChart, Line, 
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingState } from '@/components/Loading';
import { Animated } from '@/components/Animated';
import { 
  DocumentReportIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  ChartBarIcon,
  PackageIcon 
} from '@/components/Icons';

const FOOD_KEYWORDS = [
  'arroz',
  'feij',
  'macarr',
  'óleo',
  'oleo',
  'sal',
  'açúcar',
  'acucar',
  'café',
  'leite',
  'queijo',
  'pão',
  'pao',
  'tomate',
  'azeitona',
  'mel',
  'chocolate',
  'bisco',
  'farinh',
  'granola',
  'cereal',
  'grão',
  'grao',
  'latic',
  'panific',
  'conserv',
  'enlat',
  'doce',
  'bebid',
  'massa',
  'hortifruti',
  'legume',
  'verdura',
  'fruta',
];

const isFoodProduct = (product: ProductForDashboardStats) => {
  const haystack = `${product.name} ${product.categoryName || ''}`.toLowerCase();
  return FOOD_KEYWORDS.some((keyword) => haystack.includes(keyword));
};

// Interfaces para dados de produtos necessários para estatísticas
interface ProductForDashboardStats {
  name: string;
  currentQuantity: number;
  lowStockThreshold: number;
  categoryName?: string | null;
  batches: Array<{
    expiryDate?: string | null;
    quantityRemaining: number;
  }>;
}

interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  foodProducts: number;
  foodLowStockProducts: number;
  foodStock: number;
  expiringSoon: number;
  expired: number;
}

interface FoodStockData {
  label: string;
  quantity: number;
  minimum: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalStock: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    foodProducts: 0,
    foodLowStockProducts: 0,
    foodStock: 0,
    expiringSoon: 0,
    expired: 0,
  });
  const [foodStockData, setFoodStockData] = useState<FoodStockData[]>([]);
  const [foodLowStockData, setFoodLowStockData] = useState<FoodStockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'reports'>('overview');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const productsResponse = await fetch('/api/products');
      const products = productsResponse.ok ? (await productsResponse.json() as ProductForDashboardStats[]) : [];

      const totalProducts = products.length;
      const totalStock = products.reduce((sum: number, p: ProductForDashboardStats) => sum + p.currentQuantity, 0);
      const lowStockProducts = products.filter((p: ProductForDashboardStats) => p.currentQuantity > 0 && p.currentQuantity <= (p.lowStockThreshold || 5)).length;
      const outOfStockProducts = products.filter((p: ProductForDashboardStats) => p.currentQuantity === 0).length;
      const foodProducts = products.filter(isFoodProduct);
      const foodStock = foodProducts.reduce((sum: number, p: ProductForDashboardStats) => sum + p.currentQuantity, 0);
      const foodLowStockProducts = foodProducts.filter((p: ProductForDashboardStats) => p.currentQuantity > 0 && p.currentQuantity <= (p.lowStockThreshold || 5)).length;
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const expiringSoon = products.filter((product) =>
        product.batches.some((batch) => {
          if (!batch.expiryDate || batch.quantityRemaining <= 0) return false;
          const expiry = new Date(batch.expiryDate);
          if (Number.isNaN(expiry.getTime())) return false;
          const diffDays = Math.ceil((expiry.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 20;
        })
      ).length;
      const expired = products.filter((product) =>
        product.batches.some((batch) => {
          if (!batch.expiryDate || batch.quantityRemaining <= 0) return false;
          const expiry = new Date(batch.expiryDate);
          if (Number.isNaN(expiry.getTime())) return false;
          return expiry.getTime() < startOfToday.getTime();
        })
      ).length;

      const topFoodProducts = [...foodProducts]
        .sort((a, b) => b.currentQuantity - a.currentQuantity)
        .slice(0, 10);

      const lowFoodProducts = [...foodProducts]
        .filter((p) => p.currentQuantity <= (p.lowStockThreshold || 5))
        .sort((a, b) => a.currentQuantity - b.currentQuantity)
        .slice(0, 10);

      setStats({
        totalProducts,
        totalStock,
        lowStockProducts,
        outOfStockProducts,
        foodProducts: foodProducts.length,
        foodLowStockProducts,
        foodStock,
        expiringSoon,
        expired,
      });

      setFoodStockData(topFoodProducts.map((product) => ({
        label: product.name,
        quantity: product.currentQuantity,
        minimum: product.lowStockThreshold || 5,
      })));

      setFoodLowStockData((lowFoodProducts.length > 0 ? lowFoodProducts : topFoodProducts).map((product) => ({
        label: product.name,
        quantity: product.currentQuantity,
        minimum: product.lowStockThreshold || 5,
      })));

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const foodTotals = foodStockData.reduce(
    (acc, item) => ({
      quantity: acc.quantity + item.quantity,
      minimum: acc.minimum + item.minimum,
    }),
    { quantity: 0, minimum: 0 }
  );

  if (loading) {
    return (
      <LoadingState message="Carregando dashboard..." />
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-background transition-colors">
        {/* Cabeçalho */}
        <Animated animation="fade-in">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do seu estoque e análises detalhadas</p>
          </div>
        </Animated>

        {/* Navegação entre seções */}
        <Animated animation="slide-down" delay={100}>
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveSection('overview')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 ${
                activeSection === 'overview'
                  ? 'bg-gradient-to-r from-blue-400 to-purple-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <ChartBarIcon className="w-5 h-5" />
              Visão Geral
            </button>
            <button
              onClick={() => setActiveSection('reports')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 ${
                activeSection === 'reports'
                  ? 'bg-gradient-to-r from-blue-400 to-purple-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <DocumentReportIcon className="w-5 h-5" />
              Relatórios Avançados
            </button>
          </div>
        </Animated>

        {/* Seção: Visão Geral */}
        {activeSection === 'overview' && (
          <>
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Animated animation="slide-up" delay={0}>
                <Card className="bg-gradient-to-br from-blue-400 to-blue-500 border-none shadow-xl hover:shadow-2xl transition-all">
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-50 mb-1">Estoque Total</p>
                        <p className="text-4xl font-bold text-white">{stats.totalStock}</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <PackageIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Animated>

              <Animated animation="slide-up" delay={100}>
                <Card className="bg-gradient-to-br from-orange-400 to-orange-500 border-none shadow-xl hover:shadow-2xl transition-all">
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-50 mb-1">Baixo Estoque</p>
                        <p className="text-4xl font-bold text-white">{stats.lowStockProducts}</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <TrendingDownIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Animated>

              <Animated animation="slide-up" delay={200}>
                <Card className="bg-gradient-to-br from-red-400 to-red-500 border-none shadow-xl hover:shadow-2xl transition-all">
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-50 mb-1">Esgotados</p>
                        <p className="text-4xl font-bold text-white">{stats.outOfStockProducts}</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <TrendingDownIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Animated>
              <Animated animation="slide-up" delay={300}>
                <Card className="bg-gradient-to-br from-amber-400 to-amber-500 border-none shadow-xl hover:shadow-2xl transition-all">
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-amber-50 mb-1">Vencendo (20 dias)</p>
                        <p className="text-4xl font-bold text-white">{stats.expiringSoon}</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <DocumentReportIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Animated>
              <Animated animation="slide-up" delay={400}>
                <Card className="bg-gradient-to-br from-rose-500 to-rose-600 border-none shadow-xl hover:shadow-2xl transition-all">
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-rose-50 mb-1">Vencidos</p>
                        <p className="text-4xl font-bold text-white">{stats.expired}</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <TrendingDownIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Animated>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
              {/* Gráfico de Barras */}
              <Animated animation="scale" delay={400}>
                <Card className="bg-level-1">
                  <Card.Header>
                    <h2 className="text-xl font-bold text-card-foreground">Alimentos em estoque</h2>
                  </Card.Header>
                  <Card.Body>
                    {foodStockData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={foodStockData}>
                          <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                          <XAxis dataKey="label" className="dark:fill-gray-400" angle={-20} textAnchor="end" height={80} interval={0} />
                          <YAxis className="dark:fill-gray-400" />
                          <Tooltip 
                            formatter={(value: number | undefined, name: string) => [
                              `${value || 0} unidades`,
                              name === 'quantity' ? 'Quantidade em estoque' : 'Limite mínimo',
                            ]} 
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                          />
                          <Legend />
                          <Bar dataKey="quantity" fill="#22c55e" name="Quantidade" />
                          <Bar dataKey="minimum" fill="#f59e0b" name="Limite mínimo" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400">
                        Nenhum alimento encontrado no estoque
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Animated>
            </div>

            {/* Ações Rápidas */}
            <Animated animation="slide-up" delay={700}>
              <Card className="bg-level-1">
                <Card.Header>
                  <h2 className="text-xl font-bold text-card-foreground">Ações Rápidas</h2>
                </Card.Header>
                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/estoque">
                      <button className="w-full px-6 py-3 text-white font-semibold rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95">
                        📦 Gerenciar Estoque
                      </button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Animated>
          </>
        )}

        {/* Seção: Relatórios de Alimentos */}
        {activeSection === 'reports' && (
          <>
            <Animated animation="slide-down" delay={100}>
              <Card className="mb-6 bg-level-1">
                <Card.Body>
                  <p className="text-sm text-muted-foreground">
                    Visão consolidada dos alimentos em estoque, com destaque para os itens com limite mínimo.
                  </p>
                </Card.Body>
              </Card>
            </Animated>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <Animated animation="slide-up" delay={0}>
                <Card>
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Alimentos cadastrados</p>
                        <p className="text-2xl font-bold text-success">{stats.foodProducts}</p>
                      </div>
                      <div className="p-3 bg-success/10 rounded-lg">
                        <TrendingUpIcon className="w-8 h-8 text-success" aria-hidden={true} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Animated>

              <Animated animation="slide-up" delay={100}>
                <Card>
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Alimentos em estoque</p>
                        <p className="text-2xl font-bold text-error">{stats.foodStock}</p>
                      </div>
                      <div className="p-3 bg-error/10 rounded-lg">
                        <TrendingDownIcon className="w-8 h-8 text-error" aria-hidden={true} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Animated>

              <Animated animation="slide-up" delay={200}>
                <Card>
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Baixo estoque</p>
                        <p className="text-2xl font-bold text-info">
                          {stats.foodLowStockProducts}
                        </p>
                      </div>
                      <div className="p-3 bg-info/10 rounded-lg">
                        <DocumentReportIcon className="w-8 h-8 text-info" aria-hidden={true} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Animated>
              <Animated animation="slide-up" delay={300}>
                <Card>
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Vencendo (20 dias)</p>
                        <p className="text-2xl font-bold text-warning">
                          {stats.expiringSoon}
                        </p>
                      </div>
                      <div className="p-3 bg-warning/10 rounded-lg">
                        <DocumentReportIcon className="w-8 h-8 text-warning" aria-hidden={true} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Animated>
              <Animated animation="slide-up" delay={400}>
                <Card>
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Vencidos</p>
                        <p className="text-2xl font-bold text-error">
                          {stats.expired}
                        </p>
                      </div>
                      <div className="p-3 bg-error/10 rounded-lg">
                        <TrendingDownIcon className="w-8 h-8 text-error" aria-hidden={true} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Animated>
            </div>

            {/* Gráfico de Linha - Comparativo de estoque */}
            <Animated animation="scale" delay={300}>
              <Card className="mb-8 bg-level-1">
                <Card.Header>
                  <h2 className="text-xl font-bold text-card-foreground">Quantidade atual vs limite mínimo</h2>
                </Card.Header>
                <Card.Body>
                  {foodLowStockData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={foodLowStockData}>
                        <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                        <XAxis dataKey="label" className="dark:fill-gray-400" angle={-20} textAnchor="end" height={80} interval={0} />
                        <YAxis className="dark:fill-gray-400" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} 
                        />
                        <Legend />
                        <Line type="monotone" dataKey="quantity" stroke="#10b981" name="Quantidade" strokeWidth={2} />
                        <Line type="monotone" dataKey="minimum" stroke="#f59e0b" name="Limite mínimo" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400">
                      Nenhum alimento encontrado no estoque
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Animated>

            {/* Gráfico de Área - Estoque dos alimentos */}
            <Animated animation="scale" delay={400}>
              <Card>
                <Card.Header>
                  <h2 className="text-xl font-bold text-card-foreground">Estoque consolidado dos alimentos</h2>
                </Card.Header>
                <Card.Body>
                  {foodStockData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={foodStockData}>
                        <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                        <XAxis dataKey="label" className="dark:fill-gray-400" angle={-20} textAnchor="end" height={80} interval={0} />
                        <YAxis className="dark:fill-gray-400" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} 
                        />
                        <Legend />
                        <Area type="monotone" dataKey="quantity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Quantidade" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400">
                      Nenhum alimento encontrado no estoque
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Animated>
          </>
        )}
      </main>
  );
}
