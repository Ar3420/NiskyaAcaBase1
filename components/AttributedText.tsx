import Link from "next/link";
import type { Revision } from "@/lib/types";

type Segment = {
  text: string;
  revision?: Revision;
  age: number;
};

export type AutoLinkTarget = {
  title: string;
  href: string;
};

export function AttributedText({
  children,
  revisions,
  field,
  itemTitle,
  linkTargets = [],
  className = "",
}: {
  children: string;
  revisions: Revision[];
  field: string;
  itemTitle?: string;
  linkTargets?: AutoLinkTarget[];
  className?: string;
}) {
  const attribution = findAttributionRevision(revisions, field, children, itemTitle);
  if (!attribution || !children) return <span className={className}>{renderAutoLinkedText(children, linkTargets)}</span>;

  const segments = attributedSegments(revisions, field, children, itemTitle);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (!segment.revision) return <span key={`${segment.text}-${index}`}>{renderAutoLinkedText(segment.text, linkTargets)}</span>;

        const addedColor = attributionColor(segment.revision, segment.age);
        return (
          <span key={`${segment.text}-${index}`} className={`group relative ${addedColor}`}>
            {renderAutoLinkedText(segment.text, linkTargets)}
            <span className="pointer-events-none absolute left-full top-0 z-20 ml-3 hidden w-64 border border-line bg-white p-3 text-xs leading-5 text-ink shadow-lg group-hover:block">
              Added by {segment.revision.editedByDisplayName} ({segment.revision.editedByMemberId}) on{" "}
              {new Date(segment.revision.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.
            </span>
          </span>
        );
      })}
    </span>
  );
}

function renderAutoLinkedText(text: string, linkTargets: AutoLinkTarget[]) {
  const targets = linkTargets
    .filter((target) => target.title.length > 1)
    .sort((a, b) => b.title.length - a.title.length);

  if (targets.length === 0) return text;

  const parts: Array<string | AutoLinkTarget> = [];
  let index = 0;

  while (index < text.length) {
    const match = findNextTarget(text, index, targets);
    if (!match) {
      parts.push(text.slice(index));
      break;
    }

    if (match.start > index) parts.push(text.slice(index, match.start));
    parts.push(match.target);
    index = match.end;
  }

  return parts.map((part, partIndex) => {
    if (typeof part === "string") return <span key={`${part}-${partIndex}`}>{part}</span>;
    return (
      <Link key={`${part.href}-${partIndex}`} href={part.href} className="text-gold underline decoration-gold underline-offset-4">
        {part.title}
      </Link>
    );
  });
}

function findNextTarget(text: string, startIndex: number, targets: AutoLinkTarget[]) {
  let best: { start: number; end: number; target: AutoLinkTarget } | null = null;
  const lowerText = text.toLowerCase();

  for (const target of targets) {
    const lowerTitle = target.title.toLowerCase();
    let searchFrom = startIndex;

    while (searchFrom < text.length) {
      const start = lowerText.indexOf(lowerTitle, searchFrom);
      if (start === -1) break;
      const end = start + target.title.length;

      if (isBoundary(text[start - 1]) && isBoundary(text[end])) {
        if (!best || start < best.start || (start === best.start && target.title.length > best.target.title.length)) {
          best = { start, end, target };
        }
        break;
      }

      searchFrom = start + 1;
    }
  }

  return best;
}

function isBoundary(value: string | undefined) {
  return !value || !/[A-Za-z0-9]/.test(value);
}

function findAttributionRevision(revisions: Revision[], field: string, currentText: string, itemTitle?: string) {
  for (const revision of revisions) {
    const nextText = getComparableText(revision.newSnapshotJson, field, currentText, itemTitle);
    if (nextText !== currentText) continue;

    const previousText = getComparableText(revision.previousSnapshotJson, field, currentText, itemTitle);
    if (previousText !== currentText) return { revision };
  }

  return null;
}

function getComparableText(snapshot: Record<string, unknown> | null | undefined, field: string, currentText: string, itemTitle?: string) {
  if (!snapshot) return "";

  const value = snapshot[field] ?? getMetadataValue(snapshot, field);
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    const item = findStructuredItem(value, currentText, itemTitle);
    if (item) return item.body;
    return value.map((entry) => stringifyValue(entry)).join("\n\n");
  }

  return stringifyValue(value);
}

function getMetadataValue(snapshot: Record<string, unknown>, field: string) {
  const metadata = snapshot.metadata_json;
  if (!metadata || typeof metadata !== "object") return undefined;
  const record = metadata as Record<string, unknown>;
  if (field === "units") return record.units;
  if (field === "subtopics") return record.subtopics;
  return record[field];
}

