export interface ParsedData {
  headers: string[];
  rows: Record<string, number>[];
  filename: string;
}

export interface SimConfig {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverProb: number;
  rotationAngle: number;
  numVMs: number;
  vmMIPS: number;
  energyModel: 'Linear' | 'Cubic' | 'Square';

  /**
   * Optional for backward compatibility.
   * When omitted or invalid, DEFAULT_SEED is used.
   */
  seed?: number;
}

export interface MetricsResult {
  energy: number;
  time: number;
  utilization: number;
  efficiency: number;
  cost: number;
}

export interface SimResults {
  traditional: MetricsResult;
  qiea: MetricsResult;
  fitnessHistory: number[];
  improvements: {
    energy: number;
    time: number;
    utilization: number;
    efficiency: number;
    cost: number;
  };
  taskCount: number;
  vmCount: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const HALF_PI = Math.PI / 2;

export const DEFAULT_SEED = 12345;

// ============================================================
// SEEDED RANDOM NUMBER GENERATOR
// ============================================================

/**
 * Converts the supplied seed into a stable unsigned
 * 32-bit integer.
 */
function normalizeSeed(
  seed: number | undefined
): number {

  if (
    typeof seed !== 'number' ||
    !Number.isFinite(seed)
  ) {
    return DEFAULT_SEED;
  }

  return Math.trunc(seed) >>> 0;
}

/**
 * Deterministic pseudo-random number generator.
 *
 * The same seed always produces the same sequence.
 *
 * This replaces Math.random() inside the QIEA engine
 * so simulations can be reproduced exactly.
 */
function createSeededRandom(
  seed: number
): () => number {

  let state =
    normalizeSeed(seed);

  return () => {

    state += 0x6D2B79F5;

    let t =
      state;

    t =
      Math.imul(
        t ^ (t >>> 15),
        t | 1
      );

    t ^=
      t +
      Math.imul(
        t ^ (t >>> 7),
        t | 61
      );

    return (
      (t ^ (t >>> 14)) >>> 0
    ) / 4294967296;
  };
}

// ============================================================
// ENERGY MODEL
// ============================================================

function getPowerFactor(
  model: string
): number {

  if (
    model === 'Cubic'
  ) {
    return 0.15;
  }

  if (
    model === 'Square'
  ) {
    return 0.12;
  }

  return 0.1;
}

// ============================================================
// COLUMN DETECTION
// ============================================================

function detectColumns(
  data: ParsedData
) {

  const headers =
    data.headers;

  const rows =
    data.rows;

  const lower =
    headers.map(
      h =>
        h.toLowerCase().trim()
    );

  const matchColumn = (
    candidates: string[]
  ): string | null => {

    // Exact match
    for (
      const candidate of candidates
    ) {

      const index =
        lower.indexOf(
          candidate
        );

      if (
        index !== -1
      ) {
        return headers[index];
      }
    }

    // Partial match
    for (
      const candidate of candidates
    ) {

      const index =
        lower.findIndex(
          h =>
            h.includes(candidate)
        );

      if (
        index !== -1
      ) {
        return headers[index];
      }
    }

    return null;
  };

  const taskId =
    matchColumn([
      'task_id',
      'id',
      'taskid',
      'cloudlet_id',
      'job_id'
    ]);

  let workload =
    matchColumn([
      'length',
      'mi',
      'workload',
      'size',
      'cloudlet_length',
      'task_length'
    ]);

  const deadline =
    matchColumn([
      'deadline',
      'due',
      'max_time'
    ]);

  // Fallback workload detection
  if (
    !workload &&
    rows.length > 0
  ) {

    let maxAverage =
      -Infinity;

    for (
      const header of headers
    ) {

      if (
        header === taskId
      ) {
        continue;
      }

      const average =
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            (
              Number.isFinite(
                row[header]
              )
                ? row[header]
                : 0
            ),
          0
        ) / rows.length;

      if (
        average > maxAverage
      ) {

        maxAverage =
          average;

        workload =
          header;
      }
    }
  }

  if (
    !workload
  ) {

    workload =
      headers[1] ||
      headers[0];
  }

  return {
    workload:
      workload as string,
    deadline,
    taskId
  };
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function sleep(
  ms: number
) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}

/**
 * Keeps an angle inside [0, π/2].
 *
 * Rotation can mathematically move an angle
 * outside this range. Reflection keeps the
 * state valid instead of forcing negative angles
 * into VM 0.
 */
