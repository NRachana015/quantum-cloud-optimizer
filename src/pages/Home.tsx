import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Cpu,
  Database,
  Gauge,
  GitCompareArrows,
  Server,
  SlidersHorizontal,
  Target,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

const objectives = [
  {
    icon: Zap,
    title: 'Energy',
    description: 'Estimate and compare workload energy consumption.',
  },
  {
    icon: Clock3,
    title: 'Execution Time',
    description: 'Evaluate simulated task completion time and makespan.',
  },
  {
    icon: BarChart3,
    title: 'Utilization',
    description: 'Measure how effectively available VMs are used.',
  },
  {
    icon: Target,
    title: 'Scheduling Efficiency',
    description: 'Evaluate deadline-oriented scheduling performance.',
  },
  {
    icon: Gauge,
    title: 'Estimated Cost',
    description: 'Compare simplified scheduling cost estimates.',
  },
];

const workflow = [
  {
    number: '01',
    icon: Database,
    title: 'Upload Workload',
    description: 'Provide a task dataset for scheduling analysis.',
  },
  {
    number: '02',
    icon: SlidersHorizontal,
    title: 'Configure',
    description: 'Set evolutionary and cloud simulation parameters.',
  },
  {
    number: '03',
    icon: Cpu,
    title: 'Optimize',
    description: 'Run the quantum-inspired evolutionary simulation.',
  },
  {
    number: '04',
    icon: BarChart3,
    title: 'Analyze',
    description: 'Compare QIEA with the Traditional Round-Robin baseline.',
  },
];

