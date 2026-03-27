import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { Workflow } from '../../shared/types';

const WorkflowPanel: React.FC = () => {
  const {
    showWorkflowPanel,
    setShowWorkflowPanel,
    workflows,
    addWorkflow,
    removeWorkflow,
    updateWorkflow,
    setWorkflows,
    activeTabId,
  } = useAppStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCommands, setNewCommands] = useState('');
  const [runningWorkflow, setRunningWorkflow] = useState<string | null>(null);
  const [runProgress, setRunProgress] = useState(0);

  // Load workflows from store
  useEffect(() => {
    if (showWorkflowPanel) {
      window.electronAPI.store.get('workflows').then((saved: Workflow[]) => {
        if (saved) setWorkflows(saved);
      });
    }
  }, [showWorkflowPanel]);

  // Save workflows
  const saveWorkflows = async (wfs: Workflow[]) => {
    await window.electronAPI.store.set('workflows', wfs);
  };

  const handleCreate = () => {
    if (!newName.trim() || !newCommands.trim()) return;
    const workflow: Workflow = {
      id: `wf-${Date.now()}`,
      name: newName.trim(),
      commands: newCommands
        .split('\n')
        .map((c) => c.trim())
        .filter((c) => c),
      createdAt: new Date().toISOString(),
    };
    addWorkflow(workflow);
    const updated = [...workflows, workflow];
    saveWorkflows(updated);
    setNewName('');
    setNewCommands('');
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    removeWorkflow(id);
    const updated = workflows.filter((w) => w.id !== id);
    saveWorkflows(updated);
  };

  const handleRun = async (workflow: Workflow) => {
    setRunningWorkflow(workflow.id);
    setRunProgress(0);

    for (let i = 0; i < workflow.commands.length; i++) {
      setRunProgress(i + 1);
      window.electronAPI.pty.write(activeTabId, workflow.commands[i] + '\r');
      // Wait between commands
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    updateWorkflow(workflow.id, { lastRun: new Date().toISOString() });
    const updated = workflows.map((w) =>
      w.id === workflow.id ? { ...w, lastRun: new Date().toISOString() } : w
    );
    saveWorkflows(updated);

    setRunningWorkflow(null);
    setRunProgress(0);
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (!showWorkflowPanel) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => setShowWorkflowPanel(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-crux" />
      <div
        className="relative w-full max-w-3xl max-h-[80vh] bg-[#12121A] border border-[#1E1E2E] rounded-xl shadow-2xl overflow-hidden flex flex-col settings-overlay"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1E1E2E]">
          <h2 className="text-sm font-semibold">Workflow Blocks</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors"
            >
              + New Workflow
            </button>
            <button
              onClick={() => setShowWorkflowPanel(false)}
              className="text-[#64748B] hover:text-[#E2E8F0] transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Create form */}
        {isCreating && (
          <div className="p-4 border-b border-[#1E1E2E] bg-[#0A0A0F]/50">
            <div className="space-y-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Workflow name"
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-sm text-[#E2E8F0] placeholder-[#64748B] outline-none focus:border-blue-500/50"
              />
              <textarea
                value={newCommands}
                onChange={(e) => setNewCommands(e.target.value)}
                placeholder="Commands (one per line)&#10;npm install&#10;npm run build&#10;npm test"
                rows={4}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-sm text-[#E2E8F0] placeholder-[#64748B] outline-none focus:border-blue-500/50 font-mono resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="text-xs bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-[#64748B] px-4 py-2 rounded-lg hover:text-[#E2E8F0] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workflows */}
        <div className="flex-1 overflow-y-auto p-4">
          {workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[#64748B] text-sm gap-2">
              <span>No workflows yet</span>
              <span className="text-xs">Create one to automate multi-command sequences</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="workflow-card bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#E2E8F0]">
                      {workflow.name}
                    </h3>
                    <button
                      onClick={() => handleDelete(workflow.id)}
                      className="text-[#64748B] hover:text-red-400 transition-colors text-xs"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    {workflow.commands.map((cmd, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 text-xs font-mono ${
                          runningWorkflow === workflow.id && i < runProgress
                            ? 'text-emerald-400'
                            : runningWorkflow === workflow.id && i === runProgress
                            ? 'text-yellow-400'
                            : 'text-[#64748B]'
                        }`}
                      >
                        <span className="w-4 text-right text-[10px]">{i + 1}</span>
                        <span className="truncate">{cmd}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#1E1E2E]">
                    <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                      <span>{workflow.commands.length} steps</span>
                      <span>·</span>
                      <span>Last run: {formatTime(workflow.lastRun)}</span>
                    </div>
                    <button
                      onClick={() => handleRun(workflow)}
                      disabled={runningWorkflow !== null}
                      className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                        runningWorkflow === workflow.id
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                          : runningWorkflow !== null
                          ? 'bg-[#1E1E2E] text-[#64748B] cursor-not-allowed'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      {runningWorkflow === workflow.id ? `Running ${runProgress}/${workflow.commands.length}` : 'Run'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowPanel;
