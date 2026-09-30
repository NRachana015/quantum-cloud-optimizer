import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings,
  FileText,
  Shuffle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useSimContext,
} from '@/context/SimulationContext';

import {
  DEFAULT_SEED,
  type SimConfig,
} from '@/lib/simulation';

type SliderKey = Exclude<
  keyof SimConfig,
  'energyModel' | 'seed'
>;

interface SliderConfig {
  key: SliderKey;
  label: string;
  min: number;
  max: number;
  step: number;
  group: 'qiea' | 'dc';
}

const MAX_SEED =
  4294967295;

export default function ConfigPage() {

  const nav =
    useNavigate();

  const {
    parsedData,
    config,
    setConfig,
  } =
    useSimContext();

  if (!parsedData) {

    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">

        <div className="text-center">

          <p className="text-muted-foreground mb-4">
            No file uploaded yet.
          </p>

          <Button
            onClick={() =>
              nav('/upload')
            }
          >
            Upload File
          </Button>

        </div>

      </div>
    );
  }

  const update =
    <K extends keyof SimConfig>(
      key: K,
      value: SimConfig[K]
    ) => {

      setConfig({
        ...config,
        [key]: value,
      });
    };

  const sliders:
    SliderConfig[] = [
      {
        key: 'populationSize',
        label: 'Population Size',
        min: 10,
        max: 200,
        step: 1,
        group: 'qiea',
      },

      {
        key: 'generations',
        label: 'Number of Generations',
        min: 10,
        max: 500,
        step: 1,
        group: 'qiea',
      },

      {
        key: 'mutationRate',
        label: 'Mutation Rate',
        min: 0.01,
        max: 0.5,
        step: 0.01,
        group: 'qiea',
      },

      {
        key: 'crossoverProb',
        label: 'Crossover Probability',
        min: 0.1,
        max: 1.0,
        step: 0.05,
        group: 'qiea',
      },

      {
        key: 'rotationAngle',
        label: 'Rotation Angle',
        min: 0.01,
        max: 0.1,
        step: 0.005,
        group: 'qiea',
      },

      {
        key: 'numVMs',
        label: 'Number of VMs',
        min: 1,
        max: 50,
        step: 1,
        group: 'dc',
      },

      {
        key: 'vmMIPS',
        label: 'VM Processing Power (MIPS)',
        min: 100,
        max: 5000,
        step: 50,
        group: 'dc',
      },
    ];

  const qieaSliders =
    sliders.filter(
      slider =>
        slider.group ===
        'qiea'
    );

  const dataCenterSliders =
    sliders.filter(
      slider =>
        slider.group ===
        'dc'
    );

  const currentSeed =
    Number.isFinite(
      config.seed
    )
      ? Math.trunc(
          config.seed as number
        )
      : DEFAULT_SEED;

  const handleSeedChange = (
    value: string
  ) => {

    if (
      value.trim() === ''
    ) {

      update(
        'seed',
        DEFAULT_SEED
      );

      return;
    }

    const parsed =
      Number(value);

    if (
      !Number.isFinite(parsed)
    ) {
      return;
    }

    const safeSeed =
      Math.min(
        MAX_SEED,
        Math.max(
          0,
          Math.trunc(
            parsed
          )
        )
      );

    update(
      'seed',
      safeSeed
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-12">

      <div className="container mx-auto px-4 max-w-3xl">

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

          <div className="flex items-center gap-3 mb-2">

            <Settings
              className="w-7 h-7 text-primary"
            />

            <h1 className="text-3xl font-bold">
              Configuration
            </h1>

          </div>

          <p className="text-muted-foreground mb-6">
            Tune the QIEA algorithm and
            data center parameters.
          </p>

          <div
            className="
              flex
              items-center
              gap-2
              mb-8
              p-3
              rounded-lg
              bg-secondary/50
              border
              border-border
            "
          >

            <FileText
              className="w-4 h-4 text-primary"
            />

            <span className="text-sm font-medium">
              {parsedData.filename}
            </span>

            <Badge
              variant="secondary"
              className="ml-auto"
            >
              {parsedData.rows.length} tasks
            </Badge>

            <Badge variant="secondary">
              {parsedData.headers.length} params
            </Badge>

          </div>

          {/* ================================================== */}
          {/* QIEA PARAMETERS */}
          {/* ================================================== */}

          <div className="mb-8">

            <h2
              className="
                text-lg
                font-semibold
                mb-4
                text-primary
              "
            >
              QIEA Algorithm Parameters
            </h2>

            <div className="space-y-6">

              {qieaSliders.map(
                slider => (

                  <SliderField
                    key={slider.key}
                    label={slider.label}
                    value={
                      config[
                        slider.key
                      ]
                    }
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    onChange={
                      value =>
                        update(
                          slider.key,
                          value
                        )
                    }
                  />

                )
              )}

            </div>

          </div>

          {/* ================================================== */}
          {/* DATA CENTER PARAMETERS */}
          {/* ================================================== */}

          <div className="mb-8">

            <h2
              className="
                text-lg
                font-semibold
                mb-4
                text-primary
              "
            >
              Data Center Parameters
            </h2>

            <div className="space-y-6">

              {dataCenterSliders.map(
                slider => (

                  <SliderField
                    key={slider.key}
                    label={slider.label}
                    value={
                      config[
                        slider.key
                      ]
                    }
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    onChange={
                      value =>
                        update(
                          slider.key,
                          value
                        )
                    }
                  />

                )
              )}

              <div>

                <Label
                  className="
                    text-sm
                    font-medium
                    text-muted-foreground
                    mb-2
                    block
                  "
                >
                  Energy Model
                </Label>

                <Select
                  value={
                    config.energyModel
                  }
                  onValueChange={
                    value => {

                      if (
                        value ===
                          'Linear' ||
                        value ===
                          'Square' ||
                        value ===
                          'Cubic'
                      ) {

                        update(
                          'energyModel',
                          value
                        );
                      }

                    }
                  }
                >

                  <SelectTrigger
                    className="
                      bg-secondary/50
                    "
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="Linear">
                      Linear
                    </SelectItem>

                    <SelectItem value="Cubic">
                      Cubic
                    </SelectItem>

                    <SelectItem value="Square">
                      Square
                    </SelectItem>

                  </SelectContent>

                </Select>

              </div>

            </div>

          </div>

          {/* ================================================== */}
          {/* REPRODUCIBILITY */}
          {/* ================================================== */}

          <div className="mb-8">

            <h2
              className="
                text-lg
                font-semibold
                mb-2
                text-primary
              "
            >
              Reproducibility
            </h2>

            <p className="text-sm text-muted-foreground mb-4">
              Use a fixed random seed to reproduce the same
              QIEA experiment with the same dataset and
              configuration.
            </p>

            <div
              className="
                rounded-xl
                border
                border-border
                bg-secondary/30
                p-5
              "
            >

              <div className="flex items-center gap-3 mb-3">

                <Shuffle
                  className="w-5 h-5 text-primary"
                />

                <Label
                  htmlFor="random-seed"
                  className="text-sm font-medium"
                >
                  Random Seed
                </Label>

              </div>

              <input
                id="random-seed"
                type="number"
                min={0}
                max={MAX_SEED}
                step={1}
                value={currentSeed}
                onChange={event =>
                  handleSeedChange(
                    event.target.value
                  )
                }
                className="
                  w-full
                  h-11
                  rounded-md
                  border
                  border-border
                  bg-background
                  px-3
                  font-mono
                  text-sm
                  outline-none
                  focus:ring-2
                  focus:ring-primary/40
                  focus:border-primary
                "
              />

              <p className="text-xs text-muted-foreground mt-2">
                Benchmark runs use this base seed with a
                different offset for each independent run.
              </p>

            </div>

          </div>

          <Button
            className="
              w-full
              glow-primary
            "
            size="lg"
            onClick={() =>
              nav('/simulation')
            }
          >
            Run Simulation
          </Button>

        </motion.div>

      </div>

    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (
    value: number
  ) => void;
}) {

  const formattedValue =
    step < 1
      ? value.toFixed(
          step < 0.01
            ? 3
            : 2
        )
      : value;

  return (
    <div>

      <div
        className="
          flex
          justify-between
          mb-2
        "
      >

        <Label
          className="
            text-sm
            font-medium
            text-muted-foreground
          "
        >
          {label}
        </Label>

        <span
          className="
            text-sm
            font-mono
            text-primary
          "
        >
          {formattedValue}
        </span>

      </div>

      <Slider
        min={min}
        max={max}
        step={step}
        value={[
          value
        ]}
        onValueChange={
          values => {

            const nextValue =
              values[0];

            if (
              typeof nextValue ===
              'number'
            ) {

              onChange(
                nextValue
              );
            }

          }
        }
        className="w-full"
      />

    </div>
  );
}