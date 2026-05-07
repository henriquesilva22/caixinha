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

// Interfaces para dados de produtos necessários para estatísticas
interface ProductForDashboardStats {
  currentQuantity: number;
  lowStockThreshold: number;
}

interface MovementApiData {
  id: string;
  type: 'entrada' | 'saida';
  quantity: number;
  unitPrice: string;
  date: string;
  reference: string | null;
  productName: string;
  productCode: string;
}

interface DashboardApiStats {
  totalProducts: number;
  totalStock: number;
}

interface DashboardApiResponse {
  movements: MovementApiData[];
  stats: DashboardApiStats;
}

interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

interface MovementData {
  date: string;
  entradas: number;
  saidas: number;
  total: number;
}


interface TimelineMovement {
  date: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalStock: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
  });
  const [movementData, setMovementData] = useState<MovementData[]>([]);
  const [timelineMovements, setTimelineMovements] = useState<TimelineMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportPeriod, setReportPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeSection, setActiveSection] = useState<'overview' | 'reports'>('overview');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Buscar produtos para estatísticas básicas
      const productsResponse = await fetch('/api/products');
      const products = productsResponse.ok ? (await productsResponse.json() as ProductForDashboardStats[]) : [];

      // Buscar dados do dashboard
      const dashboardResponse = await fetch(`/api/dashboard?startDate=${startDate}&endDate=${endDate}`);
      const dashboardData = dashboardResponse.ok ? (await dashboardResponse.json() as DashboardApiResponse) : { movements: [], stats: {} as DashboardApiStats };

      // Calcular estatísticas
      const totalProducts = products.length;
      const totalStock = products.reduce((sum: number, p: ProductForDashboardStats) => sum + p.currentQuantity, 0);
      const lowStockProducts = products.filter((p: ProductForDashboardStats) => p.currentQuantity > 0 && p.currentQuantity <= (p.lowStockThreshold || 5)).length;
      const outOfStockProducts = products.filter((p: ProductForDashboardStats) => p.currentQuantity === 0).length;

      setStats({
        totalProducts,
        totalStock,
        lowStockProducts,
        outOfStockProducts,
      });

      // Processar dados para gráficos
      processChartData(dashboardData.movements || []);

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const processChartData = (movements: MovementApiData[]) => {
    // Processar dados de movimentos por data
    const dateMap = new Map<string, { entradas: number; saidas: number }>();

    movements.forEach(movement => {
      const date = movement.date;
      if (!dateMap.has(date)) {
        dateMap.set(date, { entradas: 0, saidas: 0 });
      }

      const value = parseFloat(movement.unitPrice) * movement.quantity;
      if (movement.type === 'entrada') {
        dateMap.get(date)!.entradas += value;
      } else if (movement.type === 'saida') {
        dateMap.get(date)!.saidas += value;
      }
    });

    const movementChartData: MovementData[] = Array.from(dateMap.entries())
      .map(([date, values]) => ({
        date: format(new Date(date), 'dd/MM', { locale: ptBR }),
        entradas: values.entradas,
        saidas: values.saidas,
        total: values.entradas + values.saidas
      }))
      .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());

    setMovementData(movementChartData);

    // Processar dados para gráficos de linha e área (relatórios)
    let saldo = 0;
    const timelineData: TimelineMovement[] = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => {
        saldo += values.entradas - values.saidas;
        return {
          date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          entradas: Math.round(values.entradas),
          saidas: Math.round(values.saidas),
          saldo: Math.round(saldo),
        };
      });

    setTimelineMovements(timelineData);
  };

  const totals = timelineMovements.reduce(
    (acc, mov) => ({
      entradas: acc.entradas + mov.entradas,
      saidas: acc.saidas + mov.saidas,
    }),
    { entradas: 0, saidas: 0 }
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
            </div>

            {/* Filtros de Data */}
            <Animated animation="slide-down" delay={400}>
              <Card className="mb-8 bg-level-1">
                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-2">Data Inicial</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 border border-input rounded-lg bg-background text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-card-foreground mb-2">Data Final</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2 border border-input rounded-lg bg-background text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={fetchDashboardData} className="w-full">
                        Atualizar Dados
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Animated>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
              {/* Gráfico de Barras */}
              <Animated animation="scale" delay={500}>
                <Card className="bg-level-1">
                  <Card.Header>
                    <h2 className="text-xl font-bold text-card-foreground">Entradas vs Saídas</h2>
                  </Card.Header>
                  <Card.Body>
                    {movementData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={movementData}>
                          <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                          <XAxis dataKey="date" className="dark:fill-gray-400" />
                          <YAxis className="dark:fill-gray-400" />
                          <Tooltip 
                            formatter={(value: number | undefined) => [`R$ ${(value || 0).toFixed(2)}`, '']} 
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                          />
                          <Legend />
                          <Bar dataKey="entradas" fill="#82ca9d" name="Entradas" />
                          <Bar dataKey="saidas" fill="#8884d8" name="Saídas" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400">
                        Nenhum movimento encontrado
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

        {/* Seção: Relatórios Avançados */}
        {activeSection === 'reports' && (
          <>
            {/* Filtros de Período */}
            <Animated animation="slide-down" delay={100}>
              <Card className="mb-6 bg-level-1">
                <Card.Body>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Período:</span>
                    <div className="flex gap-2">
                      <Button
                        variant={reportPeriod === '7d' ? 'primary' : 'secondary'}
                        onClick={() => setReportPeriod('7d')}
                        size="sm"
                      >
                        7 Dias
                      </Button>
                      <Button
                        variant={reportPeriod === '30d' ? 'primary' : 'secondary'}
                        onClick={() => setReportPeriod('30d')}
                        size="sm"
                      >
                        30 Dias
                      </Button>
                      <Button
                        variant={reportPeriod === '90d' ? 'primary' : 'secondary'}
                        onClick={() => setReportPeriod('90d')}
                        size="sm"
                      >
                        90 Dias
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Animated>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Animated animation="slide-up" delay={0}>
                <Card>
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total de Entradas</p>
                        <p className="text-2xl font-bold text-success">{totals.entradas}</p>
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
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total de Saídas</p>
                        <p className="text-2xl font-bold text-error">{totals.saidas}</p>
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
                        <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Líquido</p>
                        <p className={`text-2xl font-bold ${totals.entradas - totals.saidas >= 0 ? 'text-success' : 'text-error'}`}>
                          {totals.entradas - totals.saidas}
                        </p>
                      </div>
                      <div className="p-3 bg-info/10 rounded-lg">
                        <DocumentReportIcon className="w-8 h-8 text-info" aria-hidden={true} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Animated>
            </div>

            {/* Gráfico de Linha - Movimentações ao Longo do Tempo */}
            <Animated animation="scale" delay={300}>
              <Card className="mb-8 bg-level-1">
                <Card.Header>
                  <h2 className="text-xl font-bold text-card-foreground">Movimentações ao Longo do Tempo</h2>
                </Card.Header>
                <Card.Body>
                  {timelineMovements.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={timelineMovements}>
                        <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                        <XAxis dataKey="date" className="dark:fill-gray-400" />
                        <YAxis className="dark:fill-gray-400" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} 
                        />
                        <Legend />
                        <Line type="monotone" dataKey="entradas" stroke="#10b981" name="Entradas" strokeWidth={2} />
                        <Line type="monotone" dataKey="saidas" stroke="#ef4444" name="Saídas" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400">
                      Nenhum dado disponível
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Animated>

            {/* Gráfico de Área - Saldo Acumulado */}
            <Animated animation="scale" delay={400}>
              <Card>
                <Card.Header>
                  <h2 className="text-xl font-bold text-card-foreground">Saldo Acumulado</h2>
                </Card.Header>
                <Card.Body>
                  {timelineMovements.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={timelineMovements}>
                        <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                        <XAxis dataKey="date" className="dark:fill-gray-400" />
                        <YAxis className="dark:fill-gray-400" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} 
                        />
                        <Legend />
                        <Area type="monotone" dataKey="saldo" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Saldo" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400">
                      Nenhum dado disponível
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
