import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

import {
  Zap,
  Clock,
  BarChart3,
  Activity,
  Download,
  RotateCcw,
  DollarSign,
  FlaskConical,
  Server,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSimContext } from '@/context/SimulationContext';
import { runSimulation, type SimConfig } from '@/lib/simulation';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ============================================================
// TYPES
// ============================================================

type MetricKey =
  | 'energy'
  | 'time'
  | 'utilization'
  | 'efficiency'
  | 'cost';

type BenchmarkMetrics = {
  energy: number;
  time: number;
  utilization: number;
  efficiency: number;
  cost: number;
};

type BenchmarkRun = {
  qiea: BenchmarkMetrics;
  traditional: BenchmarkMetrics;
};

type VMSensitivityRow = {
  vms: number;
  traditional: BenchmarkMetrics;
  qiea: BenchmarkMetrics;
};

type ChangeType = 'relative' | 'points';

// ============================================================
// VM SENSITIVITY EXPERIMENT
// ============================================================

const VM_SENSITIVITY_COUNTS = [5, 10, 15, 20] as const;

// ============================================================
// HELPERS
// ============================================================

function calculateStats(values: number[]) {
  if (values.length === 0) {
    return {
      average: 0,
      minimum: 0,
      maximum: 0,
      stdDev: 0,
    };
  }

  const average =
    values.reduce((sum, value) => sum + value, 0) / values.length;

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);

  const variance =
    values.reduce(
      (sum, value) => sum + Math.pow(value - average, 2),
      0,
    ) / values.length;

  const stdDev = Math.sqrt(variance);

  return {
    average,
    minimum,
    maximum,
    stdDev,
  };
}

function formatRelativeImpact(value: number) {
  if (value >= 0) {
    return `${value.toFixed(1)}% reduction`;
  }

  return `${Math.abs(value).toFixed(1)}% increase`;
}

