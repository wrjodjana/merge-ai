import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useNavigate } from "react-router";
import ReviewEntry from "~/components/review/reviewEntry";
import type { EntryTag } from "~/components/updates/entry/pill";

interface Draft {
  owner: string;
  repo: string;
  number: number;
  headline: string;
  description: string;
  tag: EntryTag;
  merged_at: Date;
  pr_title: string | null;
  pr_body: string | null;
}

type BulkAction = "publish-selected" | "discard-selected" | "discard-internal";

const bulkLabels: Record<BulkAction, string> = {
  "publish-selected": "Publish selected",
  "discard-selected": "Discard selected",
  "discard-internal": "Discard all internal",
};

export default function Review() {
  const { owner, repo } = useParams();
  const encodedOwner = encodeURIComponent(owner as string);
  const encodedRepo = encodeURIComponent(repo as string);

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingBulk, setConfirmingBulk] = useState<BulkAction | null>(null);
  const [loadingBulk, setLoadingBulk] = useState<BulkAction | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDrafts() {
      try {
        const response = await fetch(`http://127.0.0.1:3001/updates/${encodedOwner}/${encodedRepo}?status=draft`, { method: "GET" });
        const data = await response.json();
        const fetchedDrafts = data.map((d: any) => ({
          owner: d.owner,
          repo: d.repo,
          number: d.number,
          headline: d.headline,
          description: d.description,
          tag: d.tag,
          merged_at: new Date(d.merged_at),
          pr_title: d.pr_title,
          pr_body: d.pr_body,
        }));
        setDrafts(fetchedDrafts);
      } catch (e) {
        console.error("Failed to fetch drafts!", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDrafts();
  }, [owner, repo]);

  const sortedDrafts = drafts.toSorted((a, b) => +b.merged_at - +a.merged_at);
  const internalNumbers = drafts.filter((d) => d.tag === "internal").map((d) => d.number);
  const allSelected = drafts.length > 0 && selected.size === drafts.length;

  function removeFromSelection(number: number) {
    setSelected((current) => {
      const next = new Set(current);
      next.delete(number);
      return next;
    });
  }

  function toggleSelect(number: number) {
    setConfirmingBulk(null);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(number)) {
        next.delete(number);
      } else {
        next.add(number);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setConfirmingBulk(null);
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(drafts.map((d) => d.number)));
    }
  }

  async function bulkUpdate(action: BulkAction, numbers: number[], status: "published" | "discarded") {
    try {
      setLoadingBulk(action);
      const response = await fetch(`http://127.0.0.1:3001/updates/${encodedOwner}/${encodedRepo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers: numbers, status: status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update drafts!");
      }
      setDrafts((current) => current.filter((d) => !numbers.includes(d.number)));
      setSelected(new Set());
    } catch (e) {
      console.error("Failed to update drafts!", e);
    } finally {
      setLoadingBulk(null);
      setConfirmingBulk(null);
    }
  }

  function bulkCount(action: BulkAction) {
    return action === "discard-internal" ? internalNumbers.length : selected.size;
  }

  function armBulk(action: BulkAction) {
    setMenuOpen(false);
    setConfirmingBulk(action);
  }

  function executeBulk(action: BulkAction) {
    if (action === "publish-selected") {
      bulkUpdate(action, Array.from(selected), "published");
    } else if (action === "discard-selected") {
      bulkUpdate(action, Array.from(selected), "discarded");
    } else {
      bulkUpdate(action, internalNumbers, "discarded");
    }
  }

  async function publishDraft(number: number, headline: string, description: string, tag: EntryTag) {
    const response = await fetch(`http://127.0.0.1:3001/updates/${encodedOwner}/${encodedRepo}/${number}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headline: headline, description: description, tag: tag, status: "published" }),
    });
    if (!response.ok) {
      throw new Error("Failed to publish draft!");
    }
    setDrafts((current) => current.filter((d) => d.number !== number));
    removeFromSelection(number);
  }

  async function discardDraft(number: number) {
    const response = await fetch(`http://127.0.0.1:3001/updates/${encodedOwner}/${encodedRepo}/${number}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "discarded" }),
    });
    if (!response.ok) {
      throw new Error("Failed to discard draft!");
    }
    setDrafts((current) => current.filter((d) => d.number !== number));
    removeFromSelection(number);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-row justify-between items-center px-4 py-4">
        <h1 className="text-4xl font-medium">Review Drafts</h1>
        <button onClick={() => navigate(`/updates/${encodedOwner}/${encodedRepo}`)} className="h-10 border border-black rounded-md px-3 py-2 text-sm hover:text-black text-gray-400">
          View Published Updates
        </button>
      </div>
      <p className="px-4 pb-4 text-sm text-gray-500">
        {drafts.length} {drafts.length === 1 ? "draft" : "drafts"} awaiting review
      </p>
      {drafts.length > 0 && (
        <div className="flex flex-row flex-wrap items-center justify-between gap-3 px-4 pb-4">
          <div className="flex flex-row items-center gap-3">
            <label className="flex cursor-pointer flex-row items-center gap-2 text-sm text-gray-500">
              <input type="checkbox" checked={allSelected} onChange={() => toggleSelectAll()} className="h-4 w-4 accent-black" />
              Select all
            </label>
            {selected.size > 0 && <span className="text-sm text-gray-400">{selected.size} selected</span>}
          </div>
          <div className="relative flex flex-row items-center gap-3">
            {confirmingBulk !== null && loadingBulk === null && (
              <button onClick={() => setConfirmingBulk(null)} className="text-sm text-gray-400 hover:text-gray-900">
                Cancel
              </button>
            )}
            <button
              onClick={() => (confirmingBulk !== null ? executeBulk(confirmingBulk) : setMenuOpen(!menuOpen))}
              disabled={loadingBulk !== null}
              className={`h-10 border rounded-md px-3 py-2 text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${confirmingBulk !== null ? "bg-gray-900 text-white border-transparent" : "border-black hover:text-black text-gray-400"}`}
            >
              {loadingBulk !== null ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Working...</span>
                </>
              ) : (
                <span>{confirmingBulk !== null ? `Confirm: ${bulkLabels[confirmingBulk]} (${bulkCount(confirmingBulk)})` : "Bulk actions"}</span>
              )}
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-sm">
                  <button onClick={() => armBulk("publish-selected")} disabled={selected.size === 0} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300">
                    Publish selected ({selected.size})
                  </button>
                  <button onClick={() => armBulk("discard-selected")} disabled={selected.size === 0} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300">
                    Discard selected ({selected.size})
                  </button>
                  <button onClick={() => armBulk("discard-internal")} disabled={internalNumbers.length === 0} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300">
                    Discard all internal ({internalNumbers.length})
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4 px-4 pb-8">
        {sortedDrafts.map((d) => (
          <ReviewEntry key={d.number} owner={d.owner} repo={d.repo} number={d.number} headline={d.headline} description={d.description} tag={d.tag} prTitle={d.pr_title} prBody={d.pr_body} isSelected={selected.has(d.number)} onToggleSelect={toggleSelect} onPublish={publishDraft} onDiscard={discardDraft} />
        ))}
        {!isLoading && drafts.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 p-8">
            <p className="text-sm text-gray-500">All caught up — no drafts awaiting review.</p>
            <button onClick={() => navigate(`/updates/${encodedOwner}/${encodedRepo}`)} className="h-10 border border-black rounded-md px-3 py-2 text-sm hover:text-black text-gray-400">
              View Published Updates
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
