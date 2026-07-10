import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, Send } from "lucide-react";
import { Layout } from "../components/Layout";
import { PageHeader } from "../components/PageHeader";
import { GlassCard } from "../components/GlassCard";
import { askAI } from "../api/analytics";

const SUGGESTIONS = [
  "How many seats are vacant on floor 3?",
  "Which department has the most employees?",
  "How many employees are working on more than one project?",
  "What is the seat utilization on floor 1, zone A?",
];

export function AIAssistant() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<{ q: string; a: string; sql?: string }[]>([]);

  const mutation = useMutation({
    mutationFn: (q: string) => askAI(q),
    onSuccess: (data, q) => {
      setHistory((h) => [...h, { q, a: data.answer, sql: data.generated_sql }]);
      setQuestion("");
    },
    onError: (err: Error, q) => {
      setHistory((h) => [...h, { q, a: `Error: ${err.message}` }]);
    },
  });

  return (
    <Layout>
      <PageHeader
        eyebrow="Ask anything"
        title="AI Assistant"
        description="Ask natural-language questions about seats, employees, and projects."
      />

      <GlassCard glow className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (question.trim()) mutation.mutate(question.trim());
          }}
          className="flex gap-3"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. How many seats are vacant on floor 3?"
            className="flex-1 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none"
          />
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet to-blue-glow px-5 py-3 text-sm font-semibold text-void hover:opacity-90 disabled:opacity-50"
          >
            <Send size={16} />
            {mutation.isPending ? "Thinking..." : "Ask"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setQuestion(s)}
              className="rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:border-violet/50 hover:text-violet-soft"
            >
              {s}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="space-y-4">
        {history.length === 0 && (
          <GlassCard>
            <div className="flex flex-col items-center py-10 text-center">
              <Sparkles size={28} className="mb-3 text-violet-soft" />
              <p className="text-sm text-muted">
                Ask a question above to query the seat and employee database in plain English.
              </p>
            </div>
          </GlassCard>
        )}
        {history.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard>
              <p className="mb-2 text-sm font-medium text-ink">{item.q}</p>
              <p className="whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-sm leading-relaxed text-ink">
                {item.a}
              </p>
              {item.sql && (
                <details className="mt-2 text-xs text-muted">
                  <summary className="cursor-pointer select-none hover:text-violet-soft">
                    View generated SQL
                  </summary>
                  <code className="mt-1 block whitespace-pre-wrap font-mono text-muted">{item.sql}</code>
                </details>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </Layout>
  );
}
