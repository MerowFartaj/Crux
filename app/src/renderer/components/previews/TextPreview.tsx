import React, { useEffect, useState } from 'react';

interface Props { filePath: string; }

const TextPreview: React.FC<Props> = ({ filePath }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const content = await window.electronAPI.file.read(filePath);
        setLines(content.split('\n'));
      } catch (err: any) {
        setError(err.message || 'Failed to read file');
      }
    })();
  }, [filePath]);

  if (error) return <div className="p-4 text-red-400 text-xs">{error}</div>;
  if (lines.length === 0) return <div className="p-4 text-[#64748B] text-xs">Loading...</div>;

  return (
    <div className="w-full h-full overflow-auto font-mono text-xs">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="hover:bg-[#1E1E2E]/50">
              <td className="text-right pr-4 pl-3 py-0 text-[#64748B] select-none w-12 align-top" style={{ minWidth: 40 }}>
                {i + 1}
              </td>
              <td className="pr-4 py-0 text-[#E2E8F0] whitespace-pre-wrap break-all">
                {line || '\u00A0'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TextPreview;
