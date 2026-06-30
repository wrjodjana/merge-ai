import FilterButton from "~/components/filterButton";
import Row from "~/components/row";
import { useState } from "react";

export default function Dashboard() {
  const [selectedTag, setSelectedTag] = useState("All");

  const prs = [
    { id: 142, title: "Add retry logic to failed card charges", status: "open" as const, author: "mrodriguez", time: "2 days ago" },
    { id: 143, title: "Fix null check in webhook handler", status: "merged" as const, author: "warren", time: "5 hours ago" },
    { id: 144, title: "Checking for bugs in reactjs hook", status: "closed" as const, author: "joey", time: "3 hours ago" },
  ];

  const filteredPrs = prs.filter((pr) => {
    if (selectedTag === "All") {
      return true;
    }
    return pr.status === selectedTag.toLowerCase();
  });

  return (
    <div>
      <div className="flex flex-row justify-between items-center px-4 py-4 border-b border-gray-200">
        <div>
          <h1 className="text-lg font-medium">Pull Requests</h1>
          <p className="text-sm text-gray-500">merge-ai/frontend</p>
        </div>
        <div className="flex flex-row space-x-4">
          <FilterButton status="All" isActive={selectedTag === "All"} onClick={() => setSelectedTag("All")} />
          <FilterButton status="Open" isActive={selectedTag === "Open"} onClick={() => setSelectedTag("Open")} />
          <FilterButton status="Merged" isActive={selectedTag === "Merged"} onClick={() => setSelectedTag("Merged")} />
          <FilterButton status="Closed" isActive={selectedTag === "Closed"} onClick={() => setSelectedTag("Closed")} />
        </div>
      </div>
      {filteredPrs.map((pr) => (
        <Row key={pr.id} id={pr.id} title={pr.title} status={pr.status} author={pr.author} time={pr.time} />
      ))}
    </div>
  );
}
