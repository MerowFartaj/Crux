import React, { useEffect, useState, useCallback } from 'react';

interface Props { filePath: string; }

const JsonNode: React.FC<{ data: any; depth: number; keyName?: string }> = ({ data, depth, keyName }) => {
  const [collapsed, setCollapsed] = useState(depth > 2);

  const toggle = useCallback(() => setCollapsed(c => !c), []);
  const indent = depth * 16;

  if (data === null) return (
    <div style={{ paddingLeft: indent }} className="py-0.5">
      {keyName !== undefined && <span className="text-[#7C3AED]">{JSON.stringify(keyName)}</span>}
      {keyName !== undefined && <span className="text-[#64748B]">: </span>}
      <span className="text-[#EF4444]">null</span>
    </div>
  );

  if (typeof data === 'boolean') return (
    <div style={{ paddingLeft: indent }} className="py-0.5">
      {keyName !== undefined && <span className="text-[#7C3AED]">{JSON.stringify(keyName)}</span>}
      {keyName !== undefined && <span className="text-[#64748B]">: </span>}
      <span className="text-[#F97316]">{data.toString()}</span>
    </div>
  );

  if (typeof data === 'number') return (
    <div style={{ paddingLeft: indent }} className="py-0.5">
      {keyName !== undefined && <span className="text-[#7C3AED]">{JSON.stringify(keyName)}</span>}
      {keyName !== undefined && <span className="text-[#64748B]">: </span>}
      <span className="text-[#22C55E]">{data}</span>
    </div>
  );

  if (typeof data === 'string') return (
    <div style={{ paddingLeft: indent }} className="py-0.5">
      {keyName !== undefined && <span className="text-[#7C3AED]">{JSON.stringify(keyName)}</span>}
      {keyName !== undefined && <span className="text-[#64748B]">: </span>}
      <span className="text-[#EAB308]">{JSON.stringify(data)}</span>
    </div>
  );

  if (Array.isArray(data)) {
    const isEmpty = data.length === 0;
    return (
      <div>
        <div
          style={{ paddingLeft: indent }}
          className="py-0.5 cursor-pointer hover:bg-[#1E1E2E]/50"
          onClick={toggle}
        >
          <span className="text-[#64748B] mr-1">{collapsed ? '▶' : '▼'}</span>
          {keyName !== undefined && <span className="text-[#7C3AED]">{JSON.stringify(keyName)}</span>}
          {keyName !== undefined && <span className="text-[#64748B]">: </span>}
          <span className="text-[#64748B]">[{isEmpty ? ']' : collapsed ? `...${data.length} items]` : ''}</span>
        </div>
        {!collapsed && !isEmpty && (
          <>
            {data.map((item, i) => <JsonNode key={i} data={item} depth={depth + 1} keyName={undefined} />)}
            <div style={{ paddingLeft: indent }} className="text-[#64748B]">]</div>
          </>
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    const isEmpty = keys.length === 0;
    return (
      <div>
        <div
          style={{ paddingLeft: indent }}
          className="py-0.5 cursor-pointer hover:bg-[#1E1E2E]/50"
          onClick={toggle}
        >
          <span className="text-[#64748B] mr-1">{collapsed ? '▶' : '▼'}</span>
          {keyName !== undefined && <span className="text-[#7C3AED]">{JSON.stringify(keyName)}</span>}
          {keyName !== undefined && <span className="text-[#64748B]">: </span>}
          <span className="text-[#64748B]">{'{'}{isEmpty ? '}' : collapsed ? `...${keys.length} keys}` : ''}</span>
        </div>
        {!collapsed && !isEmpty && (
          <>
            {keys.map(k => <JsonNode key={k} data={data[k]} depth={depth + 1} keyName={k} />)}
            <div style={{ paddingLeft: indent }} className="text-[#64748B]">{'}'}</div>
          </>
        )}
      </div>
    );
  }

  return <div style={{ paddingLeft: indent }}>{String(data)}</div>;
};

const JsonPreview: React.FC<Props> = ({ filePath }) => {
  const [data, setData] = useState<any>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const content = await window.electronAPI.file.read(filePath);
        setData(JSON.parse(content));
      } catch (err: any) {
        setError(err.message || 'Failed to parse JSON');
      }
    })();
  }, [filePath]);

  if (error) return <div className="p-4 text-red-400 text-xs font-mono">{error}</div>;
  if (data === undefined) return <div className="p-4 text-[#64748B] text-xs">Loading...</div>;

  return (
    <div className="w-full h-full overflow-auto font-mono text-xs p-2">
      <JsonNode data={data} depth={0} />
    </div>
  );
};

export default JsonPreview;
