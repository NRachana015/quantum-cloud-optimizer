import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, BarChart3, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const benefits = [
  { icon: Zap, title: 'Reduce Energy Consumption', desc: 'Optimize VM allocation to minimize power usage across data centers.' },
  { icon: BarChart3, title: 'Improve Resource Utilization', desc: 'Maximize VM efficiency with quantum-inspired task scheduling.' },
  { icon: Clock, title: 'Faster Task Completion', desc: 'Reduce makespan through intelligent workload distribution.' },
];

export default function HomePage() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen pt-16">
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-accent/20 blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 py-24 md:py-36 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 mb-6">
              Quantum-Inspired Optimization
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
              Cloud Resource Allocation
              <br />
              <span className="text-primary glow-text">Optimization</span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-lg mb-10">
              Cloud data centers waste significant energy and time due to poor task scheduling.
              QIEA uses quantum computing principles to find near-optimal task-to-VM mappings,
              dramatically reducing energy consumption and improving performance.
            </p>
            <Button
              size="lg"
              className="glow-primary text-lg px-8 py-6 font-semibold"
              onClick={() => nav('/upload')}
            >
              Start Simulation <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="gradient-card rounded-xl p-8 border border-border hover:border-primary/30 transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:glow-primary-sm transition-shadow">
                <b.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{b.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
