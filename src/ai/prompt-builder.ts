export interface WorkspaceArtifact {
  name: string;
  content: string;
}

export interface PromptBuilderInput {
  context: string;
  handoff: string;
  memories: WorkspaceArtifact[];
  records: WorkspaceArtifact[];
  question: string;
}

const MAX_CONTEXT_LENGTH = 6000;
const MAX_HANDOFF_LENGTH = 4000;
const MAX_ARTIFACT_LENGTH = 1500;

const clampText = (value: string, maxLength: number): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Not available.';
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}\n...[truncated]`;
};

const formatArtifacts = (artifacts: WorkspaceArtifact[], emptyState: string): string => {
  if (artifacts.length === 0) {
    return emptyState;
  }

  return artifacts
    .map((artifact) => `### ${artifact.name}\n${clampText(artifact.content, MAX_ARTIFACT_LENGTH)}`)
    .join('\n\n');
};

const splitMemories = (memories: WorkspaceArtifact[]) => {
  const decisions = memories.filter((memory) => {
    const haystack = `${memory.name}\n${memory.content}`.toLowerCase();
    return haystack.includes('decision');
  });

  return {
    decisions,
    recentChanges:
      decisions.length > 0 ? memories.filter((memory) => !decisions.includes(memory)) : memories,
  };
};

export const buildProjectAwarePrompt = (input: PromptBuilderInput): string => {
  const memorySections = splitMemories(input.memories);

  return `PROJECT CONTEXT

Architecture
${clampText(input.context, MAX_CONTEXT_LENGTH)}

Recent Changes
${clampText(input.handoff, MAX_HANDOFF_LENGTH)}

Recent Memory
${formatArtifacts(memorySections.recentChanges, 'No recent memory summaries were found.')}

Decisions
${formatArtifacts(memorySections.decisions, 'No explicit decision records were found in recent memory.')}

Records
${formatArtifacts(input.records, 'No recent records were found.')}

User Question
${input.question.trim()}

Instructions
- Answer using the supplied project context and recent artifacts.
- Be specific about architecture, recent changes, and decisions when the evidence exists.
- If the workspace context is incomplete, say what is missing instead of guessing.
- Keep the answer concise but useful for an engineer working in this repository.`;
};
