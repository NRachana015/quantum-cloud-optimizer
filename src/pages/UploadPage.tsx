import {
  useCallback,
  useState,
  type DragEvent,
} from 'react';

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { useSimContext } from '@/context/SimulationContext';
import { parseFile } from '@/lib/fileParser';
import type { ParsedData } from '@/lib/fileParser';

export default function UploadPage() {
  const nav = useNavigate();

  const { setParsedData } =
    useSimContext();

  const [data, setData] =
    useState<ParsedData | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [dragging, setDragging] =
    useState(false);

  // ==========================================================
  // FILE HANDLER
  // ==========================================================

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      setData(null);

      // Only TXT files are accepted.
      if (
        !file.name
          .toLowerCase()
          .endsWith('.txt')
      ) {
        setError(
          'Only .txt files are accepted.'
        );
        return;
      }

      const reader =
        new FileReader();

      reader.onload = (
        event
      ) => {
        try {
          const result =
            event.target?.result;

          // FileReader should return a string
          // because readAsText() is used.
          if (
            typeof result !== 'string'
          ) {
            throw new Error(
              'Unable to read the uploaded file.'
            );
          }

          const parsed =
            parseFile(
              result,
              file.name
            );

          setData(parsed);
          setParsedData(parsed);

        } catch (
          err: unknown
        ) {
          if (
            err instanceof Error
          ) {
            setError(
              err.message ||
                'Failed to parse file.'
            );
          } else {
            setError(
              'Failed to parse file.'
            );
          }
        }
      };

      reader.onerror = () => {
        setError(
          'Failed to read the uploaded file.'
        );
      };

      reader.readAsText(file);
    },
    [setParsedData]
  );

  // ==========================================================
  // DRAG AND DROP
  // ==========================================================

  const onDrop = useCallback(
    (
      event: DragEvent<HTMLDivElement>
    ) => {
      event.preventDefault();

      setDragging(false);

      const file =
        event.dataTransfer.files[0];

      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  // ==========================================================
  // BROWSE FILE
  // ==========================================================

  const onBrowse = () => {
    const input =
      document.createElement('input');

    input.type = 'file';
    input.accept = '.txt';

    input.onchange = (
      event: Event
    ) => {
      const target =
        event.target as
          | HTMLInputElement
          | null;

      const file =
        target?.files?.[0];

      if (file) {
        handleFile(file);
      }
    };

    input.click();
  };

  // ==========================================================
  // UI
  // ==========================================================

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

          {/* --------------------------------------------------
              HEADER
          -------------------------------------------------- */}

          <h1 className="text-3xl font-bold mb-2">
            Upload Task Data
          </h1>

          <p className="text-muted-foreground mb-8">
            Upload a .txt file containing
            your cloud task scheduling data.
          </p>

          {/* --------------------------------------------------
              DROP ZONE
          -------------------------------------------------- */}

          <div
            onDragOver={(
              event: DragEvent<HTMLDivElement>
            ) => {
              event.preventDefault();
              setDragging(true);
            }}

            onDragLeave={() =>
              setDragging(false)
            }

            onDrop={onDrop}

            onClick={onBrowse}

            className={`
              relative
              border-2
              border-dashed
              rounded-xl
              p-12
              text-center
              transition-colors
              cursor-pointer

              ${
                dragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground'
              }
            `}
          >

            <Upload
              className="
                w-12 h-12
                mx-auto mb-4
                text-muted-foreground
              "
            />

            <p className="text-foreground font-medium mb-1">
              Drag & drop your .txt file here
            </p>

            <p className="text-muted-foreground text-sm mb-4">
              or click to browse
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={(
                event
              ) => {
                event.stopPropagation();
                onBrowse();
              }}
            >
              Browse File
            </Button>

          </div>

          {/* --------------------------------------------------
              ERROR
          -------------------------------------------------- */}

          {error && (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              className="
                mt-6
                p-4
                rounded-lg
                bg-destructive/10
                border
                border-destructive/30
                flex
                items-start
                gap-3
              "
            >

              <AlertCircle
                className="
                  w-5 h-5
                  text-destructive
                  mt-0.5
                  shrink-0
                "
              />

              <p className="text-sm text-destructive">
                {error}
              </p>

            </motion.div>
          )}

          {/* --------------------------------------------------
              SUCCESS / PREVIEW
          -------------------------------------------------- */}

          {data && (
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="
                mt-8
                space-y-6
              "
            >

              {/* FILE INFORMATION */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                  p-4
                  rounded-lg
                  bg-success/10
                  border
                  border-success/30
                "
              >

                <CheckCircle2
                  className="
                    w-5 h-5
                    text-success
                    shrink-0
                  "
                />

                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    gap-2
                    text-sm
                  "
                >

                  <FileText
                    className="
                      w-4 h-4
                      text-success
                    "
                  />

                  <span className="font-medium">
                    {data.filename}
                  </span>

                </div>

              </div>

              {/* SUMMARY */}

              <div
                className="
                  grid
                  grid-cols-2
                  gap-4
                "
              >

                <div
                  className="
                    gradient-card
                    rounded-lg
                    p-4
                    border
                    border-border
                  "
                >

                  <p className="text-2xl font-bold text-primary">
                    {data.rows.length}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Tasks detected
                  </p>

                </div>

                <div
                  className="
                    gradient-card
                    rounded-lg
                    p-4
                    border
                    border-border
                  "
                >

                  <p className="text-2xl font-bold text-primary">
                    {data.headers.length}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Parameters detected
                  </p>

                </div>

              </div>

              {/* COLUMN BADGES */}

              <div className="flex flex-wrap gap-2">

                {data.headers.map(
                  header => (
                    <Badge
                      key={header}
                      variant="secondary"
                      className="
                        font-mono
                        text-xs
                      "
                    >
                      {header}
                    </Badge>
                  )
                )}

              </div>

              {/* PREVIEW TABLE */}

              <div
                className="
                  rounded-lg
                  border
                  border-border
                  overflow-auto
                "
              >

                <table className="w-full text-sm">

                  <thead>

                    <tr className="bg-secondary/50">

                      {data.headers.map(
                        header => (
                          <th
                            key={header}
                            className="
                              px-3
                              py-2
                              text-left
                              font-medium
                              text-muted-foreground
                              whitespace-nowrap
                            "
                          >
                            {header}
                          </th>
                        )
                      )}

                    </tr>

                  </thead>

                  <tbody>

                    {data.rows
                      .slice(0, 10)
                      .map(
                        (
                          row,
                          rowIndex
                        ) => (

                          <tr
                            key={rowIndex}
                            className="
                              border-t
                              border-border
                              hover:bg-secondary/20
                            "
                          >

                            {data.headers.map(
                              header => (
                                <td
                                  key={header}
                                  className="
                                    px-3
                                    py-2
                                    font-mono
                                    text-xs
                                    whitespace-nowrap
                                  "
                                >
                                  {row[header]}
                                </td>
                              )
                            )}

                          </tr>

                        )
                      )}

                  </tbody>

                </table>

                {data.rows.length > 10 && (
                  <p
                    className="
                      px-3
                      py-2
                      text-xs
                      text-muted-foreground
                      border-t
                      border-border
                    "
                  >
                    Showing 10 of{' '}
                    {data.rows.length}{' '}
                    rows
                  </p>
                )}

              </div>

              {/* CONTINUE */}

              <Button
                className="
                  w-full
                  glow-primary
                "
                size="lg"
                onClick={() =>
                  nav('/configure')
                }
              >
                Continue to Configuration
              </Button>

            </motion.div>
          )}

        </motion.div>

      </div>

    </div>
  );
}