function findStructuredItem(value: unknown[], currentText: string, itemTitle?: string) {
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const title = typeof record.title === "string" ? record.title : "";
    const body = typeof record.body === "string" ? record.body : "";
    if ((itemTitle && title === itemTitle) || body === currentText) return { title, body };
  }

  return null;
}

function stringifyValue(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "body" in value) {
    const record = value as Record<string, unknown>;
    return typeof record.body === "string" ? record.body : "";
  }
  if (value == null) return "";
  return String(value);
}

function attributedSegments(revisions: Revision[], field: string, currentText: string, itemTitle?: string): Segment[] {
  const tokens = tokenize(currentText);
  const assignments = Array<Revision | undefined>(tokens.length).fill(undefined);
  const relevantRevisions = revisions
    .filter((revision) => {
      const nextText = getComparableText(revision.newSnapshotJson, field, currentText, itemTitle);
      const previousText = getComparableText(revision.previousSnapshotJson, field, currentText, itemTitle);
      return nextText && nextText !== previousText;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  relevantRevisions.forEach((revision) => {
    const previousText = getComparableText(revision.previousSnapshotJson, field, currentText, itemTitle);
    const nextText = getComparableText(revision.newSnapshotJson, field, currentText, itemTitle);
    const addedCurrentIndexes = addedCurrentTokenIndexes(previousText, nextText, currentText);

    addedCurrentIndexes.forEach((index) => {
      if (!assignments[index]) assignments[index] = revision;
    });
  });

  return mergeSegments(tokens.map((text, index) => {
    const revision = assignments[index];
    return {
      text,
      revision,
      age: revision ? relevantRevisions.findIndex((item) => item.id === revision.id) : 0,
    };
  }));
}

function addedCurrentTokenIndexes(previousText: string, nextText: string, currentText: string) {
  const previousTokens = tokenize(previousText);
  const nextTokens = tokenize(nextText);
  const currentTokens = tokenize(currentText);
  const previousWords = previousTokens.map(normalizeToken);
  const nextWords = nextTokens.map(normalizeToken);
  const currentWords = currentTokens.map(normalizeToken);
  const retainedNextIndexes = new Set(longestCommonSubsequencePairs(previousWords, nextWords).map((pair) => pair.right));
  const addedNextIndexes = new Set(nextTokens.map((_, index) => index).filter((index) => !retainedNextIndexes.has(index) && nextWords[index]));
  const nextToCurrent = longestCommonSubsequencePairs(nextWords, currentWords);

  return nextToCurrent
    .filter((pair) => addedNextIndexes.has(pair.left))
    .map((pair) => pair.right);
}

function mergeSegments(segments: Segment[]) {
  const merged: Segment[] = [];

  segments.forEach((segment) => {
    const previous = merged[merged.length - 1];
    if (previous && previous.revision?.id === segment.revision?.id && previous.age === segment.age) {
      previous.text += segment.text;
      return;
    }

    merged.push({ ...segment });
  });

  return merged;
}

function tokenize(value: string) {
  return value.match(/\S+\s*/g) ?? [];
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function longestCommonSubsequencePairs(leftWords: string[], rightWords: string[]) {
  const rows = leftWords.length + 1;
  const cols = rightWords.length + 1;
  const table = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      table[row][col] =
        leftWords[row - 1] === rightWords[col - 1]
          ? table[row - 1][col - 1] + 1
          : Math.max(table[row - 1][col], table[row][col - 1]);
    }
  }

  const pairs: { left: number; right: number }[] = [];
  let row = leftWords.length;
  let col = rightWords.length;

  while (row > 0 && col > 0) {
    if (leftWords[row - 1] === rightWords[col - 1]) {
      pairs.unshift({ left: row - 1, right: col - 1 });
      row -= 1;
      col -= 1;
    } else if (table[row - 1][col] >= table[row][col - 1]) {
      row -= 1;
    } else {
      col -= 1;
    }
  }

  return pairs;
}

function isBoardRevision(revision: Revision) {
  const values = [revision.editedByRole, revision.editedByStatus].filter(Boolean).map((value) => value?.toLowerCase());
  return values.some((value) => value === "admin" || value === "board" || value === "boardmember" || value === "board_member" || value === "founder");
}

function attributionColor(revision: Revision, age: number) {
  if (age >= 3) return "text-ink";

  if (isBoardRevision(revision)) {
    return ["text-[#7f0b14]", "text-[#5f0f17]", "text-[#3b080d]"][age] ?? "text-ink";
  }

  return ["text-nisky", "text-[#8f1722]", "text-[#5f0f17]"][age] ?? "text-ink";
}