function normalizeAngle(
  angle: number
): number {

  let result =
    angle;

  while (
    result < 0 ||
    result > HALF_PI
  ) {

    if (
      result < 0
    ) {

      result =
        -result;
    }

    if (
      result > HALF_PI
    ) {

      result =
        Math.PI -
        result;
    }
  }

  return Math.min(
    HALF_PI,
    Math.max(
      0,
      result
    )
  );
}

/**
 * Converts a VM index into the center angle
 * representing that VM.
 */
function vmToTargetAngle(
  vmIndex: number,
  numVMs: number
): number {

  return (
    (
      vmIndex + 0.5
    ) /
    numVMs
  ) * HALF_PI;
}

/**
 * Converts a quantum-inspired state into
 * a VM assignment.
 */
function stateToVM(
  alpha: number,
  beta: number,
  numVMs: number
): number {

  const rawAngle =
    Math.atan2(
      beta,
      alpha
    );

  const angle =
    normalizeAngle(
      rawAngle
    );

  let vmIndex =
    Math.floor(
      (
        angle /
        HALF_PI
      ) *
      numVMs
    );

  if (
    vmIndex >= numVMs
  ) {

    vmIndex =
      numVMs - 1;
  }

  if (
    vmIndex < 0
  ) {

    vmIndex =
      0;
  }

  return vmIndex;
}

/**
 * Rotates a quantum-inspired state toward
 * the center angle of a target VM.
 */
function rotateTowardVM(
  alpha: number,
  beta: number,
  targetVM: number,
  numVMs: number,
  rotationAngle: number
): [number, number] {

  const currentAngle =
    normalizeAngle(
      Math.atan2(
        beta,
        alpha
      )
    );

  const targetAngle =
    vmToTargetAngle(
      targetVM,
      numVMs
    );

  const difference =
    targetAngle -
    currentAngle;

  const maxStep =
    Math.abs(
      rotationAngle
    );

  const step =
    Math.sign(
      difference
    ) *
    Math.min(
      Math.abs(
        difference
      ),
      maxStep
    );

  const newAngle =
    normalizeAngle(
      currentAngle +
      step
    );

  return [
    Math.cos(
      newAngle
    ),
    Math.sin(
      newAngle
    )
  ];
}

// ============================================================
// METRIC EVALUATION
// ============================================================

function evaluate(
  tasks: Record<string, number>[],
  assignment: number[],
  numVMs: number,
  vmMIPS: number,
  pf: number,
  getWorkload: (
    task: Record<string, number>
  ) => number,
  getDeadline: (
    task: Record<string, number>
  ) => number
): MetricsResult {

  const vmLoads =
    new Array(
      numVMs
    ).fill(0);

  // ----------------------------------------------------------
  // VM LOAD DISTRIBUTION
  // ----------------------------------------------------------

  for (
    let i = 0;
    i < tasks.length;
    i++
  ) {

    const vm =
      assignment[i] %
      numVMs;

    vmLoads[vm] +=
      getWorkload(
        tasks[i]
      );
  }

  // ----------------------------------------------------------
  // TOTAL WORKLOAD
  // ----------------------------------------------------------

  const totalWork =
    vmLoads.reduce(
      (
        sum,
        load
      ) =>
        sum + load,
      0
    );

  const avgLoad =
    totalWork /
    numVMs;

  // ----------------------------------------------------------
  // ENERGY
  // ----------------------------------------------------------

  let totalEnergy =
    0;

  vmLoads.forEach(
    load => {

      const baseEnergy =
        (
          load /
          vmMIPS
        ) * pf;

      const deviation =
        Math.abs(
          load -
          avgLoad
        ) /
        (
          avgLoad ||
          1
        );

      if (
        pf === 0.15
      ) {

        totalEnergy +=
          baseEnergy *
          (
            1 +
            deviation *
            deviation
          );

      } else if (
        pf === 0.12
      ) {

        totalEnergy +=
          baseEnergy *
          (
            1 +
            deviation *
            0.8
          );

      } else {

        totalEnergy +=
          baseEnergy *
          (
            1 +
            deviation *
            0.5
          );
      }
    }
  );

  // ----------------------------------------------------------
  // EXECUTION TIME / MAKESPAN
  // ----------------------------------------------------------

  const vmTimes =
    vmLoads.map(
      load =>
        load /
        vmMIPS
    );

  const makespan =
    tasks.length > 0
      ? Math.max(
          ...vmTimes
        )
      : 0;

  // ----------------------------------------------------------
  // RESOURCE UTILIZATION
  // ----------------------------------------------------------

  const utilization =
    makespan > 0
      ? (
          vmTimes.reduce(
            (
              sum,
              time
            ) =>
              sum +
              time /
                makespan,
            0
          ) /
          numVMs
        ) *
        100
      : 0;

  // ----------------------------------------------------------
  // SCHEDULING EFFICIENCY
  // ----------------------------------------------------------

  let onTime =
    0;

  const vmCurrent =
    new Array(
      numVMs
    ).fill(0);

  for (
    let i = 0;
    i < tasks.length;
    i++
  ) {

    const vm =
      assignment[i] %
      numVMs;

    vmCurrent[vm] +=
      getWorkload(
        tasks[i]
      ) /
      vmMIPS;

    const deadline =
      getDeadline(
        tasks[i]
      );

    if (
      deadline === Infinity ||
      vmCurrent[vm] <=
        deadline
    ) {

      onTime++;
    }
  }

  const efficiency =
    tasks.length > 0
      ? (
          onTime /
          tasks.length
        ) *
        100
      : 0;

  // ----------------------------------------------------------
  // ESTIMATED COST
  // ----------------------------------------------------------

  const cost =
    totalEnergy *
      0.12 +
    numVMs *
      makespan *
      0.065;

  return {
    energy:
      totalEnergy,

    time:
      makespan,

    utilization,

    efficiency,

    cost
  };
}

