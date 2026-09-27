import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { useSimContext } from '@/context/SimulationContext';
import {
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
        (sum, item) => sum + item.energy,
        0
      ) / count,

    time:
      metrics.reduce(
        (sum, item) => sum + item.time,
        0
      ) / count,

    utilization:
      metrics.reduce(
        (sum, item) => sum + item.utilization,
        0
      ) / count,

    efficiency:
      metrics.reduce(
        (sum, item) => sum + item.efficiency,
        0
      ) / count,

    cost:
      metrics.reduce(
        (sum, item) => sum + item.cost,
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
    ...histories.map(history => history.length)
  );

  const averaged: number[] = [];

  for (
    let generation = 0;
    generation < maxLength;
    generation++
  ) {
    const values = histories
      .map(history => history[generation])
      .filter(value => Number.isFinite(value));

    averaged.push(
      values.length > 0
        ? values.reduce(
            (sum, value) => sum + value,
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

  const traditional = averageMetrics(
    results.map(result => result.traditional)
  );

  const qiea = averageMetrics(
    results.map(result => result.qiea)
  );

  const fitnessHistory =
    averageFitnessHistory(
      results.map(
        result => result.fitnessHistory
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
          ) * 100
        : 0,

    time:
      traditional.time > 0
        ? (
            (
              traditional.time -
              qiea.time
            ) /
            traditional.time
          ) * 100
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
          ) * 100
        : 0,
  };

  return {
    traditional,
    qiea,
    fitnessHistory,
    improvements,
    taskCount: results[0].taskCount,
    vmCount: results[0].vmCount,
  };
}

export default function SimulationPage() {
  const nav = useNavigate();

  const {
    parsedData,
    config,
    setResults,
  } = useSimContext();

  const [currentStep, setCurrentStep] =
    useState(0);

  const [detail, setDetail] =
    useState('');

  const [done, setDone] =
    useState(false);

  const [error, setError] =
    useState('');

  const ran = useRef(false);

  useEffect(() => {
    if (!parsedData || ran.current) {
      return;
    }

    ran.current = true;

    let cancelled = false;

    const runBenchmark = async () => {
      try {
        setError('');
        setDone(false);

        const benchmarkResults: SimResults[] = [];

        for (
          let run = 0;
          run < BENCHMARK_RUNS;
          run++
        ) {
          if (cancelled) {
            return;
          }

          const runNumber = run + 1;

          setCurrentStep(1);
          setDetail(
            `Benchmark run ${runNumber} of ${BENCHMARK_RUNS}`
          );

          const result = await runSimulation(
            parsedData,
            config,
            (step, d) => {
              if (cancelled) {
                return;
              }

              setCurrentStep(step);

              if (d) {
                setDetail(
                  `Run ${runNumber}/${BENCHMARK_RUNS} | ${d}`
                );
              }
            }
          );

          benchmarkResults.push(result);

          setCurrentStep(5);
          setDetail(
            `Completed benchmark run ${runNumber} of ${BENCHMARK_RUNS}`
          );

          await new Promise(resolve =>
            setTimeout(resolve, 250)
          );
        }

        if (cancelled) {
          return;
        }

        // ----------------------------------------------------
        // SAVE INDIVIDUAL RUNS FOR RESULTS PAGE
        // ----------------------------------------------------

        sessionStorage.setItem(
          'quantum_benchmark_runs',
          JSON.stringify(
            benchmarkResults
          )
        );

        sessionStorage.setItem(
          'quantum_benchmark_run_count',
          String(BENCHMARK_RUNS)
        );

        // ----------------------------------------------------
        // BUILD AVERAGED RESULT
        // ----------------------------------------------------

        const finalResult =
          buildBenchmarkResult(
            benchmarkResults
          );

        setResults(finalResult);

        setDone(true);

        setDetail(
          `Benchmark completed successfully: ${BENCHMARK_RUNS} independent runs averaged.`
        );

        setTimeout(() => {
          if (!cancelled) {
            nav('/results');
          }
        }, 1200);

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

          <div className="mb-6 rounded-lg border border-border bg-secondary/30 p-4">

            <p className="text-xs text-muted-foreground">
              Benchmark Mode
            </p>

            <p className="text-sm font-semibold mt-1">
              {BENCHMARK_RUNS} Independent Runs
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              The dashboard calculates average,
              minimum, maximum and standard deviation.
            </p>

          </div>

          <div className="space-y-3 text-left">

            {stepLabels.map(
              (label, index) => {

                const stepNum =
                  index + 1;

                const isActive =
                  currentStep === stepNum &&
                  !done &&
                  !error;

                const isDone =
                  currentStep > stepNum ||
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

          {done && detail && (
            <p className="text-xs text-muted-foreground mt-6">
              {detail}
            </p>
          )}

        </motion.div>

      </div>
    </div>
  );
}