function formatPointChange(value: number) {
  if (value > 0) {
    return `+${value.toFixed(1)} percentage points`;
  }

  if (value < 0) {
    return `${value.toFixed(1)} percentage points`;
  }

  return '0.0 percentage points';
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ResultsPage() {
  const nav = useNavigate();

  const {
    parsedData,
    config,
    results,
  } = useSimContext();

  const [vmSensitivityData, setVmSensitivityData] =
    useState<VMSensitivityRow[]>([]);

  const [vmSensitivityLoading, setVmSensitivityLoading] =
    useState(false);

  const [vmSensitivityError, setVmSensitivityError] =
    useState<string | null>(null);

  const [vmSensitivityProgress, setVmSensitivityProgress] =
    useState('');

  // ----------------------------------------------------------
  // DYNAMIC VM SENSITIVITY EXPERIMENT
  // ----------------------------------------------------------

  useEffect(() => {
    if (!parsedData) {
      setVmSensitivityData([]);
      setVmSensitivityLoading(false);
      setVmSensitivityError(null);
      setVmSensitivityProgress('');
      return;
    }

    let cancelled = false;

    const runVMSensitivityExperiment = async () => {
      const rows: VMSensitivityRow[] = [];

      setVmSensitivityLoading(true);
      setVmSensitivityError(null);
      setVmSensitivityData([]);
      setVmSensitivityProgress(
        'Preparing controlled VM sensitivity experiment...',
      );

      try {
        for (
          let index = 0;
          index < VM_SENSITIVITY_COUNTS.length;
          index++
        ) {
          if (cancelled) {
            return;
          }

          const vmCount = VM_SENSITIVITY_COUNTS[index];

          setVmSensitivityProgress(
            `Running ${vmCount} VMs (${index + 1} of ${VM_SENSITIVITY_COUNTS.length})...`,
          );

          const sensitivityConfig: SimConfig = {
            ...config,
            numVMs: vmCount,
            vmMIPS: 1000,
          };

          const sensitivityResult = await runSimulation(
            parsedData,
            sensitivityConfig,
            () => {},
          );

          rows.push({
            vms: vmCount,
            traditional: sensitivityResult.traditional,
            qiea: sensitivityResult.qiea,
          });

          if (!cancelled) {
            setVmSensitivityData([...rows]);
          }
        }

        if (!cancelled) {
          setVmSensitivityProgress(
            'VM sensitivity experiment completed.',
          );
        }
      } catch (error: unknown) {
        if (!cancelled) {
          console.error(
            'VM sensitivity experiment failed:',
            error,
          );

          setVmSensitivityError(
            'Unable to complete the VM sensitivity experiment.',
          );
        }
      } finally {
        if (!cancelled) {
          setVmSensitivityLoading(false);
        }
      }
    };

    void runVMSensitivityExperiment();

    return () => {
      cancelled = true;
    };
  }, [parsedData, config]);

  // ----------------------------------------------------------
  // BENCHMARK RUNS
  // ----------------------------------------------------------

  const benchmarkRuns = useMemo<BenchmarkRun[]>(() => {
    try {
      const stored = sessionStorage.getItem(
        'quantum_benchmark_runs',
      );

      if (!stored) {
        return [];
      }

      const parsed: unknown = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed as BenchmarkRun[];
    } catch {
      return [];
    }
  }, []);

  const benchmarkCount = benchmarkRuns.length;

  // ----------------------------------------------------------
  // NO RESULTS
  // ----------------------------------------------------------

  if (!results) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            No results available. Run a simulation first.
          </p>

          <Button onClick={() => nav('/upload')}>
            Upload File
          </Button>
        </div>
      </div>
    );
  }

  const {
    traditional: trad,
    qiea,
    improvements: imp,
    fitnessHistory,
  } = results;

  // ----------------------------------------------------------
  // BENCHMARK STATS
  // ----------------------------------------------------------

  const benchmarkStats = {
    energy: calculateStats(
      benchmarkRuns.map((run) => run.qiea.energy),
    ),

    time: calculateStats(
      benchmarkRuns.map((run) => run.qiea.time),
    ),

    utilization: calculateStats(
      benchmarkRuns.map((run) => run.qiea.utilization),
    ),

    efficiency: calculateStats(
      benchmarkRuns.map((run) => run.qiea.efficiency),
    ),

    cost: calculateStats(
      benchmarkRuns.map((run) => run.qiea.cost),
    ),
  };

  // ----------------------------------------------------------
  // METRIC CARDS
  // ----------------------------------------------------------

  const metricCards = [
    {
      icon: Zap,
      label: 'Energy Impact',
      value: formatRelativeImpact(imp.energy),
    },

    {
      icon: Clock,
      label: 'Execution Time Impact',
      value: formatRelativeImpact(imp.time),
    },

    {
      icon: BarChart3,
      label: 'QIEA Utilization',
      value: `${qiea.utilization.toFixed(1)}%`,
    },

    {
      icon: Activity,
      label: 'Scheduling Efficiency',
      value: `${qiea.efficiency.toFixed(1)}%`,
    },

    {
      icon: DollarSign,
      label: 'Cost Impact',
      value: formatRelativeImpact(imp.cost),
    },
  ];

  // ----------------------------------------------------------
  // CURRENT SIMULATION CHART DATA
  // ----------------------------------------------------------

  const energyData = [
    {
      name: 'Traditional',
      traditional: Number(trad.energy.toFixed(2)),
      qiea: 0,
    },
    {
      name: 'QIEA',
      traditional: 0,
      qiea: Number(qiea.energy.toFixed(2)),
    },
  ];

  const timeData = [
    {
      name: 'Traditional',
      traditional: Number(trad.time.toFixed(2)),
      qiea: 0,
    },
    {
      name: 'QIEA',
      traditional: 0,
      qiea: Number(qiea.time.toFixed(2)),
    },
  ];

  const utilData = [
    {
      name: 'Traditional',
      traditional: Number(trad.utilization.toFixed(1)),
      qiea: 0,
    },
    {
      name: 'QIEA',
      traditional: 0,
      qiea: Number(qiea.utilization.toFixed(1)),
    },
  ];

  const efficiencyData = [
    {
      name: 'Traditional',
      traditional: Number(trad.efficiency.toFixed(1)),
      qiea: 0,
    },
    {
      name: 'QIEA',
      traditional: 0,
      qiea: Number(qiea.efficiency.toFixed(1)),
    },
  ];

  const costData = [
    {
      name: 'Traditional',
      traditional: Number(trad.cost.toFixed(2)),
      qiea: 0,
    },
    {
      name: 'QIEA',
      traditional: 0,
      qiea: Number(qiea.cost.toFixed(2)),
    },
  ];

  // ----------------------------------------------------------
  // FITNESS DATA
  // ----------------------------------------------------------

  const fitnessData = fitnessHistory.map(
    (fitness, index) => ({
      gen: index + 1,
      fitness: Number(fitness.toFixed(6)),
    }),
  );

  // ----------------------------------------------------------
  // VM SENSITIVITY CHART DATA
  // ----------------------------------------------------------

  const vmEnergyChart = vmSensitivityData.map((row) => ({
    vms: `${row.vms} VMs`,
    Traditional: Number(row.traditional.energy.toFixed(2)),
    QIEA: Number(row.qiea.energy.toFixed(2)),
  }));

  const vmTimeChart = vmSensitivityData.map((row) => ({
    vms: `${row.vms} VMs`,
    Traditional: Number(row.traditional.time.toFixed(2)),
    QIEA: Number(row.qiea.time.toFixed(2)),
  }));

  const vmUtilizationChart = vmSensitivityData.map((row) => ({
    vms: `${row.vms} VMs`,
    Traditional: Number(
      row.traditional.utilization.toFixed(2),
    ),
    QIEA: Number(row.qiea.utilization.toFixed(2)),
  }));

  const vmCostChart = vmSensitivityData.map((row) => ({
    vms: `${row.vms} VMs`,
    Traditional: Number(row.traditional.cost.toFixed(2)),
    QIEA: Number(row.qiea.cost.toFixed(2)),
  }));

  // ----------------------------------------------------------
  // COMPARISON TABLE
  // ----------------------------------------------------------

  const comparisonRows = [
    {
      metric: 'Energy Consumption',
      unit: 'W',
      trad: trad.energy,
      qiea: qiea.energy,
      change: imp.energy,
      changeType: 'relative' as ChangeType,
    },

    {
      metric: 'Execution Time',
      unit: 's',
      trad: trad.time,
      qiea: qiea.time,
      change: imp.time,
      changeType: 'relative' as ChangeType,
    },

    {
      metric: 'Resource Utilization',
      unit: '%',
      trad: trad.utilization,
      qiea: qiea.utilization,
      change: imp.utilization,
      changeType: 'points' as ChangeType,
    },

    {
      metric: 'Scheduling Efficiency',
      unit: '%',
      trad: trad.efficiency,
      qiea: qiea.efficiency,
      change: imp.efficiency,
      changeType: 'points' as ChangeType,
    },

    {
      metric: 'Estimated Cost',
      unit: '$',
      trad: trad.cost,
      qiea: qiea.cost,
      change: imp.cost,
      changeType: 'relative' as ChangeType,
    },
  ];

  // ----------------------------------------------------------
  // CHANGE FORMATTER
  // ----------------------------------------------------------

  const formatChange = (
    row: (typeof comparisonRows)[number],
  ) => {
    if (row.changeType === 'points') {
      return formatPointChange(row.change);
    }

    return formatRelativeImpact(row.change);
  };

  // ----------------------------------------------------------
  // BENCHMARK TABLE DEFINITION
  // ----------------------------------------------------------

  const benchmarkRows = [
    {
      metric: 'Energy Consumption',
      unit: 'W',
      key: 'energy' as MetricKey,
    },

    {
      metric: 'Execution Time',
      unit: 's',
      key: 'time' as MetricKey,
    },

    {
      metric: 'Resource Utilization',
      unit: '%',
      key: 'utilization' as MetricKey,
    },

    {
      metric: 'Scheduling Efficiency',
      unit: '%',
      key: 'efficiency' as MetricKey,
    },

    {
      metric: 'Estimated Cost',
      unit: '$',
      key: 'cost' as MetricKey,
    },
  ];

  // ----------------------------------------------------------
  // EXPORT RESULTS
  // ----------------------------------------------------------

  const exportPDF = () => {
    const w = window.open('', '_blank');

    if (!w) {
      return;
    }

    const tableRows = comparisonRows
      .map(
        (row) => `
          <tr>
            <td>${row.metric}</td>
            <td>${row.trad.toFixed(2)} ${row.unit}</td>
            <td>${row.qiea.toFixed(2)} ${row.unit}</td>
            <td>${formatChange(row)}</td>
          </tr>
        `,
      )
      .join('');

    const benchmarkRowsHTML =
      benchmarkCount > 0
        ? `
          <h2>Benchmark Statistics</h2>

          <table>
            <tr>
              <th>Metric</th>
              <th>Average</th>
              <th>Minimum</th>
              <th>Maximum</th>
              <th>Std. Deviation</th>
            </tr>

            <tr>
              <td>Energy</td>
              <td>${benchmarkStats.energy.average.toFixed(2)} W</td>
              <td>${benchmarkStats.energy.minimum.toFixed(2)} W</td>
              <td>${benchmarkStats.energy.maximum.toFixed(2)} W</td>
              <td>±${benchmarkStats.energy.stdDev.toFixed(2)} W</td>
            </tr>

            <tr>
              <td>Execution Time</td>
              <td>${benchmarkStats.time.average.toFixed(2)} s</td>
              <td>${benchmarkStats.time.minimum.toFixed(2)} s</td>
              <td>${benchmarkStats.time.maximum.toFixed(2)} s</td>
              <td>±${benchmarkStats.time.stdDev.toFixed(2)} s</td>
            </tr>

            <tr>
              <td>Resource Utilization</td>
              <td>${benchmarkStats.utilization.average.toFixed(2)}%</td>
              <td>${benchmarkStats.utilization.minimum.toFixed(2)}%</td>
              <td>${benchmarkStats.utilization.maximum.toFixed(2)}%</td>
              <td>±${benchmarkStats.utilization.stdDev.toFixed(2)}%</td>
            </tr>

            <tr>
              <td>Scheduling Efficiency</td>
              <td>${benchmarkStats.efficiency.average.toFixed(2)}%</td>
              <td>${benchmarkStats.efficiency.minimum.toFixed(2)}%</td>
              <td>${benchmarkStats.efficiency.maximum.toFixed(2)}%</td>
              <td>±${benchmarkStats.efficiency.stdDev.toFixed(2)}%</td>
            </tr>

            <tr>
              <td>Estimated Cost</td>
              <td>$${benchmarkStats.cost.average.toFixed(2)}</td>
              <td>$${benchmarkStats.cost.minimum.toFixed(2)}</td>
              <td>$${benchmarkStats.cost.maximum.toFixed(2)}</td>
              <td>±$${benchmarkStats.cost.stdDev.toFixed(2)}</td>
            </tr>
          </table>
        `
        : '';

    const vmRowsHTML = vmSensitivityData
      .map(
        (row) => `
          <tr>
            <td>${row.vms}</td>
            <td>${row.traditional.energy.toFixed(2)} W</td>
            <td>${row.qiea.energy.toFixed(2)} W</td>
            <td>${row.traditional.time.toFixed(2)} s</td>
            <td>${row.qiea.time.toFixed(2)} s</td>
            <td>${row.traditional.utilization.toFixed(2)}%</td>
            <td>${row.qiea.utilization.toFixed(2)}%</td>
            <td>${row.traditional.efficiency.toFixed(2)}%</td>
            <td>${row.qiea.efficiency.toFixed(2)}%</td>
            <td>${row.traditional.cost.toFixed(2)}</td>
            <td>${row.qiea.cost.toFixed(2)}</td>
          </tr>
        `,
      )
      .join('');

    w.document.write(`
      <html>
        <head>
          <title>Quantum Cloud Optimizer Results</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #222;
            }

            h1 {
              color: #0891b2;
            }

            h2 {
              margin-top: 30px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th,
            td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }

            th {
              background: #f5f5f5;
            }

            .note {
              margin-top: 20px;
              font-size: 13px;
              color: #666;
            }
          </style>
        </head>

        <body>
          <h1>Quantum Cloud Optimizer</h1>

          <p>
            QIEA vs Traditional Round-Robin Scheduling
          </p>

          <p>
            Tasks: ${results.taskCount}
            &nbsp; | &nbsp;
            VMs: ${results.vmCount}
            ${
              benchmarkCount > 0
                ? `&nbsp; | &nbsp; Benchmark Runs: ${benchmarkCount}`
                : ''
            }
          </p>

          <h2>Simulation Comparison</h2>

          <table>
            <tr>
              <th>Metric</th>
              <th>Traditional</th>
              <th>QIEA</th>
              <th>Change</th>
            </tr>

            ${tableRows}
          </table>

          ${benchmarkRowsHTML}

          <h2>VM Sensitivity Analysis</h2>

          <table>
            <tr>
              <th>VMs</th>
              <th>Traditional Energy</th>
              <th>QIEA Energy</th>
              <th>Traditional Time</th>
              <th>QIEA Time</th>
              <th>Traditional Utilization</th>
              <th>QIEA Utilization</th>
              <th>Traditional Efficiency</th>
              <th>QIEA Efficiency</th>
              <th>Traditional Cost</th>
              <th>QIEA Cost</th>
            </tr>

            ${vmRowsHTML}
          </table>

          <p class="note">
            Energy consumption, execution time and estimated cost
            are reported as relative reductions or increases.
            Resource utilization and scheduling efficiency are
            reported as percentage-point differences.
            VM sensitivity values are simulator outputs from
            controlled experiments and do not represent measurements
            from real cloud hardware.
          </p>
        </body>
      </html>
    `);

    w.document.close();
    w.print();
  };

  // ----------------------------------------------------------
  // CHART STYLING
  // ----------------------------------------------------------

  const chartColors = {
    trad: 'hsl(215, 20%, 55%)',
    qiea: 'hsl(188, 100%, 50%)',
    grid: 'hsl(222, 30%, 18%)',
    axis: 'hsl(215, 20%, 55%)',
    tooltipBg: 'hsl(222, 44%, 9%)',
  };

  // ----------------------------------------------------------
  // RETURN UI
  // ----------------------------------------------------------

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Simulation Results
              </h1>

              <p className="text-muted-foreground">
                QIEA vs Traditional Round-Robin Scheduling
                {' — '}
                {results.taskCount} tasks on {results.vmCount} VMs
              </p>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />

                <span className="text-sm font-semibold">
                  Quantum-Inspired Evaluation
                </span>
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                Simulation-based scheduling analysis
              </p>
            </div>
          </div>

          {/* ================================================== */}
          {/* BENCHMARK BADGE */}
          {/* ================================================== */}

          {benchmarkCount > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 mb-8">
              <FlaskConical className="w-5 h-5 text-primary" />

              <div>
                <p className="text-sm font-semibold">
                  Benchmark Mode Active
                </p>

                <p className="text-xs text-muted-foreground">
                  Results are based on {benchmarkCount} independent
                  QIEA simulation runs.
                </p>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* TOP METRIC CARDS */}
          {/* ================================================== */}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
            {metricCards.map((metric, index) => {
              const Icon = metric.icon;

              const isImpactCard =
                metric.label === 'Energy Impact' ||
                metric.label === 'Execution Time Impact' ||
                metric.label === 'Cost Impact';

              return (
                <motion.div
                  key={metric.label}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: index * 0.08,
                  }}
                  className="gradient-card rounded-xl p-5 border border-border"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Icon className="w-5 h-5 text-primary" />

                    {isImpactCard &&
                      (metric.value.includes('reduction') ? (
                        <TrendingDown className="w-4 h-4 text-success" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-destructive" />
                      ))}
                  </div>

                  <p className="text-xl font-bold leading-tight">
                    {metric.value}
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.label}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* ================================================== */}
          {/* BENCHMARK STATISTICS */}
          {/* ================================================== */}

          {benchmarkCount > 0 && (
            <div className="gradient-card rounded-xl p-5 border border-border mb-10">
              <div className="flex items-center gap-2 mb-5">
                <FlaskConical className="w-5 h-5 text-primary" />

                <div>
                  <h2 className="text-lg font-semibold">
                    QIEA Benchmark Statistics
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    Statistical summary across {benchmarkCount}{' '}
                    independent runs
                  </p>
                </div>
              </div>

              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="px-4 py-3 text-left">
                        Metric
                      </th>

                      <th className="px-4 py-3 text-left">
                        Average
                      </th>

                      <th className="px-4 py-3 text-left">
                        Minimum
                      </th>

                      <th className="px-4 py-3 text-left">
                        Maximum
                      </th>

                      <th className="px-4 py-3 text-left">
                        Std. Deviation
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {benchmarkRows.map((row) => {
                      const stats = benchmarkStats[row.key];

                      return (
                        <tr
                          key={row.metric}
                          className="border-t border-border"
                        >
                          <td className="px-4 py-3 font-medium">
                            {row.metric}
                          </td>

                          <td className="px-4 py-3 font-mono text-primary">
                            {stats.average.toFixed(2)} {row.unit}
                          </td>

                          <td className="px-4 py-3 font-mono">
                            {stats.minimum.toFixed(2)} {row.unit}
                          </td>

                          <td className="px-4 py-3 font-mono">
                            {stats.maximum.toFixed(2)} {row.unit}
                          </td>

                          <td className="px-4 py-3 font-mono text-muted-foreground">
                            ±{stats.stdDev.toFixed(2)} {row.unit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Standard deviation uses the population formula across
                the benchmark runs.
              </p>
            </div>
          )}

          {/* ================================================== */}
          {/* OPTIMIZATION SUMMARY */}
          {/* ================================================== */}

          <div className="gradient-card rounded-xl p-5 border border-border mb-10">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-5 h-5 text-primary" />

              <h2 className="text-sm font-semibold">
                Optimization Summary
              </h2>
            </div>

            <p className="text-sm text-muted-foreground leading-6">
              The quantum-inspired evolutionary scheduler is evaluated
              against the Traditional Round-Robin baseline using energy
              consumption, execution time, resource utilization,
              scheduling efficiency, and estimated cost.
            </p>

            <p className="text-xs text-muted-foreground leading-6 mt-3">
              The QIEA implementation is a quantum-inspired simulation
              method based on probabilistic quantum-style states; it
              does not execute on a physical quantum computer.
            </p>
          </div>

          {/* ================================================== */}
          {/* CURRENT SIMULATION CHARTS */}
          {/* ================================================== */}

          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-5 h-5 text-primary" />

              <div>
                <h2 className="text-lg font-semibold">
                  Current Simulation Comparison
                </h2>

                <p className="text-xs text-muted-foreground">
                  Traditional baseline compared with the current QIEA run
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* ENERGY */}

              <ChartCard title="Energy Consumption Comparison">
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <BarChart data={energyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />

                    <XAxis
                      dataKey="name"
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <YAxis
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <Tooltip
                      contentStyle={{
                        background: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: 8,
                        color: '#fff',
                      }}
                    />

                    <Legend />

                    <Bar
                      dataKey="traditional"
                      name="Traditional"
                      fill={chartColors.trad}
                      radius={[4, 4, 0, 0]}
                    />

                    <Bar
                      dataKey="qiea"
                      name="QIEA"
                      fill={chartColors.qiea}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* FITNESS */}

              <ChartCard title="QIEA Fitness Score per Generation">
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <LineChart data={fitnessData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />

                    <XAxis
                      dataKey="gen"
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <YAxis
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <Tooltip
                      contentStyle={{
                        background: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: 8,
                        color: '#fff',
                      }}
                    />

                    <Line
                      type="linear"
                      dataKey="fitness"
                      name="Fitness"
                      stroke={chartColors.qiea}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* TIME */}

              <ChartCard title="Execution Time Comparison">
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <BarChart data={timeData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />

                    <XAxis
                      dataKey="name"
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <YAxis
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <Tooltip
                      contentStyle={{
                        background: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: 8,
                        color: '#fff',
                      }}
                    />

                    <Legend />

                    <Bar
                      dataKey="traditional"
                      name="Traditional"
                      fill={chartColors.trad}
                      radius={[4, 4, 0, 0]}
                    />

                    <Bar
                      dataKey="qiea"
                      name="QIEA"
                      fill={chartColors.qiea}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* UTILIZATION */}

              <ChartCard title="Resource Utilization Comparison">
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <BarChart data={utilData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />

                    <XAxis
                      dataKey="name"
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <YAxis
                      stroke={chartColors.axis}
                      fontSize={12}
                      domain={[0, 100]}
                      tickFormatter={(value: number) =>
                        `${value}%`
                      }
                    />

                    <Tooltip
                      formatter={(value: number) => [
                        `${value}%`,
                        'Utilization',
                      ]}
                      contentStyle={{
                        background: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: 8,
                        color: '#fff',
                      }}
                    />

                    <Legend />

                    <Bar
                      dataKey="traditional"
                      name="Traditional"
                      fill={chartColors.trad}
                      radius={[4, 4, 0, 0]}
                    />

                    <Bar
                      dataKey="qiea"
                      name="QIEA"
                      fill={chartColors.qiea}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* EFFICIENCY */}

              <ChartCard title="Scheduling Efficiency Comparison">
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <BarChart data={efficiencyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />

                    <XAxis
                      dataKey="name"
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <YAxis
                      stroke={chartColors.axis}
                      fontSize={12}
                      domain={[0, 100]}
                      tickFormatter={(value: number) =>
                        `${value}%`
                      }
                    />

                    <Tooltip
                      formatter={(value: number) => [
                        `${value}%`,
                        'Efficiency',
                      ]}
                      contentStyle={{
                        background: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: 8,
                        color: '#fff',
                      }}
                    />

                    <Legend />

                    <Bar
                      dataKey="traditional"
                      name="Traditional"
                      fill={chartColors.trad}
                      radius={[4, 4, 0, 0]}
                    />

                    <Bar
                      dataKey="qiea"
                      name="QIEA"
                      fill={chartColors.qiea}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* COST */}

              <ChartCard title="Estimated Cost Comparison">
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <BarChart data={costData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />

                    <XAxis
                      dataKey="name"
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <YAxis
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <Tooltip
                      formatter={(value: number) => [
                        `$${value.toFixed(2)}`,
                        'Cost',
                      ]}
                      contentStyle={{
                        background: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: 8,
                        color: '#fff',
                      }}
                    />

                    <Legend />

                    <Bar
                      dataKey="traditional"
                      name="Traditional"
                      fill={chartColors.trad}
                      radius={[4, 4, 0, 0]}
                    />

                    <Bar
                      dataKey="qiea"
                      name="QIEA"
                      fill={chartColors.qiea}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>

          {/* ================================================== */}
          {/* VM SENSITIVITY ANALYSIS */}
          {/* ================================================== */}

          <div className="gradient-card rounded-xl p-5 border border-border mb-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-primary" />

                  <h2 className="text-lg font-semibold">
                    VM Sensitivity Analysis
                  </h2>
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  Controlled comparison across 5, 10, 15 and 20 VMs
                </p>
              </div>

              <div className="text-xs text-muted-foreground">
                Same workload • 1000 MIPS per VM
              </div>
            </div>

            {vmSensitivityLoading && (
              <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                {vmSensitivityProgress}
              </div>
            )}

            {!vmSensitivityLoading &&
              vmSensitivityData.length ===
                VM_SENSITIVITY_COUNTS.length &&
              !vmSensitivityError && (
                <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                  Controlled experiment completed using
                  simulator-generated results.
                </div>
              )}

            {vmSensitivityError && (
              <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                {vmSensitivityError}
              </div>
            )}

            {/* VM TABLE */}

            <div className="overflow-auto mb-8">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="px-3 py-3 text-left">
                      VMs
                    </th>

                    <th className="px-3 py-3 text-left">
                      Energy
                    </th>

                    <th className="px-3 py-3 text-left">
                      Time
                    </th>

                    <th className="px-3 py-3 text-left">
                      Utilization
                    </th>

                    <th className="px-3 py-3 text-left">
                      Efficiency
                    </th>

                    <th className="px-3 py-3 text-left">
                      Cost
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {vmSensitivityData.map((row) => (
                    <tr
                      key={row.vms}
                      className="border-t border-border"
                    >
                      <td className="px-3 py-3 font-semibold">
                        {row.vms}
                      </td>

                      <td className="px-3 py-3">
                        <span className="text-muted-foreground">
                          {row.traditional.energy.toFixed(2)} W
                        </span>

                        <span className="mx-2">
                          →
                        </span>

                        <span className="font-medium text-primary">
                          {row.qiea.energy.toFixed(2)} W
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <span className="text-muted-foreground">
                          {row.traditional.time.toFixed(2)} s
                        </span>

                        <span className="mx-2">
                          →
                        </span>

                        <span className="font-medium text-primary">
                          {row.qiea.time.toFixed(2)} s
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <span className="text-muted-foreground">
                          {row.traditional.utilization.toFixed(2)}%
                        </span>

                        <span className="mx-2">
                          →
                        </span>

                        <span className="font-medium text-primary">
                          {row.qiea.utilization.toFixed(2)}%
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <span className="text-muted-foreground">
                          {row.traditional.efficiency.toFixed(2)}%
                        </span>

                        <span className="mx-2">
                          →
                        </span>

                        <span className="font-medium text-primary">
                          {row.qiea.efficiency.toFixed(2)}%
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <span className="text-muted-foreground">
                          ${row.traditional.cost.toFixed(2)}
                        </span>

                        <span className="mx-2">
                          →
                        </span>

                        <span className="font-medium text-primary">
                          ${row.qiea.cost.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* VM CHARTS */}

            <div className="grid lg:grid-cols-2 gap-6">
              {/* ENERGY VS VMS */}

              <ChartCard title="Energy Consumption vs Number of VMs">
                <ResponsiveContainer
                  width="100%"
                  height={280}
                >
                  <LineChart data={vmEnergyChart}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />

                    <XAxis
                      dataKey="vms"
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <YAxis
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <Tooltip
                      contentStyle={{
                        background: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: 8,
                        color: '#fff',
                      }}
                    />

                    <Legend />

                    <Line
                      type="linear"
                      dataKey="Traditional"
                      stroke={chartColors.trad}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />

                    <Line
                      type="linear"
                      dataKey="QIEA"
                      stroke={chartColors.qiea}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* TIME VS VMS */}

              <ChartCard title="Execution Time vs Number of VMs">
                <ResponsiveContainer
                  width="100%"
                  height={280}
                >
                  <LineChart data={vmTimeChart}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />

                    <XAxis
                      dataKey="vms"
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <YAxis
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <Tooltip
                      contentStyle={{
                        background: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: 8,
                        color: '#fff',
                      }}
                    />

                    <Legend />

                    <Line
                      type="linear"
                      dataKey="Traditional"
                      stroke={chartColors.trad}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />

                    <Line
                      type="linear"
                      dataKey="QIEA"
                      stroke={chartColors.qiea}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* UTILIZATION VS VMS */}

              <ChartCard title="Resource Utilization vs Number of VMs">
                <ResponsiveContainer
                  width="100%"
                  height={280}
                >
                  <LineChart data={vmUtilizationChart}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />

                    <XAxis
                      dataKey="vms"
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <YAxis
                      stroke={chartColors.axis}
                      fontSize={12}
                      domain={[0, 100]}
                      tickFormatter={(value: number) =>
                        `${value}%`
                      }
                    />

                    <Tooltip
                      formatter={(
                        value: number,
                        name: string,
                      ) => [
                        `${value.toFixed(2)}%`,
                        name,
                      ]}
                      contentStyle={{
                        background: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: 8,
                        color: '#fff',
                      }}
                    />

                    <Legend />

                    <Line
                      type="linear"
                      dataKey="Traditional"
                      stroke={chartColors.trad}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />

                    <Line
                      type="linear"
                      dataKey="QIEA"
                      stroke={chartColors.qiea}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* COST VS VMS */}

              <ChartCard title="Estimated Cost vs Number of VMs">
                <ResponsiveContainer
                  width="100%"
                  height={280}
                >
                  <LineChart data={vmCostChart}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                    />

                    <XAxis
                      dataKey="vms"
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <YAxis
                      stroke={chartColors.axis}
                      fontSize={12}
                    />

                    <Tooltip
                      formatter={(
                        value: number,
                        name: string,
                      ) => [
                        `$${value.toFixed(2)}`,
                        name,
                      ]}
                      contentStyle={{
                        background: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: 8,
                        color: '#fff',
                      }}
                    />

                    <Legend />

                    <Line
                      type="linear"
                      dataKey="Traditional"
                      stroke={chartColors.trad}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />

                    <Line
                      type="linear"
                      dataKey="QIEA"
                      stroke={chartColors.qiea}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>

          {/* ================================================== */}
          {/* VM EXPERIMENTATION NOTES */}
          {/* ================================================== */}

          <div className="rounded-xl border border-border p-5 mb-10">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-5 h-5 text-primary" />

              <h2 className="text-sm font-semibold">
                Experimental Interpretation
              </h2>
            </div>

            <p className="text-sm text-muted-foreground leading-6">
              The VM sensitivity experiment evaluates the same uploaded
              workload under controlled configurations of 5, 10, 15 and
              20 VMs while keeping VM processing capacity fixed at 1000
              MIPS. The values shown in the table and charts are generated
              directly by the scheduling simulator. Differences between
              VM configurations are therefore treated as experimental
              observations rather than predefined results.
            </p>
          </div>

          {/* ================================================== */}
          {/* COMPARISON TABLE */}
          {/* ================================================== */}

          <div className="rounded-xl border border-border overflow-auto mb-8">
            <div className="p-5 border-b border-border">
              <h2 className="text-lg font-semibold">
                Current Simulation Comparison
              </h2>

              <p className="text-xs text-muted-foreground mt-1">
                Traditional Round-Robin vs current QIEA result
              </p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="px-4 py-3 text-left">
                    Metric
                  </th>

                  <th className="px-4 py-3 text-left">
                    Traditional
                  </th>

                  <th className="px-4 py-3 text-left">
                    QIEA Average
                  </th>

                  <th className="px-4 py-3 text-left">
                    Change
                  </th>
                </tr>
              </thead>

              <tbody>
                {comparisonRows.map((row) => (
                  <tr
                    key={row.metric}
                    className="border-t border-border"
                  >
                    <td className="px-4 py-3 font-medium">
                      {row.metric}
                    </td>

                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {row.trad.toFixed(2)} {row.unit}
                    </td>

                    <td className="px-4 py-3 font-mono text-primary">
                      {row.qiea.toFixed(2)} {row.unit}
                    </td>

                    <td
                      className={`px-4 py-3 font-mono font-semibold ${
                        row.change >= 0
                          ? 'text-success'
                          : 'text-destructive'
                      }`}
                    >
                      {formatChange(row)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ================================================== */}
          {/* INTERPRETATION */}
          {/* ================================================== */}

          <div className="rounded-xl border border-border p-5 mb-8">
            <p className="text-xs text-muted-foreground leading-6">
              <span className="font-semibold text-foreground">
                Metric interpretation:
              </span>{' '}
              Energy consumption, execution time, and estimated cost are
              reported as relative percentage reductions or increases.
              Resource utilization and scheduling efficiency are
              reported as percentage-point differences.
            </p>
          </div>

          {/* ================================================== */}
          {/* BUTTONS */}
          {/* ================================================== */}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                nav('/simulation');
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Run Again
            </Button>

            <Button
              className="flex-1 glow-primary"
              onClick={exportPDF}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================
// CHART CARD
// ============================================================

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="gradient-card rounded-xl p-5 border border-border">
      <h3 className="text-sm font-semibold mb-4">
        {title}
      </h3>

      {children}
    </div>
  );
}