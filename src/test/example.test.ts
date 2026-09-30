import { describe, expect, it } from "vitest";
import { parseFile } from "@/lib/fileParser";
import { runSimulation, type SimConfig } from "@/lib/simulation";

const sampleCsv = `task_id,length,deadline
1,100,1
2,200,2
3,150,2
4,300,3
5,250,4
6,180,3
7,220,4
8,120,2`;

const baseConfig: SimConfig = {
  populationSize: 6,
  generations: 4,
  mutationRate: 0.05,
  crossoverProb: 0.8,
  rotationAngle: 0.05,
  numVMs: 3,
  vmMIPS: 1000,
  energyModel: "Linear",
};

describe("fileParser", () => {
  it("parses a valid CSV dataset", () => {
    const result = parseFile(sampleCsv, "sample.csv");

    expect(result.filename).toBe("sample.csv");
    expect(result.headers).toEqual(["task_id", "length", "deadline"]);
    expect(result.rows).toHaveLength(8);
    expect(result.rows[0].length).toBe(100);
    expect(result.rows[0].deadline).toBe(1);
  });

  it("rejects a dataset with fewer than five data rows", () => {
    const invalidCsv = `task_id,length
1,100
2,200
3,300
4,400`;

    expect(() => parseFile(invalidCsv, "invalid.csv")).toThrow(
      "at least 5 data rows"
    );
  });

  it("rejects a dataset with fewer than two columns", () => {
    const invalidCsv = `task_id
1
2
3
4
5`;

    expect(() => parseFile(invalidCsv, "invalid.csv")).toThrow(
      "at least 2 columns"
    );
  });
});

describe("runSimulation", () => {
  it("produces Traditional and QIEA results", async () => {
    const data = parseFile(sampleCsv, "sample.csv");

    const result = await runSimulation(
      data,
      baseConfig,
      () => {}
    );

    expect(result.taskCount).toBe(8);
    expect(result.vmCount).toBe(3);

    expect(Number.isFinite(result.traditional.energy)).toBe(true);
    expect(Number.isFinite(result.traditional.time)).toBe(true);
    expect(Number.isFinite(result.traditional.utilization)).toBe(true);
    expect(Number.isFinite(result.traditional.efficiency)).toBe(true);
    expect(Number.isFinite(result.traditional.cost)).toBe(true);

    expect(Number.isFinite(result.qiea.energy)).toBe(true);
    expect(Number.isFinite(result.qiea.time)).toBe(true);
    expect(Number.isFinite(result.qiea.utilization)).toBe(true);
    expect(Number.isFinite(result.qiea.efficiency)).toBe(true);
    expect(Number.isFinite(result.qiea.cost)).toBe(true);
  });

  it("records one fitness value for every generation", async () => {
    const data = parseFile(sampleCsv, "sample.csv");

    const result = await runSimulation(
      data,
      {
        ...baseConfig,
        generations: 5,
      },
      () => {}
    );

    expect(result.fitnessHistory).toHaveLength(5);

    for (const fitness of result.fitnessHistory) {
      expect(Number.isFinite(fitness)).toBe(true);
      expect(fitness).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns valid improvement metrics", async () => {
    const data = parseFile(sampleCsv, "sample.csv");

    const result = await runSimulation(
      data,
      baseConfig,
      () => {}
    );

    expect(Number.isFinite(result.improvements.energy)).toBe(true);
    expect(Number.isFinite(result.improvements.time)).toBe(true);
    expect(Number.isFinite(result.improvements.utilization)).toBe(true);
    expect(Number.isFinite(result.improvements.efficiency)).toBe(true);
    expect(Number.isFinite(result.improvements.cost)).toBe(true);
  });

  it("keeps the configured VM count valid", async () => {
    const data = parseFile(sampleCsv, "sample.csv");

    for (const vmCount of [1, 3, 5]) {
      const result = await runSimulation(
        data,
        {
          ...baseConfig,
          numVMs: vmCount,
        },
        () => {}
      );

      expect(result.vmCount).toBe(vmCount);
      expect(result.taskCount).toBe(8);
    }
  });

  it("supports all implemented energy models", async () => {
    const data = parseFile(sampleCsv, "sample.csv");

    for (const energyModel of ["Linear", "Square", "Cubic"] as const) {
      const result = await runSimulation(
        data,
        {
          ...baseConfig,
          energyModel,
        },
        () => {}
      );

      expect(Number.isFinite(result.traditional.energy)).toBe(true);
      expect(Number.isFinite(result.qiea.energy)).toBe(true);
    }
  });
});
 it(
    'produces reproducible results with the same random seed',
    async () => {

      const data = {
        headers: [
          'task_id',
          'length',
          'deadline',
        ],

        rows: [
          {
            task_id: 1,
            length: 120,
            deadline: 1,
          },
          {
            task_id: 2,
            length: 250,
            deadline: 1,
          },
          {
            task_id: 3,
            length: 180,
            deadline: 1,
          },
          {
            task_id: 4,
            length: 300,
            deadline: 1,
          },
          {
            task_id: 5,
            length: 160,
            deadline: 1,
          },
          {
            task_id: 6,
            length: 220,
            deadline: 1,
          },
        ],

        filename:
          'reproducibility-test.csv',
      };

      const config = {
        populationSize: 10,
        generations: 10,
        mutationRate: 0.05,
        crossoverProb: 0.8,
        rotationAngle: 0.05,
        numVMs: 3,
        vmMIPS: 1000,
        energyModel: 'Linear' as const,
        seed: 12345,
      };

      const first =
        await runSimulation(
          data,
          config,
          () => undefined
        );

      const second =
        await runSimulation(
          data,
          config,
          () => undefined
        );

      expect(second).toEqual(
        first
      );
    }
  );

