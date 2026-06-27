"use client";

import { useState } from "react";
import { EditableTextArea } from "@/components/EditableTextArea";
import type { UnitTopic } from "@/lib/types";

type EditableFeatureListProps = {
  items: UnitTopic[];
  titleName: string;
  bodyName: string;
  headingPlaceholder: string;
  bodyPlaceholder: string;
  addLabel: string;
};

export function EditableFeatureList({
  items,
  titleName,
  bodyName,
  headingPlaceholder,
  bodyPlaceholder,
  addLabel,
}: EditableFeatureListProps) {
  const [rows, setRows] = useState<UnitTopic[]>(() => [...items, { title: "", body: "" }]);

  return (
    <div className="mt-4 space-y-5">
      {rows.map((item, index) => (
        <section key={index}>
          <input
            name={titleName}
            defaultValue={item.title}
            placeholder={headingPlaceholder}
            className="w-full border-0 border-b border-line bg-transparent px-0 py-2 font-serif text-xl font-bold outline-none focus:border-gold"
          />
          <EditableTextArea
            name={bodyName}
            defaultValue={item.body}
            placeholder={bodyPlaceholder}
            rows={5}
            className="mt-2 w-full border border-line bg-white p-3 text-sm leading-6"
          />
        </section>
      ))}
      <button
        type="button"
        onClick={() => setRows((current) => [...current, { title: "", body: "" }])}
        className="border border-gold bg-paper px-3 py-2 text-sm font-medium text-nisky"
      >
        {addLabel}
      </button>
    </div>
  );
}
