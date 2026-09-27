import { motion } from 'framer-motion';
import { Cpu, Server, GitBranch, Target } from 'lucide-react';

const sections = [
  {
    icon: Server,
    title: 'What is Cloud Resource Allocation?',
    content: `Cloud data centers host thousands of virtual machines (VMs) that execute user tasks. Resource allocation is the process of mapping incoming tasks to available VMs to optimize performance metrics like energy consumption, execution time, and resource utilization. Poor scheduling leads to energy waste, SLA violations, and underutilized infrastructure.`,
  },
  {
    icon: Cpu,
    title: 'What is QIEA and How It Works',
    content: `The Quantum-Inspired Evolutionary Algorithm (QIEA) is a meta-heuristic optimization algorithm that borrows concepts from quantum computing to solve combinatorial optimization problems.`,
    bullets: [
      'Qubit Representation: Each solution gene is represented as a qubit [α, β] where α² + β² = 1, encoding a superposition of states.',
      'Population of Solutions: A population of individuals, each representing a complete task-to-VM mapping, evolves over generations.',
      'Rotation Gate Evolution: Quantum rotation gates adjust qubit amplitudes based on fitness, guiding the population toward better solutions.',
      'Convergence: Over generations, qubits collapse toward optimal states, producing near-optimal task-to-VM mappings that minimize energy and makespan.',
    ],
  },
  {
    icon: GitBranch,
    title: 'Traditional vs QIEA Scheduling',
    content: `Traditional approaches like First-Come-First-Served (FCFS) and Round-Robin assign tasks without considering workload balance or energy implications. They are fast but produce suboptimal results. QIEA explores the solution space more intelligently, finding allocations that balance load across VMs, reduce energy consumption, and minimize makespan — all while maintaining computational efficiency.`,
  },
  {
    icon: Target,
    title: 'Project Goals & Target Users',
    content: `This tool is designed for cloud computing researchers, data center administrators, and students studying optimization algorithms. It provides a hands-on simulation environment to compare traditional scheduling against QIEA-optimized scheduling using real task datasets. Users can upload their own data, configure algorithm parameters, and visualize the performance improvements achieved by quantum-inspired optimization.`,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">About QIEA</h1>
          <p className="text-muted-foreground mb-10">Understanding quantum-inspired optimization for cloud resource allocation.</p>

          <div className="space-y-8">
            {sections.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="gradient-card rounded-xl p-6 border border-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">{s.title}</h2>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-3">{s.content}</p>
                {s.bullets && (
                  <ul className="space-y-2">
                    {s.bullets.map((b, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-primary mt-1 shrink-0">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
