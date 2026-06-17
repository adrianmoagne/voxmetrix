import { useState, useEffect } from "react";
import { Typography, Button, Spinner } from "@leux/ui";
import { Download, ChevronDown, ChevronUp } from "react-feather";
import { format } from "date-fns";
import { ExperimentService } from "@/api/services/ExperimentService";
import type { ExperimentResult, ExperimentTrial } from "@/api/services/ExperimentService";
import S from "./ExperimentResults.styles";

interface ExperimentResultsProps {
  experimentId: string;
  /** @deprecated Inferred per-trial from result data; kept for backward compat */
  experimentType?: "mos" | "eyetrackingMos" | "textHighlighting";
}

type QuadrantKey = "a" | "b" | "c" | "d";
type TrialType = "mos" | "eyetracking" | "textHighlighting";

const DEFAULT_QUADRANT_METRIC = {
  fixation_time_ms: 0,
  fixation_percentage: 0,
};

const toNumberOrZero = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getResultTrials = (result: ExperimentResult): ExperimentTrial[] => result.trials ?? [];

const getQuadrantMetric = (
  trial: ExperimentTrial,
  key: QuadrantKey
) => {
  const metric = trial.quadrant_metrics?.[key];
  return {
    fixation_time_ms: toNumberOrZero(
      metric?.fixation_time_ms ?? DEFAULT_QUADRANT_METRIC.fixation_time_ms
    ),
    fixation_percentage: toNumberOrZero(
      metric?.fixation_percentage ?? DEFAULT_QUADRANT_METRIC.fixation_percentage
    ),
  };
};

const getTargetMetric = (value: unknown): number => toNumberOrZero(value);

interface HighlightItem {
  start: number;
  end: number;
  text: string;
}

const getHighlights = (response: unknown): HighlightItem[] => {
  if (response && typeof response === "object" && "highlights" in response) {
    const highlights = (response as { highlights?: unknown }).highlights;
    return Array.isArray(highlights) ? (highlights as HighlightItem[]) : [];
  }
  return [];
};

/** Infer trial type from its data shape */
const inferTrialType = (trial: ExperimentTrial): TrialType => {
  // Check for text highlighting response
  if (
    trial.response &&
    typeof trial.response === "object" &&
    "highlights" in trial.response
  ) {
    return "textHighlighting";
  }
  // Check for eye tracking data (targets or quadrant_metrics)
  if (
    (trial.targets && trial.targets.length > 0) ||
    trial.quadrant_metrics
  ) {
    return "eyetracking";
  }
  // Default: MOS / simple rating
  return "mos";
};

/** Determine dominant trial type for summary columns */
const inferDominantType = (results: ExperimentResult[]): TrialType => {
  const counts: Record<TrialType, number> = { mos: 0, eyetracking: 0, textHighlighting: 0 };
  for (const r of results) {
    for (const t of getResultTrials(r)) {
      counts[inferTrialType(t)]++;
    }
  }
  if (counts.textHighlighting > 0) return "textHighlighting";
  if (counts.eyetracking > 0) return "eyetracking";
  return "mos";
};

