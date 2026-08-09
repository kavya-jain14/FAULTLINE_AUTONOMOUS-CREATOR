import { ArrowUpRight, FileSearch, Newspaper } from "lucide-react";
import type { FeedPost } from "@faultline/contracts";

import { formatCompactUtc, sourceLabel } from "../lib/time";

interface FeedPanelProps {
  posts: FeedPost[];
  loading: boolean;
  feedError: string | null;
  hadCompletedRun: boolean;
}

function FeedCard({ post, index }: { post: FeedPost; index: number }): React.JSX.Element {
  const sections = parsePost(post.text);

  return (
    <article className="feed-card">
      <header className="feed-card-header">
        <div className="post-index">P{String(index + 1).padStart(2, "0")}</div>
        <div className="post-time">
          <span className="published-tag">Published</span>
          <time dateTime={post.createdAt}>{formatCompactUtc(post.createdAt)}</time>
        </div>
      </header>

      {sections === null ? (
        <div className="post-text">{cleanEditorialText(post.text)}</div>
      ) : (
        <div className="post-sections">
          {sections.map((section) => (
            <section className={`post-section post-section-${section.key}`} key={section.key}>
              <span>{section.label}</span>
              <p>{section.copy}</p>
            </section>
          ))}
        </div>
      )}

      <section className="rationale-block" aria-label="Publishing rationale">
        <div className="rationale-label">
          <FileSearch />
          Editorial rationale
        </div>
        <p>{post.rationale}</p>
      </section>

      <footer className="source-row">
        <span>Evidence</span>
        <div className="source-links">
          {post.sources.map((source) => (
            <a key={source} href={source} target="_blank" rel="noreferrer">
              {sourceLabel(source)} <ArrowUpRight />
            </a>
          ))}
        </div>
      </footer>
    </article>
  );
}

function cleanEditorialText(text: string): string {
  return text
    .replace(/```[a-z]*|```/gi, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parsePost(text: string): Array<{
  key: "signal" | "fault-line" | "builder-move";
  label: string;
  copy: string;
}> | null {
  const cleaned = cleanEditorialText(text);
  const pattern = /(?:^|\n)\s*(Signal|Fault line|Builder move)\s*[—–:-]\s*/gi;
  const matches = [...cleaned.matchAll(pattern)];
  if (matches.length < 2) return null;

  const labelMap = {
    signal: { key: "signal", label: "What happened" },
    "fault line": { key: "fault-line", label: "Why it matters" },
    "builder move": { key: "builder-move", label: "What builders should do" },
  } as const;

  return matches.map((match, index) => {
    const normalized = match[1]?.toLowerCase() as keyof typeof labelMap;
    const meta = labelMap[normalized];
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? cleaned.length;
    return {
      ...meta,
      copy: cleaned.slice(start, end).trim(),
    };
  });
}

export function FeedPanel({
  posts,
  loading,
  feedError,
  hadCompletedRun,
}: FeedPanelProps): React.JSX.Element {
  return (
    <section className="panel feed-panel" aria-labelledby="feed-title">
      <header className="panel-header">
        <div>
          <span className="panel-kicker">Published record</span>
          <h2 id="feed-title">Published by Mira</h2>
        </div>
        <span className="panel-count">{posts.length} posts</span>
      </header>

      {loading ? (
        <div className="feed-skeleton" aria-label="Loading published feed">
          <span />
          <span />
          <span />
        </div>
      ) : null}

      {!loading && feedError === null && posts.length === 0 ? (
        <div className="empty-state">
          <Newspaper />
          <span className="empty-number">00</span>
          <h3>
            {hadCompletedRun
              ? "No topic cleared the editorial bar."
              : "The desk is initialized and observing."}
          </h3>
          <p>
            {hadCompletedRun
              ? "That is intentional editorial judgment—not a stalled feed. The rejected-candidate ledger records why Mira stayed silent."
              : "New posts will appear here after an autonomous run qualifies a live signal. Refreshing this page never creates content."}
          </p>
        </div>
      ) : null}

      <div className="feed-list">
        {posts.map((post, index) => (
          <FeedCard key={post.id} post={post} index={index} />
        ))}
      </div>
    </section>
  );
}
