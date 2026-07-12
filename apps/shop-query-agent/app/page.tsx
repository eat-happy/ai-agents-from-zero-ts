"use client";

import { FormEvent, useState, type CSSProperties } from "react";

type Step = {
  id: string;
  title: string;
  detail: string;
  status: "ok" | "error" | "info";
};

type QueryResponse = {
  question: string;
  steps: Step[];
  hits: Array<{ kind: string; label: string; detail: string }>;
  sql: string;
  result: {
    columns: string[];
    rows: Array<Record<string, string | number | null>>;
    rowCount: number;
  } | null;
  answer: string;
  error?: string;
};

const samples = [
  "统计华北地区的销售总额",
  "各品牌销售额是多少",
  "黄金会员贡献了多少订单和销售额",
  "华东地区苹果品牌的成交额",
  "按地区汇总 paid 订单金额",
];

const statusColor: Record<Step["status"], string> = {
  ok: "var(--ok)",
  info: "var(--info)",
  error: "var(--err)",
};

export default function Page() {
  const [question, setQuestion] = useState(samples[0]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<QueryResponse | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json = (await res.json()) as QueryResponse & { error?: string };
      if (!res.ok) throw new Error(json.error || "请求失败");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>Shop Query Agent · TypeScript Demo</p>
          <h1 style={styles.title}>电商问数智能体</h1>
          <p style={styles.sub}>
            精简复刻原课「电商问数」主链路：元数据召回 → SQL 生成 → 校验 → 执行 →
            结论。本地内存数仓，无需 MySQL / Qdrant / ES。
          </p>
        </div>
        <div style={styles.badgeCol}>
          <span style={styles.badge}>NL2SQL</span>
          <span style={styles.badge}>Metadata Recall</span>
          <span style={styles.badge}>Next.js</span>
        </div>
      </section>

      <section className="responsive-grid">
        <form onSubmit={onSubmit} style={styles.panel}>
          <label style={styles.label}>自然语言问题</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            style={styles.textarea}
            placeholder="例如：统计华北地区的销售总额"
          />
          <div style={styles.samples}>
            {samples.map((s) => (
              <button
                key={s}
                type="button"
                style={styles.chip}
                onClick={() => setQuestion(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <button type="submit" style={styles.primaryBtn} disabled={loading}>
            {loading ? "分析中..." : "开始问数"}
          </button>
          {error ? <p style={styles.error}>{error}</p> : null}
        </form>

        <div style={styles.panel}>
          <h2 style={styles.h2}>执行轨迹</h2>
          {!data ? (
            <p style={styles.muted}>提交问题后，这里展示 Agent 每一步。</p>
          ) : (
            <ol style={styles.steps}>
              {data.steps.map((step) => (
                <li key={step.id} style={styles.stepItem}>
                  <div style={styles.stepHead}>
                    <strong>{step.title}</strong>
                    <span style={{ color: statusColor[step.status] }}>
                      {step.status}
                    </span>
                  </div>
                  <p style={styles.stepDetail}>{step.detail}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {data ? (
        <section className="responsive-grid" style={{ marginTop: 16 }}>
          <div style={styles.panel}>
            <h2 style={styles.h2}>结论</h2>
            <p style={styles.answer}>{data.answer}</p>
            <h3 style={styles.h3}>召回命中</h3>
            <ul style={styles.list}>
              {data.hits.map((h) => (
                <li key={h.label}>
                  <code style={styles.code}>[{h.kind}]</code> {h.label}
                  <div style={styles.muted}>{h.detail}</div>
                </li>
              ))}
            </ul>
          </div>

          <div style={styles.panel}>
            <h2 style={styles.h2}>SQL</h2>
            <pre style={styles.pre}>{data.sql}</pre>
            <h3 style={styles.h3}>结果表</h3>
            {!data.result ? (
              <p style={styles.muted}>无结果</p>
            ) : (
              <div style={styles.tableWrap}>
                <table className="result-table">
                  <thead>
                    <tr>
                      {data.result.columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.result.rows.map((row, idx) => (
                      <tr key={idx}>
                        {data.result!.columns.map((c) => (
                          <td key={c}>{String(row[c] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : null}

      <footer style={styles.footer}>
        对应学习仓库 ai-agents-from-zero 实战项目「电商问数」的 TS 精简可演示版。
      </footer>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "32px 20px 48px",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    gap: 24,
    alignItems: "flex-start",
    marginBottom: 24,
    flexWrap: "wrap",
  },
  kicker: {
    margin: 0,
    color: "var(--accent)",
    fontWeight: 700,
  },
  title: {
    margin: "8px 0 10px",
    fontSize: 40,
    lineHeight: 1.15,
  },
  sub: {
    margin: 0,
    maxWidth: 640,
    color: "var(--muted)",
    lineHeight: 1.6,
  },
  badgeCol: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 160,
  },
  badge: {
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 999,
    padding: "8px 12px",
    textAlign: "center",
    boxShadow: "var(--shadow)",
    fontSize: 13,
  },
  panel: {
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: 18,
    boxShadow: "var(--shadow)",
  },
  label: {
    display: "block",
    fontWeight: 700,
    marginBottom: 8,
  },
  textarea: {
    width: "100%",
    borderRadius: 8,
    border: "1px solid var(--line)",
    padding: 12,
    resize: "vertical",
    background: "#fff",
  },
  samples: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    border: "1px solid var(--line)",
    background: "#f8f4ec",
    borderRadius: 999,
    padding: "6px 10px",
    cursor: "pointer",
  },
  primaryBtn: {
    marginTop: 14,
    border: 0,
    borderRadius: 8,
    background: "var(--accent)",
    color: "white",
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  error: {
    color: "var(--err)",
    marginTop: 10,
  },
  h2: {
    margin: "0 0 12px",
    fontSize: 18,
  },
  h3: {
    margin: "16px 0 8px",
    fontSize: 15,
  },
  muted: {
    color: "var(--muted)",
    margin: 0,
  },
  steps: {
    margin: 0,
    paddingLeft: 18,
    display: "grid",
    gap: 10,
  },
  stepItem: {
    paddingBottom: 8,
    borderBottom: "1px dashed var(--line)",
  },
  stepHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  stepDetail: {
    margin: "6px 0 0",
    color: "var(--muted)",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  answer: {
    margin: 0,
    lineHeight: 1.7,
  },
  list: {
    margin: 0,
    paddingLeft: 18,
    display: "grid",
    gap: 8,
  },
  code: {
    fontFamily: "var(--mono)",
    color: "var(--accent-2)",
  },
  pre: {
    margin: 0,
    padding: 12,
    background: "#1c2430",
    color: "#f8fafc",
    borderRadius: 8,
    overflow: "auto",
    fontFamily: "var(--mono)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  tableWrap: {
    overflow: "auto",
    border: "1px solid var(--line)",
    borderRadius: 8,
  },
  footer: {
    marginTop: 28,
    color: "var(--muted)",
    fontSize: 13,
  },
};