const ExperimentResults: React.FC<ExperimentResultsProps> = ({
  experimentId,
}) => {
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await ExperimentService.fetchResults(experimentId);
        setResults(response.data.data || []);
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [experimentId]);

  const dominantType = inferDominantType(results);

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `experiment_${experimentId}_results.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (results.length === 0) return;

    // Build CSV per-trial using inferred type
    let csvContent =
      "Participant,Trial Type,Screen ID,Audio ID,Response,Response Time (ms),Highlights Count,Highlighted Text,Target,Fixation %,Fixation Time (ms),Trial Time (ms),Quad A Time (ms),Quad A %,Quad B Time (ms),Quad B %,Quad C Time (ms),Quad C %,Quad D Time (ms),Quad D %\n";

    results.forEach((result) => {
      getResultTrials(result).forEach((trial) => {
        const participantName = result.participantEmail || result.participantName || "Anonymous";
        const trialType = inferTrialType(trial);

        if (trialType === "textHighlighting") {
          const highlights = getHighlights(trial.response);
          const highlightedText = highlights.map((h) => `[${h.start}-${h.end}]: "${h.text}"`).join("; ");
          csvContent += `"${participantName}","textHighlighting","${trial.screen_id}","${trial.audio_id || ""}","",${trial.rt || ""},${highlights.length},"${highlightedText}","","","","","","","","","","","",""\n`;
        } else if (trialType === "eyetracking") {
          const quadA = getQuadrantMetric(trial, "a");
          const quadB = getQuadrantMetric(trial, "b");
          const quadC = getQuadrantMetric(trial, "c");
          const quadD = getQuadrantMetric(trial, "d");

          if (trial.targets && trial.targets.length > 0) {
            trial.targets.forEach((target) => {
              const fixPct = getTargetMetric(target.fixation_percentage);
              const fixTime = getTargetMetric(target.fixation_time_ms);
              const totalTime = getTargetMetric(target.total_trial_time_ms);
              csvContent += `"${participantName}","eyetracking","${trial.screen_id}","${trial.audio_id || ""}","${trial.response || ""}",${trial.rt || ""},"","","${target.selector}",${fixPct},${fixTime},${totalTime},${quadA.fixation_time_ms},${quadA.fixation_percentage},${quadB.fixation_time_ms},${quadB.fixation_percentage},${quadC.fixation_time_ms},${quadC.fixation_percentage},${quadD.fixation_time_ms},${quadD.fixation_percentage}\n`;
            });
          } else {
            csvContent += `"${participantName}","eyetracking","${trial.screen_id}","${trial.audio_id || ""}","${trial.response || ""}",${trial.rt || ""},"","","","","","",${quadA.fixation_time_ms},${quadA.fixation_percentage},${quadB.fixation_time_ms},${quadB.fixation_percentage},${quadC.fixation_time_ms},${quadC.fixation_percentage},${quadD.fixation_time_ms},${quadD.fixation_percentage}\n`;
          }
        } else {
          // MOS
          csvContent += `"${participantName}","mos","${trial.screen_id}","${trial.audio_id || ""}","${trial.response || ""}",${trial.rt || ""},"","","","","","","","","","","","","",""\n`;
        }
      });
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `experiment_${experimentId}_results.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (resultId: string) => {
    setExpandedResult(expandedResult === resultId ? null : resultId);
  };

  const calculateAverageResponse = (result: ExperimentResult) => {
    const trials = getResultTrials(result);
    const numericResponses = trials
      .map((t) => {
        if (typeof t.response === "number") return t.response;
        if (typeof t.response === "string") {
          const match = t.response.match(/^(\d+)/);
          return match ? parseInt(match[1], 10) : null;
        }
        return null;
      })
      .filter((r): r is number => r !== null);

    if (numericResponses.length === 0) return "N/A";
    const avg =
      numericResponses.reduce((a, b) => a + b, 0) / numericResponses.length;
    return avg.toFixed(2);
  };

  const getSummaryLabel = () => {
    if (dominantType === "textHighlighting") return "Avg Highlights";
    if (dominantType === "eyetracking") return "Avg Fixation";
    return "Avg Rating";
  };

  const getSummaryValue = (result: ExperimentResult) => {
    const trials = getResultTrials(result);
    if (dominantType === "textHighlighting") {
      return `${(trials.reduce(
        (acc, t) => acc + getHighlights(t.response).length,
        0
      ) / (trials.length || 1)).toFixed(1)}`;
    }
    if (dominantType === "eyetracking") {
      return `${(trials.reduce(
        (acc, t) =>
          acc +
          (t.targets?.reduce(
            (a, tgt) => a + getTargetMetric(tgt.fixation_percentage),
            0
          ) || 0) /
          (t.targets?.length || 1),
        0
      ) / trials.length || 0).toFixed(1)}%`;
    }
    return calculateAverageResponse(result);
  };

  if (loading) {
    return (
      <S.Container>
        <S.EmptyState>
          <Spinner size="large" />
          <Typography variant="body-1">Loading results...</Typography>
        </S.EmptyState>
      </S.Container>
    );
  }

  if (error) {
    return (
      <S.Container>
        <S.EmptyState>
          <Typography variant="body-1" textColor="danger">
            {error}
          </Typography>
        </S.EmptyState>
      </S.Container>
    );
  }

  if (results.length === 0) {
    return (
      <S.Container>
        <S.EmptyState>
          <Typography variant="h4" textColor="placeholder">
            No results yet
          </Typography>
          <Typography variant="body-2" textColor="placeholder">
            Results will appear here once participants complete the experiment.
          </Typography>
        </S.EmptyState>
      </S.Container>
    );
  }

  return (
    <S.Container>
      <S.Header>
        <S.Stats>
          <S.StatCard>
            <Typography variant="caption" textColor="placeholder">
              Total Responses
            </Typography>
            <Typography variant="h3">{results.length}</Typography>
          </S.StatCard>
          <S.StatCard>
            <Typography variant="caption" textColor="placeholder">
              Total Trials
            </Typography>
            <Typography variant="h3">
              {results.reduce((acc, r) => acc + getResultTrials(r).length, 0)}
            </Typography>
          </S.StatCard>
        </S.Stats>
        <S.ExportButtons>
          <Button
            colorScheme="secondary"
            variant="outlined"
            onClick={exportToCSV}
          >
            <Download size={16} />
            &nbsp; Export CSV
          </Button>
          <Button
            colorScheme="secondary"
            variant="outlined"
            onClick={exportToJSON}
          >
            <Download size={16} />
            &nbsp; Export JSON
          </Button>
        </S.ExportButtons>
      </S.Header>

      <S.ResultsTable>
        <S.TableHeader>
          <Typography variant="caption" textColor="placeholder">
            Participant
          </Typography>
          <Typography variant="caption" textColor="placeholder">
            Completed At
          </Typography>
          <Typography variant="caption" textColor="placeholder">
            Trials
          </Typography>
          <Typography variant="caption" textColor="placeholder">
            {getSummaryLabel()}
          </Typography>
        </S.TableHeader>

        {results.map((result) => (
          <div key={result._id}>
            <S.TableRow
              clickable
              onClick={() => toggleExpand(result._id)}
            >
              <Typography variant="body-2">
                {result.participantEmail || result.participantName || "Anonymous"}
              </Typography>
              <Typography variant="body-2">
                {format(new Date(result.completedAt), "MMM d, yyyy HH:mm")}
              </Typography>
              <Typography variant="body-2">{getResultTrials(result).length}</Typography>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Typography variant="body-2">
                  {getSummaryValue(result)}
                </Typography>
                {expandedResult === result._id ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
            </S.TableRow>

            {expandedResult === result._id && (
              <S.TrialsSection style={{ padding: "0 24px 16px" }}>
                {getResultTrials(result).map((trial, idx) => {
                  const trialType = inferTrialType(trial);
                  return (
                    <S.TrialCard key={idx}>
                      <S.TrialHeader>
                        <Typography variant="caption">
                          Trial {trial.trial_index + 1} - Screen: {trial.screen_id?.slice(-6) || "N/A"}
                        </Typography>
                        {trial.rt && (
                          <Typography variant="caption" textColor="placeholder">
                            RT: {trial.rt}ms
                          </Typography>
                        )}
                      </S.TrialHeader>

                      {trialType === "textHighlighting" ? (
                        <>
                          <Typography variant="body-2">
                            Highlights: {getHighlights(trial.response).length}
                          </Typography>
                          {getHighlights(trial.response).length > 0 && (
                            <S.GazeStats>
                              {getHighlights(trial.response).map((h, hIdx) => (
                                <S.GazeStat key={hIdx}>
                                  <Typography variant="caption" textColor="placeholder">
                                    [{h.start}-{h.end}]
                                  </Typography>
                                  <Typography variant="body-2">
                                    "{h.text}"
                                  </Typography>
                                </S.GazeStat>
                              ))}
                            </S.GazeStats>
                          )}
                        </>
                      ) : trialType === "eyetracking" ? (
                        <>
                          <Typography variant="body-2">
                            Response: {trial.response != null ? String(trial.response) : "N/A"}
                          </Typography>
                          {trial.targets && trial.targets.length > 0 && (
                            <S.GazeStats>
                              {trial.targets.map((target, tIdx) => (
                                <S.GazeStat key={tIdx}>
                                  <Typography variant="caption" textColor="placeholder">
                                    {target.selector}
                                  </Typography>
                                  <Typography variant="body-2">
                                    {getTargetMetric(target.fixation_percentage).toFixed(1)}% fixation
                                  </Typography>
                                  <Typography variant="caption" textColor="placeholder">
                                    {getTargetMetric(target.fixation_time_ms)}ms /{" "}
                                    {getTargetMetric(target.total_trial_time_ms)}ms
                                  </Typography>
                                </S.GazeStat>
                              ))}
                            </S.GazeStats>
                          )}
                          <S.GazeStats>
                            {([
                              ["a", "A (top-left)"],
                              ["b", "B (top-right)"],
                              ["c", "C (bottom-left)"],
                              ["d", "D (bottom-right)"],
                            ] as [QuadrantKey, string][]).map(([quadrantKey, label]) => {
                              const metric = getQuadrantMetric(trial, quadrantKey);
                              return (
                                <S.GazeStat key={`quadrant-${quadrantKey}`}>
                                  <Typography variant="caption" textColor="placeholder">
                                    Quadrant {label}
                                  </Typography>
                                  <Typography variant="body-2">
                                    {metric.fixation_percentage.toFixed(1)}% fixation
                                  </Typography>
                                  <Typography variant="caption" textColor="placeholder">
                                    {metric.fixation_time_ms}ms
                                  </Typography>
                                </S.GazeStat>
                              );
                            })}
                          </S.GazeStats>
                        </>
                      ) : (
                        <Typography variant="body-1">
                          Response: <strong>{trial.response != null ? String(trial.response) : "N/A"}</strong>
                        </Typography>
                      )}
                    </S.TrialCard>
                  );
                })}
              </S.TrialsSection>
            )}
          </div>
        ))}
      </S.ResultsTable>
    </S.Container>
  );
};

export default ExperimentResults;
