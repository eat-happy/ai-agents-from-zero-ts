/**
 * 【精校可运行】Supervisor 多智能体（第 26 章教学版）
 * 原 Python: SupervisorV1.0.py（create_supervisor）
 *
 * JS 侧采用「结构化路由 supervisor + 专家节点」实现同等教学意图。
 *
 *   npx tsx book/cases-langgraph/08-multi_agent/SupervisorV1.0.ts
 */
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import {
  Annotation,
  END,
  START,
  StateGraph,
  messagesStateReducer,
} from "@langchain/langgraph";
import { z } from "zod";
import { createChatModel } from "../../../src/shared/llm.js";

const bookFlight = tool(
  async ({ fromAirport, toAirport }) =>
    `✅ 成功预订了从 ${fromAirport} 到 ${toAirport} 的航班`,
  {
    name: "book_flight",
    description: "预订航班",
    schema: z.object({
      fromAirport: z.string(),
      toAirport: z.string(),
    }),
  },
);

const bookHotel = tool(
  async ({ hotelName }) => `✅ 成功预订了 ${hotelName} 的住宿`,
  {
    name: "book_hotel",
    description: "预订酒店",
    schema: z.object({ hotelName: z.string() }),
  },
);

const RouteSchema = z.object({
  next: z.enum(["flight", "hotel", "FINISH"]),
  reason: z.string(),
});

const State = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  next: Annotation<string>({
    reducer: (_p, n) => n,
    default: () => "supervisor",
  }),
  steps: Annotation<number>({
    reducer: (_p, n) => n,
    default: () => 0,
  }),
  visited: Annotation<string[]>({
    reducer: (p, n) => Array.from(new Set([...p, ...n])),
    default: () => [],
  }),
});

async function supervisor(state: typeof State.State) {
  if (state.steps >= 4 || state.visited.length >= 2) {
    return {
      next: "FINISH",
      steps: state.steps + 1,
      messages: [new AIMessage("主管：预订流程完成，向用户汇总结果。")],
    };
  }

  const model = createChatModel(0).withStructuredOutput(RouteSchema);
  const decision = await model.invoke([
    new SystemMessage(
      [
        "你是旅行预订主管，只负责路由：",
        "flight: 订机票",
        "hotel: 订酒店",
        "FINISH: 结束",
        `已访问: ${state.visited.join(",") || "无"}`,
        "不要重复已访问专家。通常先 flight 后 hotel。",
      ].join("\n"),
    ),
    ...state.messages,
  ]);

  let next = decision.next;
  if (next !== "FINISH" && state.visited.includes(next)) next = "FINISH";
  console.log("[supervisor]", { ...decision, next });
  return {
    next,
    steps: state.steps + 1,
    messages: [new AIMessage(`主管路由到：${next}（${decision.reason}）`)],
  };
}

async function flightNode(state: typeof State.State) {
  const text = String(
    [...state.messages].reverse().find((m) => m.getType() === "human")?.content ??
      "",
  );
  // very light extraction for demo
  const from = /从\s*([A-Za-z\u4e00-\u9fff]+)/.exec(text)?.[1] || "PEK";
  const to = /到\s*([A-Za-z\u4e00-\u9fff]+)/.exec(text)?.[1] || "SHA";
  const msg = await bookFlight.invoke({ fromAirport: from, toAirport: to });
  return {
    next: "supervisor",
    visited: ["flight"],
    messages: [new AIMessage(`航班专员：${msg}`)],
  };
}

async function hotelNode(state: typeof State.State) {
  const text = String(
    [...state.messages].reverse().find((m) => m.getType() === "human")?.content ??
      "",
  );
  const hotel =
    /酒店[:：\s]*([^\s，,]+)/.exec(text)?.[1] ||
    /住\s*([^\s，,]+)/.exec(text)?.[1] ||
    "全季酒店人民广场店";
  const msg = await bookHotel.invoke({ hotelName: hotel });
  return {
    next: "supervisor",
    visited: ["hotel"],
    messages: [new AIMessage(`酒店专员：${msg}`)],
  };
}

function route(state: typeof State.State) {
  if (state.next === "flight") return "flight";
  if (state.next === "hotel") return "hotel";
  return END;
}

async function main() {
  const app = new StateGraph(State)
    .addNode("supervisor", supervisor)
    .addNode("flight", flightNode)
    .addNode("hotel", hotelNode)
    .addEdge(START, "supervisor")
    .addConditionalEdges("supervisor", route, {
      flight: "flight",
      hotel: "hotel",
      [END]: END,
    })
    .addEdge("flight", "supervisor")
    .addEdge("hotel", "supervisor")
    .compile();

  const question =
    process.argv.slice(2).join(" ") ||
    "帮我预订从北京到上海的航班，并住全季酒店人民广场店";

  const result = await app.invoke({
    messages: [new HumanMessage(question)],
    next: "supervisor",
    steps: 0,
    visited: [],
  });

  console.log("\n===== transcript =====");
  for (const msg of result.messages) {
    console.log(`\n[${msg.getType()}] ${msg.content}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});