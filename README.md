# ⚛️ Quantum Cloud Optimizer

### Quantum-Inspired Evolutionary Optimization for Cloud Task Scheduling

A web-based simulation platform that compares **Traditional Round-Robin scheduling** with a **Quantum-Inspired Evolutionary Algorithm (QIEA)** for cloud task scheduling.

The system evaluates scheduling performance using multiple objectives including:

- ⚡ Energy Consumption
- ⏱️ Execution Time
- 📊 Resource Utilization
- ✅ Scheduling Efficiency
- 💰 Estimated Cost

The application provides an interactive workflow for uploading workloads, configuring optimization parameters, running simulations, benchmarking multiple QIEA runs, and analyzing scheduling performance through tables and visualizations.

> **Important:** QIEA in this project is a **quantum-inspired computational simulation**. It does not run on a physical quantum computer or quantum hardware.

---

## 🌐 Project

**GitHub Repository**

https://github.com/NRachana015/quantum-cloud-optimizer

---

## 🎯 Problem Statement

Cloud computing environments must efficiently distribute workloads across available Virtual Machines (VMs).

A scheduling strategy that does not consider workload characteristics and system objectives can lead to:

- Higher energy consumption
- Longer execution time
- Uneven resource utilization
- Missed deadlines
- Increased operating cost

Traditional scheduling methods such as **Round-Robin** are simple and deterministic, but they do not explicitly search for an allocation that balances several competing objectives simultaneously.

This project explores whether a **quantum-inspired evolutionary optimization approach** can produce improved scheduling solutions under a simulated cloud environment.

---

## 💡 Proposed Solution

The Quantum Cloud Optimizer models cloud task scheduling as an optimization problem.

The application generates candidate task-to-VM assignments and evaluates them using a multi-objective fitness function.

The QIEA process repeatedly improves candidate schedules using:

1. Quantum-inspired population representation
2. Fitness evaluation
3. Selection of promising solutions
4. Crossover
5. Mutation
6. Quantum-inspired rotation
7. Iterative optimization across generations

The final QIEA schedule is compared with a Traditional Round-Robin baseline.

---

# 🧠 Core Concept: QIEA

## What is QIEA?

A **Quantum-Inspired Evolutionary Algorithm (QIEA)** combines ideas from:

- Evolutionary optimization
- Probabilistic representation
- Quantum-inspired state modeling

Instead of using real quantum hardware, the algorithm uses mathematical representations inspired by quantum states to maintain probabilistic candidate solutions.

A simplified quantum-style representation can be expressed as:

```text
|ψ⟩ = α|0⟩ + β|1⟩