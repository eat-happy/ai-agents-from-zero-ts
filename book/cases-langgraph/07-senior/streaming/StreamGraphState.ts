/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langgraph/07-senior/streaming/StreamGraphState.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】流式传输图状态：对比 stream_mode 为 updates 与 values 时，每一步向调用方推送的内容差异。

对应教程章节：第 25 章 - LangGraph 高级特性 → 1、流式处理（Streaming）

知识点速览：
- `stream(..., stream_mode="updates")`：每步只推送“本节点本次改了什么”，更像增量日志。
- `stream(..., stream_mode="values")`：每步推送“当前完整状态长什么样”，更像全量快照。
- 这是理解第 25 章 Streaming 主线的关键案例：同一张图，只是换了流模式，看到的数据视角就完全不同。
 */

from typing import TypedDict

import { StateGraph, START, END, Annotation } from "@langchain/langgraph"


type DiliState = {
    topic: string
    joke: string


function refine_topic(state: DiliState) {
    return {"topic": state["topic"] + " and cats"}


function generate_joke(state: DiliState) {
    return {"joke": `This is a joke about {state['topic']}`}


function main() {
    graph = (
        StateGraph(DiliState)
        .add_node(refine_topic)
        .add_node(generate_joke)
        .add_edge(START, "refine_topic")
        .add_edge("refine_topic", "generate_joke")
        .add_edge("generate_joke", END)
        .compile()
    )

    // updates：每步结束后只流出「本步对状态的更新」
    for (const chunk of graph.stream({"topic": "ice cream"}, stream_mode="updates")) {
        console.log(chunk)

    print()

    // values：每步结束后流出「当前完整 state」（未写字段可能仍为空字符串等初始形态）
    for (const chunk of graph.stream({"topic": "ice cream"}, stream_mode="values")) {
        console.log(chunk)


if (__name__ == "__main__") {
    main()
/* 
【输出示例】
{'refine_topic': {'topic': 'ice cream and cats'}}
{'generate_joke': {'joke': 'This is a joke about ice cream and cats'}}

{'topic': 'ice cream'}
{'topic': 'ice cream and cats'}
{'topic': 'ice cream and cats', 'joke': 'This is a joke about ice cream and cats'}
 */