export default function HomePage() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen pt-16 bg-background">
      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden border-b border-border">
        {/* Technical background grid */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(hsl(var(--primary) / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.35) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        {/* Ambient glow */}
        <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-primary/10 blur-[140px] pointer-events-none" />

        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Eyebrow */}
              <div className="flex items-center gap-2 mb-6">
                <div className="h-px w-10 bg-primary" />

                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">
                  Cloud Scheduling Optimization
                </span>
              </div>

              {/* Main heading */}
              <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
                <div>
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.08]">
                    Quantum Cloud
                    <br />
                    <span className="text-primary">
                      Optimizer
                    </span>
                  </h1>

                  <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl leading-8">
                    A browser-based simulation platform for
                    quantum-inspired evolutionary optimization of
                    cloud task scheduling.
                  </p>

                  <p className="mt-4 text-sm text-muted-foreground max-w-2xl leading-6">
                    Compare a Traditional Round-Robin scheduler with
                    a Quantum-Inspired Evolutionary Algorithm (QIEA)
                    across energy, execution time, resource utilization,
                    scheduling efficiency, and estimated cost.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 mt-8">
                    <Button
                      size="lg"
                      className="glow-primary px-7"
                      onClick={() => nav('/upload')}
                    >
                      Launch Simulation
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => nav('/about')}
                    >
                      Explore Methodology
                    </Button>
                  </div>
                </div>

                {/* Technical summary panel */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.15,
                  }}
                  className="rounded-2xl border border-border bg-card/70 backdrop-blur-sm p-6"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Optimization Engine
                      </p>

                      <p className="text-lg font-semibold mt-1">
                        QIEA Simulation
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <InfoBlock
                      label="Baseline"
                      value="Round-Robin"
                    />

                    <InfoBlock
                      label="Search"
                      value="Evolutionary"
                    />

                    <InfoBlock
                      label="Objectives"
                      value="5 Metrics"
                    />

                    <InfoBlock
                      label="Benchmark"
                      value="Multi-Run"
                    />
                  </div>

                  <div className="mt-5 rounded-lg border border-primary/15 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <GitCompareArrows className="w-5 h-5 text-primary mt-0.5" />

                      <div>
                        <p className="text-sm font-semibold">
                          Comparative Evaluation
                        </p>

                        <p className="text-xs text-muted-foreground mt-1 leading-5">
                          Evaluate candidate schedules against a
                          consistent Traditional baseline.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======================================================
          OBJECTIVES
      ====================================================== */}

      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="Evaluation Framework"
            title="Five scheduling objectives"
            description="The optimizer evaluates scheduling behavior across multiple system-level metrics instead of relying on a single objective."
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {objectives.map((objective, index) => {
              const Icon = objective.icon;

              return (
                <motion.div
                  key={objective.title}
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.2,
                  }}
                  transition={{
                    delay: index * 0.05,
                  }}
                  className="group rounded-xl border border-border bg-card/50 p-5 hover:border-primary/40 hover:bg-card transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>

                  <h3 className="font-semibold mb-2">
                    {objective.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-5">
                    {objective.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================
          COMPARISON
      ====================================================== */}

      <section className="border-y border-border bg-card/20">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <SectionHeading
              eyebrow="Scheduling Strategies"
              title="Baseline vs optimization"
              description="The platform provides a direct comparison between deterministic Round-Robin scheduling and quantum-inspired evolutionary search."
              align="center"
            />

            <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              {/* Traditional */}
              <StrategyCard
                title="Traditional Round-Robin"
                label="Baseline"
                icon={Server}
                points={[
                  'Sequential task allocation',
                  'Deterministic scheduling behavior',
                  'Used as the comparison baseline',
                ]}
              />

              {/* QIEA */}
              <StrategyCard
                title="Quantum-Inspired Evolutionary Algorithm"
                label="Optimization"
                icon={Cpu}
                highlighted
                points={[
                  'Probabilistic quantum-inspired states',
                  'Selection, crossover and mutation',
                  'Quantum-inspired rotation updates',
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          WORKFLOW
      ====================================================== */}

      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="Application Workflow"
            title="From workload to analysis"
            description="A four-stage workflow takes the user from task data to an interactive scheduling evaluation."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {workflow.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.number}
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.2,
                  }}
                  transition={{
                    delay: index * 0.08,
                  }}
                  className="relative rounded-xl border border-border bg-card/40 p-6"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-mono text-primary">
                      {step.number}
                    </span>

                    <Icon className="w-5 h-5 text-primary" />
                  </div>

                  <h3 className="font-semibold mb-2">
                    {step.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-5">
                    {step.description}
                  </p>

                  {index < workflow.length - 1 && (
                    <div className="hidden lg:block absolute top-10 -right-3 w-6 h-px bg-border" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================
          CAPABILITY STRIP
      ====================================================== */}

      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <Capability
                icon={Database}
                title="Workload Driven"
                description="Upload task data and evaluate scheduling behavior under configurable simulation settings."
              />

              <Capability
                icon={GitCompareArrows}
                title="Comparative"
                description="Compare QIEA results against a Traditional Round-Robin baseline."
              />

              <Capability
                icon={BarChart3}
                title="Data Driven"
                description="Use benchmark statistics, charts, and VM sensitivity analysis to inspect results."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          FINAL CTA
      ====================================================== */}

      <section className="border-t border-border">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 mb-6">
              <CheckCircle2 className="w-4 h-4 text-primary" />

              <span className="text-xs font-medium text-primary">
                Simulation-ready optimization workflow
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Explore the scheduling optimizer
            </h2>

            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto leading-6">
              Upload a workload, configure the optimizer, run the
              simulation, and inspect the resulting scheduling metrics.
            </p>

            <Button
              size="lg"
              className="glow-primary mt-8 px-8"
              onClick={() => nav('/upload')}
            >
              Start Simulation
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// SECTION HEADING
// ============================================================

function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: 'left' | 'center';
}) {
  const centered = align === 'center';

  return (
    <div
      className={`mb-10 ${
        centered ? 'text-center mx-auto max-w-3xl' : 'max-w-3xl'
      }`}
    >
      <p className="text-xs font-semibold tracking-[0.18em] uppercase text-primary mb-3">
        {eyebrow}
      </p>

      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
        {title}
      </h2>

      <p className="text-sm text-muted-foreground leading-6 mt-3">
        {description}
      </p>
    </div>
  );
}

// ============================================================
// INFO BLOCK
// ============================================================

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="text-sm font-semibold mt-1">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// STRATEGY CARD
// ============================================================

function StrategyCard({
  title,
  label,
  icon: Icon,
  points,
  highlighted = false,
}: {
  title: string;
  label: string;
  icon: typeof Server;
  points: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        highlighted
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-card/40'
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p
            className={`text-[11px] uppercase tracking-wider ${
              highlighted
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          >
            {label}
          </p>

          <h3 className="text-lg font-semibold mt-2 leading-6">
            {title}
          </h3>
        </div>

        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            highlighted
              ? 'bg-primary/15'
              : 'bg-secondary'
          }`}
        >
          <Icon
            className={`w-5 h-5 ${
              highlighted
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          />
        </div>
      </div>

      <div className="space-y-3">
        {points.map((point) => (
          <div
            key={point}
            className="flex items-start gap-3"
          >
            <CheckCircle2
              className={`w-4 h-4 mt-0.5 shrink-0 ${
                highlighted
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            />

            <p className="text-sm text-muted-foreground">
              {point}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// CAPABILITY
// ============================================================

function Capability({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Database;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>

      <div>
        <h3 className="font-semibold">
          {title}
        </h3>

        <p className="text-xs text-muted-foreground leading-5 mt-1">
          {description}
        </p>
      </div>
    </div>
  );
}