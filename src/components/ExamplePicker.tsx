'use client';

import { useState } from 'react';

export interface Example {
  id: string;
  title: string;
  description: string;
  [key: string]: unknown;
}

interface ExamplePickerProps {
  examples: Example[];
  onSelect: (example: Example) => void;
  label?: string;
}

export function ExamplePicker({ examples, onSelect, label = 'Load Example' }: ExamplePickerProps) {
  const [selectedId, setSelectedId] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    
    if (id) {
      const example = examples.find((ex) => ex.id === id);
      if (example) {
        onSelect(example);
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="example-picker"
        className="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}:
      </label>
      <select
        id="example-picker"
        value={selectedId}
        onChange={handleChange}
        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 text-sm min-w-[200px]"
      >
        <option value="">Select an example...</option>
        {examples.map((example) => (
          <option key={example.id} value={example.id}>
            {example.title}
          </option>
        ))}
      </select>
    </div>
  );
}
