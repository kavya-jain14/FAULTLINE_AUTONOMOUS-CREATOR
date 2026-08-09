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
  return (
    <article className="feed-card">
      <header className="feed-card-header">
        <div className="post-index">P{String(index + 1).padStart(2, "0")}</div>
        <div className="post-time">
          <span className="published-tag">Published</span>
          <time dateTime={post.createdAt}>{formatCompactUtc(post.createdAt)}</time>
        </div>
      </header>

      <div className="post-text">{post.text}</div>

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
          <h2 id="feed-title">Mira’s field notes</h2>
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
