import { useState } from "react";
import { colorMap, labelMap, type EntryTag } from "~/components/updates/entry/pill";

const entryTags: EntryTag[] = ["new", "improved", "fixed", "internal"];
const BODY_PREVIEW_LENGTH = 280;

interface ReviewEntryProps {
  owner: string;
  repo: string;
  number: number;
  headline: string;
  description: string;
  tag: EntryTag;
  prTitle: string | null;
  prBody: string | null;
  isSelected: boolean;
  onToggleSelect: (number: number) => void;
  onPublish: (number: number, headline: string, description: string, tag: EntryTag) => Promise<void>;
  onDiscard: (number: number) => Promise<void>;
}

export default function ReviewEntry({ owner, repo, number, headline, description, tag, prTitle, prBody, isSelected, onToggleSelect, onPublish, onDiscard }: ReviewEntryProps) {
  const [editedHeadline, setEditedHeadline] = useState(headline);
  const [editedDescription, setEditedDescription] = useState(description);
  const [editedTag, setEditedTag] = useState<EntryTag>(tag);
  const [showFullBody, setShowFullBody] = useState(false);
  const [pendingAction, setPendingAction] = useState<"publish" | "discard" | null>(null);

  const isLongBody = prBody !== null && prBody.length > BODY_PREVIEW_LENGTH;
  const displayedBody = prBody === null ? "No description" : isLongBody && !showFullBody ? `${prBody.slice(0, BODY_PREVIEW_LENGTH)}…` : prBody;

  async function handlePublish() {
    if (editedHeadline.trim() === "") {
      return;
    }
    try {
      setPendingAction("publish");
      await onPublish(number, editedHeadline, editedDescription, editedTag);
    } catch (e) {
      console.error("Failed to publish draft!", e);
      setPendingAction(null);
    }
  }

  async function handleDiscard() {
    try {
      setPendingAction("discard");
      await onDiscard(number);
    } catch (e) {
      console.error("Failed to discard draft!", e);
      setPendingAction(null);
    }
  }

  return (
    <div className={`flex flex-col gap-4 rounded-lg border p-4 ${isSelected ? "border-black" : "border-gray-200"}`}>
      <div className="flex flex-row items-start gap-3">
        <div className="flex flex-1 flex-col gap-1 rounded-md bg-gray-50 p-3">
          <a href={`https://github.com/${owner}/${repo}/pull/${number}`} target="_blank" rel="noreferrer" className="text-xs text-gray-400 transition-colors hover:text-gray-900">
            Source: PR #{number} ↗
          </a>
          <p className="text-sm font-medium text-gray-900">{prTitle ?? "Source PR data unavailable"}</p>
          <p className="text-sm text-gray-500 whitespace-pre-wrap">{displayedBody}</p>
          {isLongBody && (
            <button onClick={() => setShowFullBody(!showFullBody)} className="self-start text-sm text-gray-400 hover:text-gray-900">
              {showFullBody ? "Show less" : "Show more"}
            </button>
          )}
        </div>
        <label className="flex shrink-0 cursor-pointer flex-row items-center gap-2 text-sm text-gray-500">
          <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(number)} className="h-4 w-4 accent-black" />
          Select
        </label>
      </div>
      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium text-gray-700">Headline</label>
        <input value={editedHeadline} onChange={(e) => setEditedHeadline(e.target.value)} type="text" className="border border-black rounded-md px-3 py-2 text-sm focus:outline-none" />
      </div>
      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} rows={3} className="border border-black rounded-md px-3 py-2 text-sm focus:outline-none resize-none" />
      </div>
      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium text-gray-700">Tag</label>
        <div className="flex flex-row items-center gap-2">
          {entryTags.map((t) => (
            <button key={t} onClick={() => setEditedTag(t)} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${editedTag === t ? `${colorMap[t]} border-transparent` : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900"}`}>
              {labelMap[t]}
            </button>
          ))}
          {editedTag === "internal" && <span className="text-sm text-gray-400">Hidden from the public updates page</span>}
        </div>
      </div>
      <div className="flex flex-row gap-3">
        <button onClick={() => handlePublish()} disabled={pendingAction !== null || editedHeadline.trim() === ""} className="h-10 border border-black rounded-md px-3 py-2 text-sm hover:text-black text-gray-400 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-400">
          {pendingAction === "publish" ? (
            <>
              <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Publishing...</span>
            </>
          ) : (
            <span>Publish</span>
          )}
        </button>
        <button onClick={() => handleDiscard()} disabled={pendingAction !== null} className="h-10 border border-black rounded-md px-3 py-2 text-sm hover:text-black text-gray-400 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-400">
          {pendingAction === "discard" ? (
            <>
              <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Discarding...</span>
            </>
          ) : (
            <span>Discard</span>
          )}
        </button>
      </div>
    </div>
  );
}
