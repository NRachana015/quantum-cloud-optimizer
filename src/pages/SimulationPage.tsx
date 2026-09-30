import {
  useEffect,
  useState,
  useRef,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import {
  CheckCircle2,
  Loader2,
} from 'lucide-react';

import { Progress } from '@/components/ui/progress';

import {
  useSimContext,
} from '@/context/SimulationContext';

import {
  DEFAULT_SEED,
  runSimulation,
  type SimResults,
  type MetricsResult,
} from '@/lib/simulation';

const BENCHMARK_RUNS = 5;

const stepLabels = [
  'Reading uploaded file data...',
  'Running Traditional Round-Robin Scheduling...',
  'Initializing QIEA population...',
  'Running QIEA Generations...',
  'Comparing benchmark results...',
];

function averageMetrics(
  metrics: MetricsResult[]
): MetricsResult {
  const count = metrics.length;

  if (count === 0) {
    return {
      energy: 0,
      time: 0,
      utilization: 0,
      efficiency: 0,
      cost: 0,
    };
  }

  return {
    energy:
      metrics.reduce(
        (sum, item) =>
          sum + item.energy,
        0
      ) / count,

    time:
      metrics.reduce(
        (sum, item) =>
          sum + item.time,
        0
      ) / count,

    utilization:
      metrics.reduce(
        (sum, item) =>
          sum + item.utilization,
        0
      ) / count,

    efficiency:
      metrics.reduce(
        (sum, item) =>
          sum + item.efficiency,
        0
      ) / count,

    cost:
      metrics.reduce(
        (sum, item) =>
          sum + item.cost,
        0
      ) / count,
  };
}

function averageFitnessHistory(
  histories: number[][]
): number[] {
  if (histories.length === 0) {
    return [];
  }

  const maxLength = Math.max(
    ...histories.map(
      history => history.length
    )
  );

  const averaged: number[] = [];

  for (
    let generation = 0;
    generation < maxLength;
    generation++
  ) {
    const values = histories
      .map(
        history =>
          history[generation]
      )
      .filter(
        value =>
          Number.isFinite(value)
      );

    averaged.push(
      values.length > 0
        ? values.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / values.length
        : 0
    );
  }

  return averaged;
}

function buildBenchmarkResult(
  results: SimResults[]
): SimResults {
  if (results.length === 0) {
    throw new Error(
      'No simulation results were generated.'
    );
  }

  const traditional =
    averageMetrics(
      results.map(
        result =>
          result.traditional
      )
    );

  const qiea =
    averageMetrics(
      results.map(
        result =>
          result.qiea
      )
    );

  const fitnessHistory =
    averageFitnessHistory(
      results.map(
        result =>
          result.fitnessHistory
      )
    );

  const improvements = {
    energy:
      traditional.energy > 0
        ? (
            (
              traditional.energy -
              qiea.energy
            ) /
            traditional.energy
          ) *
          100
        : 0,

    time:
      traditional.time > 0
        ? (
            (
              traditional.time -
              qiea.time
            ) /
            traditional.time
          ) *
          100
        : 0,

    utilization:
      qiea.utilization -
      traditional.utilization,

    efficiency:
      qiea.efficiency -
      traditional.efficiency,

    cost:
      traditional.cost > 0
        ? (
            (
              traditional.cost -
              qiea.cost
            ) /
            traditional.cost
          ) *
          100
        : 0,
  };

  return {
    traditional,
    qiea,
    fitnessHistory,
    improvements,
    taskCount:
      results[0].taskCount,
    vmCount:
      results[0].vmCount,
  };
}

export default function SimulationPage() {
  const nav = useNavigate();

  const {
    parsedData,
    config,
    setResults,
  } = useSimContext();

  const [
    currentStep,
    setCurrentStep,
  ] = useState(0);

  const [
    detail,
    setDetail,
  ] = useState('');

  const [
    done,
    setDone,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    currentRun,
    setCurrentRun,
  ] = useState(0);

  const [
    completedRuns,
    setCompletedRuns,
  ] = useState(0);

  const ran = useRef(false);

  useEffect(() => {
    if (
      !parsedData ||
      ran.current
    ) {
      return;
    }

    ran.current = true;

    let cancelled = false;

    const runBenchmark =
      async () => {
        try {
          setError('');
          setDone(false);
          setCurrentRun(0);
          setCompletedRuns(0);

          const benchmarkResults:
            SimResults[] = [];

          const baseSeed =
            Number.isFinite(
              config.seed
            )
              ? Math.trunc(
                  config.seed as number
                )
              : DEFAULT_SEED;

          const benchmarkSeeds:
            number[] = [];

          for (
            let run = 0;
            run < BENCHMARK_RUNS;
            run++
          ) {
            if (cancelled) {
              return;
            }

            const runNumber =
              run + 1;

            const runSeed =
              (
                baseSeed +
                run
              ) >>> 0;

            benchmarkSeeds.push(
              runSeed
            );

            const runConfig = {
              ...config,
              seed: runSeed,
            };

            setCurrentRun(
              runNumber
            );

            setCurrentStep(1);

            setDetail(
              `Benchmark run ${runNumber} of ${BENCHMARK_RUNS} | Seed ${runSeed}`
            );

            const result =
              await runSimulation(
                parsedData,
                runConfig,
                (
                  step,
                  d
                ) => {
                  if (
                    cancelled
                  ) {
                    return;
                  }

                  setCurrentStep(
                    step
                  );

                  if (d) {
                    setDetail(
                      `Run ${runNumber}/${BENCHMARK_RUNS} | Seed ${runSeed} | ${d}`
                    );
                  }
                }
              );

            benchmarkResults.push(
              result
            );

            setCompletedRuns(
              runNumber
            );

            setCurrentStep(5);

            setDetail(
              `Completed benchmark run ${runNumber} of ${BENCHMARK_RUNS} | Seed ${runSeed}`
            );

            await new Promise(
              resolve =>
                setTimeout(
                  resolve,
                  250
                )
            );
          }

          if (cancelled) {
            return;
          }

          sessionStorage.setItem(
            'quantum_benchmark_runs',
            JSON.stringify(
              benchmarkResults
            )
          );

          sessionStorage.setItem(
            'quantum_benchmark_run_count',
            String(
              BENCHMARK_RUNS
            )
          );

          sessionStorage.setItem(
            'quantum_benchmark_base_seed',
            String(
              baseSeed
            )
          );

          sessionStorage.setItem(
            'quantum_benchmark_seeds',
            JSON.stringify(
              benchmarkSeeds
            )
          );

          const finalResult =
            buildBenchmarkResult(
              benchmarkResults
            );

          setResults(
            finalResult
          );

          setDone(true);

          setCurrentRun(
            BENCHMARK_RUNS
          );

          setCompletedRuns(
            BENCHMARK_RUNS
          );

          setDetail(
            `Benchmark completed successfully: ${BENCHMARK_RUNS} independent runs averaged. Base seed: ${baseSeed}.`
          );

          setTimeout(
            () => {
              if (!cancelled) {
                nav('/results');
              }
            },
            1200
          );
        } catch (err) {
          console.error(
            'Benchmark simulation failed:',
            err
          );

          if (!cancelled) {
            setError(
              err instanceof Error
                ? err.message
                : 'An unexpected error occurred.'
            );
          }
        }
      };

    runBenchmark();

    return () => {
      cancelled = true;
    };
  }, [
    parsedData,
    config,
    setResults,
    nav,
  ]);

  if (!parsedData) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-muted-foreground">
          No data. Please upload a file first.
        </p>
      </div>
    );
  }

  const progress = done
    ? 100
    : Math.min(
        95,
        (currentStep / 5) * 100
      );

  const displayedBaseSeed =
    Number.isFinite(
      config.seed
    )
      ? Math.trunc(
          config.seed as number
        )
      : DEFAULT_SEED;

  const displayedSeeds =
    Array.from(
      {
        length: BENCHMARK_RUNS,
      },
      (_, index) =>
        (
          displayedBaseSeed +
          index
        ) >>> 0
    );

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">

      <div className="container mx-auto px-4 max-w-xl">

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="text-center"
        >

          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">

            {done ? (
              <CheckCircle2 className="w-8 h-8 text-primary" />
            ) : (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            )}

          </div>

          <h1 className="text-2xl font-bold mb-2">
            {done
              ? 'Benchmark Complete!'
              : error
                ? 'Benchmark Failed'
                : 'Running Benchmark...'}
          </h1>

          <p className="text-muted-foreground text-sm mb-3">
            {done
              ? `Average results from ${BENCHMARK_RUNS} independent runs are ready.`
              : error
                ? 'The benchmark could not be completed.'
                : `Running ${BENCHMARK_RUNS} independent QIEA simulations.`}
          </p>

          {error && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                {error}
              </p>
            </div>
          )}

          <Progress
            value={progress}
            className="mb-8 h-2"
          />

          {/* Benchmark information */}
          <div className="mb-4 rounded-lg border border-border bg-secondary/30 p-4">

            <p className="text-xs text-muted-foreground">
              Benchmark Mode
            </p>

            <p className="text-sm font-semibold mt-1">
              {BENCHMARK_RUNS} Independent Runs
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Base seed: {displayedBaseSeed}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Each run uses a deterministic seed offset
              to preserve independent stochastic trials.
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              The dashboard calculates average,
              minimum, maximum and standard deviation.
            </p>

          </div>

          {/* Permanent benchmark seed schedule */}
          <div className="mb-6 rounded-lg border border-border bg-background p-4 text-left">

            <div className="flex items-center justify-between mb-3">

              <div>
                <p className="text-sm font-semibold">
                  Benchmark Seed Schedule
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  Base seed + run offset
                </p>
              </div>

              <div className="text-xs font-mono text-muted-foreground">
                {completedRuns}/{BENCHMARK_RUNS}
              </div>

            </div>

            <div className="space-y-2">

              {displayedSeeds.map(
                (seed, index) => {

                  const runNumber =
                    index + 1;

                  const isCurrent =
                    currentRun ===
                      runNumber &&
                    !done &&
                    !error;

                  const isCompleted =
                    completedRuns >=
                      runNumber ||
                    done;

                  return (
                    <div
                      key={seed}
                      className={`
                        flex items-center justify-between
                        rounded-md border px-3 py-2
                        transition-all
                        ${
                          isCurrent
                            ? 'border-primary/40 bg-primary/10'
                            : isCompleted
                              ? 'border-success/20 bg-success/5'
                              : 'border-border bg-secondary/20'
                        }
                      `}
                    >

                      <div className="flex items-center gap-2">

                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                        )}

                        <span
                          className={`
                            text-xs font-medium
                            ${
                              isCurrent
                                ? 'text-primary'
                                : isCompleted
                                  ? 'text-foreground'
                                  : 'text-muted-foreground'
                            }
                          `}
                        >
                          Run {runNumber}
                        </span>

                      </div>

                      <span className="text-xs font-mono text-muted-foreground">
                        Seed {seed}
                      </span>

                    </div>
                  );
                }
              )}

            </div>

          </div>

          {/* Simulation steps */}
          <div className="space-y-3 text-left">

            {stepLabels.map(
              (
                label,
                index
              ) => {

                const stepNum =
                  index + 1;

                const isActive =
                  currentStep ===
                    stepNum &&
                  !done &&
                  !error;

                const isDone =
                  currentStep >
                    stepNum ||
                  done;

                return (
                  <div
                    key={label}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg
                      ${
                        isActive
                          ? 'bg-primary/10 border border-primary/30'
                          : isDone
                            ? 'bg-success/5'
                            : 'opacity-40'
                      }
                    `}
                  >

                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-border shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">

                      <p
                        className={`
                          text-sm font-medium
                          ${
                            isActive
                              ? 'text-primary'
                              : isDone
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                          }
                        `}
                      >
                        Step {stepNum}: {label}
                      </p>

                      {isActive &&
                        detail && (
                          <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                            {detail}
                          </p>
                        )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

          {done &&
            detail && (
              <p className="text-xs text-muted-foreground mt-6">
                {detail}
              </p>
            )}

        </motion.div>

      </div>
    </div>
  );
}