// ============================================================
// MAIN SIMULATION
// ============================================================

export async function runSimulation(
  data: ParsedData,
  config: SimConfig,
  onProgress: (
    step: number,
    detail?: string
  ) => void
): Promise<SimResults> {

  // ----------------------------------------------------------
  // REPRODUCIBLE RANDOM GENERATOR
  // ----------------------------------------------------------

  const random =
    createSeededRandom(
      config.seed
    );

  // ----------------------------------------------------------
  // DATA PREPARATION
  // ----------------------------------------------------------

  const cols =
    detectColumns(
      data
    );

  const tasks =
    data.rows;

  const numTasks =
    tasks.length;

  const numVMs =
    Math.max(
      1,
      Math.floor(
        config.numVMs
      )
    );

  const vmMIPS =
    Math.max(
      1,
      config.vmMIPS
    );

  const pf =
    getPowerFactor(
      config.energyModel
    );

  const getWorkload = (
    task: Record<string, number>
  ) => {

    const value =
      task[
        cols.workload
      ];

    if (
      Number.isFinite(value)
    ) {

      return Math.max(
        0,
        value
      );
    }

    return 1;
  };

  const getDeadline = (
    task: Record<string, number>
  ) => {

    if (
      !cols.deadline
    ) {

      return Infinity;
    }

    const value =
      task[
        cols.deadline
      ];

    if (
      Number.isFinite(value)
    ) {

      return Math.max(
        0,
        value
      );
    }

    return Infinity;
  };

  // ----------------------------------------------------------
  // STEP 1
  // ----------------------------------------------------------

  onProgress(
    1
  );

  await sleep(
    400
  );

  // ----------------------------------------------------------
  // TRADITIONAL ROUND-ROBIN BASELINE
  // ----------------------------------------------------------

  onProgress(
    2
  );

  await sleep(
    300
  );

  const tradAssign =
    tasks.map(
      (
        _,
        index
      ) =>
        index %
        numVMs
    );

  const tradMetrics =
    evaluate(
      tasks,
      tradAssign,
      numVMs,
      vmMIPS,
      pf,
      getWorkload,
      getDeadline
    );

  // ----------------------------------------------------------
  // STEP 3
  // ----------------------------------------------------------

  onProgress(
    3
  );

  await sleep(
    300
  );

  // ----------------------------------------------------------
  // QIEA PARAMETERS
  // ----------------------------------------------------------

  const popSize =
    Math.max(
      2,
      Math.floor(
        config.populationSize
      )
    );

  const numGens =
    Math.max(
      1,
      Math.floor(
        config.generations
      )
    );

  // ----------------------------------------------------------
  // QUANTUM-INSPIRED POPULATION
  // ----------------------------------------------------------

  /*
   * Each task is represented by a pair:
   *
   * [alpha, beta]
   *
   * where:
   *
   * alpha = cos(angle)
   * beta  = sin(angle)
   *
   * The angle is restricted to [0, π/2].
   */

  const qubits:
    number[][][] =
    [];

  for (
    let i = 0;
    i < popSize;
    i++
  ) {

    const individual:
      number[][] =
      [];

    for (
      let j = 0;
      j < numTasks;
      j++
    ) {

      const angle =
        random() *
        HALF_PI;

      individual.push(
        [
          Math.cos(
            angle
          ),
          Math.sin(
            angle
          )
        ]
      );
    }

    qubits.push(
      individual
    );
  }

  // ----------------------------------------------------------
  // BEST SOLUTION
  // ----------------------------------------------------------

  let bestFitness =
    -Infinity;

  let bestAssignment:
    number[] =
    [];

  const fitnessHistory:
    number[] =
    [];

  // ----------------------------------------------------------
  // EVOLUTION
  // ----------------------------------------------------------

  for (
    let gen = 0;
    gen < numGens;
    gen++
  ) {

    // --------------------------------------------------------
    // CROSSOVER
    // --------------------------------------------------------

    /*
     * Single-point crossover between
     * neighboring individuals.
     *
     * Since each qubit state is already normalized,
     * swapping states preserves normalization.
     */

    for (
      let i = 0;
      i <
        popSize - 1;
      i += 2
    ) {

      if (
        random() <
          config.crossoverProb &&
        numTasks > 1
      ) {

        const crossoverPoint =
          1 +
          Math.floor(
            random() *
            (
              numTasks - 1
            )
          );

        for (
          let j =
            crossoverPoint;
          j < numTasks;
          j++
        ) {

          const temp =
            qubits[i][j];

          qubits[i][j] =
            qubits[
              i + 1
            ][j];

          qubits[
            i + 1
          ][j] =
            temp;
        }
      }
    }

    // --------------------------------------------------------
    // PROGRESS
    // --------------------------------------------------------

    if (
      gen %
        Math.max(
          1,
          Math.floor(
            numGens /
              100
          )
        ) ===
        0
    ) {

      onProgress(
        4,
        `Generation ${
          gen + 1
        } of ${numGens} | Best Fitness: ${
          bestFitness > 0
            ? bestFitness.toFixed(
                6
              )
            : '—'
        }`
      );

      await sleep(
        5
      );
    }

    // --------------------------------------------------------
    // POPULATION EVALUATION
    // --------------------------------------------------------

    for (
      let i = 0;
      i < popSize;
      i++
    ) {

      // ------------------------------------------------------
      // OBSERVE QUANTUM-INSPIRED STATES
      // ------------------------------------------------------

      const assignment:
        number[] =
        [];

      for (
        let j = 0;
        j < numTasks;
        j++
      ) {

        const alpha =
          qubits[i][j][0];

        const beta =
          qubits[i][j][1];

        const vmIndex =
          stateToVM(
            alpha,
            beta,
            numVMs
          );

        assignment.push(
          vmIndex
        );
      }

      // ------------------------------------------------------
      // EVALUATE
      // ------------------------------------------------------

      const metrics =
        evaluate(
          tasks,
          assignment,
          numVMs,
          vmMIPS,
          pf,
          getWorkload,
          getDeadline
        );

      // ------------------------------------------------------
      // NORMALIZED OBJECTIVES
      // ------------------------------------------------------

      const energyScore =
        tradMetrics.energy > 0
          ? metrics.energy /
            tradMetrics.energy
          : 1;

      const timeScore =
        tradMetrics.time > 0
          ? metrics.time /
            tradMetrics.time
          : 1;

      const utilizationPenalty =
        1 -
        metrics.utilization /
          100;

      const efficiencyPenalty =
        1 -
        metrics.efficiency /
          100;

      /*
       * Multi-objective weights:
       *
       * Energy                30%
       * Execution time        30%
       * Utilization           20%
       * Scheduling efficiency 20%
       */

      const objectiveScore =
        0.30 *
          energyScore +
        0.30 *
          timeScore +
        0.20 *
          utilizationPenalty +
        0.20 *
          efficiencyPenalty;

      const fitness =
        1 /
        (
          objectiveScore +
          0.0001
        );

      // ------------------------------------------------------
      // BEST SOLUTION / GUIDED ROTATION
      // ------------------------------------------------------

      const theta =
        Math.abs(
          config.rotationAngle
        );

      const isNewBest =
        fitness >
        bestFitness;

      if (
        isNewBest
      ) {

        bestFitness =
          fitness;

        bestAssignment =
          [
            ...assignment
          ];

        /*
         * The new global best becomes
         * the target assignment.
         *
         * Move this individual's
         * quantum-inspired states toward
         * the center of their selected VMs.
         */

        for (
          let j = 0;
          j < numTasks;
          j++
        ) {

          const [
            alpha,
            beta
          ] =
            qubits[i][j];

          qubits[i][j] =
            rotateTowardVM(
              alpha,
              beta,
              assignment[j],
              numVMs,
              theta
            );
        }

      } else if (
        bestAssignment.length ===
        numTasks
      ) {

        /*
         * Other individuals are guided
         * toward the current global best.
         *
         * This replaces the previous blind
         * reverse rotation.
         */

        for (
          let j = 0;
          j < numTasks;
          j++
        ) {

          const [
            alpha,
            beta
          ] =
            qubits[i][j];

          qubits[i][j] =
            rotateTowardVM(
              alpha,
              beta,
              bestAssignment[j],
              numVMs,
              theta
            );
        }
      }

      // ------------------------------------------------------
      // MUTATION
      // ------------------------------------------------------

      if (
        random() <
          config.mutationRate &&
        numTasks > 0
      ) {

        const randomTask =
          Math.floor(
            random() *
            numTasks
          );

        const randomAngle =
          random() *
          HALF_PI;

        qubits[i][
          randomTask
        ] = [
          Math.cos(
            randomAngle
          ),
          Math.sin(
            randomAngle
          )
        ];
      }
    }

    // --------------------------------------------------------
    // FITNESS HISTORY
    // --------------------------------------------------------

    fitnessHistory.push(
      bestFitness > 0
        ? bestFitness
        : 0
    );
  }

  // ----------------------------------------------------------
  // STEP 5
  // ----------------------------------------------------------

  onProgress(
    5
  );

  await sleep(
    300
  );

  // ----------------------------------------------------------
  // FALLBACK LOAD-BALANCING SOLUTION
  // ----------------------------------------------------------

  if (
    bestAssignment.length ===
      0 ||
    bestFitness <= 0
  ) {

    const vmLoads =
      new Array(
        numVMs
      ).fill(0);

    bestAssignment =
      new Array(
        numTasks
      ).fill(0);

    const sortedTasks =
      tasks
        .map(
          (
            task,
            index
          ) => ({
            index,
            workload:
              getWorkload(
                task
              )
          })
        )
        .sort(
          (
            a,
            b
          ) =>
            b.workload -
            a.workload
        );

    for (
      const {
        index,
        workload
      } of sortedTasks
    ) {

      const minVM =
        vmLoads.indexOf(
          Math.min(
            ...vmLoads
          )
        );

      bestAssignment[
        index
      ] =
        minVM;

      vmLoads[
        minVM
      ] += workload;
    }
  }

  // ----------------------------------------------------------
  // FINAL QIEA METRICS
  // ----------------------------------------------------------

  const qieaMetrics =
    evaluate(
      tasks,
      bestAssignment,
      numVMs,
      vmMIPS,
      pf,
      getWorkload,
      getDeadline
    );

  // ----------------------------------------------------------
  // IMPROVEMENTS
  // ----------------------------------------------------------

  const improvements = {

    // Relative percentage reduction
    energy:
      tradMetrics.energy > 0
        ? (
            (
              tradMetrics.energy -
              qieaMetrics.energy
            ) /
            tradMetrics.energy
          ) *
          100
        : 0,

    // Relative percentage reduction
    time:
      tradMetrics.time > 0
        ? (
            (
              tradMetrics.time -
              qieaMetrics.time
            ) /
            tradMetrics.time
          ) *
          100
        : 0,

    // Percentage-point difference
    utilization:
      qieaMetrics.utilization -
      tradMetrics.utilization,

    // Percentage-point difference
    efficiency:
      qieaMetrics.efficiency -
      tradMetrics.efficiency,

    // Relative percentage reduction
    cost:
      tradMetrics.cost > 0
        ? (
            (
              tradMetrics.cost -
              qieaMetrics.cost
            ) /
            tradMetrics.cost
          ) *
          100
        : 0
  };

  // ----------------------------------------------------------
  // RETURN RESULTS
  // ----------------------------------------------------------

  return {
    traditional:
      tradMetrics,

    qiea:
      qieaMetrics,

    fitnessHistory,

    improvements,

    taskCount:
      numTasks,

    vmCount:
      numVMs
  };
}