import React, { useEffect, useState } from 'react';

interface Props { filePath: string; }

function parseCSV(content: string, delimiter = ','): string[][] {
  // Auto-detect delimiter
  const firstLine = content.split('\n')[0] || '';
  if (firstLine.includes('\t') && !firstLine.includes(delimiter)) {
    delimiter = '\t';
  }

  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (inQuotes) {
      if (ch === '"' && content[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && content[i + 1] === '\n') i++;
        row.push(current.trim());
        if (row.some(c => c.length > 0)) rows.push(row);
        row = [];
        current = '';
      } else {
        current += ch;
      }
    }
  }
  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some(c => c.length > 0)) rows.push(row);
  }
  return rows;
}

const CsvPreview: React.FC<Props> = ({ filePath }) => {
  const [rows, setRows] = useState<string[][]>([]);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const content = await window.electronAPI.file.read(filePath);
        setRows(parseCSV(content));
      } catch (err: any) {
        setError(err.message || 'Failed to read file');
      }
    })();
  }, [filePath]);

  if (error) return <div className="p-4 text-red-400 text-xs">{error}</div>;
  if (rows.length === 0) return <div className="p-4 text-[#64748B] text-xs">Loading...</div>;

  const headers = rows[0];
  let dataRows = rows.slice(1);

  if (sortCol !== null) {
    dataRows = [...dataRows].sort((a, b) => {
      const av = a[sortCol] || '';
      const bv = b[sortCol] || '';
      const numA = parseFloat(av);
      const numB = parseFloat(bv);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortAsc ? numA - numB : numB - numA;
      }
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  const handleSort = (col: number) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-full border-collapse text-xs font-mono">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="bg-[#1E1E2E] text-[#64748B] px-3 py-2 text-left w-10 border-b border-[#2A2A3E]">#</th>
            {headers.map((h, i) => (
              <th
                key={i}
                onClick={() => handleSort(i)}
                className="bg-[#1E1E2E] text-[#94A3B8] px-3 py-2 text-left border-b border-[#2A2A3E] cursor-pointer hover:text-[#E2E8F0] whitespace-nowrap"
              >
                {h} {sortCol === i ? (sortAsc ? '↑' : '↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-[#0A0A0F]' : 'bg-[#0F0F17]'}>
              <td className="px-3 py-1.5 text-[#64748B] border-b border-[#1E1E2E]/50">{ri + 1}</td>
              {headers.map((_, ci) => (
                <td key={ci} className="px-3 py-1.5 text-[#E2E8F0] border-b border-[#1E1E2E]/50 whitespace-nowrap">
                  {row[ci] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-2 text-[10px] text-[#64748B] border-t border-[#1E1E2E]">
        {dataRows.length} rows x {headers.length} columns
      </div>
    </div>
  );
};

export default CsvPreview;
