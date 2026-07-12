/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langgraph/03-state/reducers/StateReducer_OperatorAdd.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】operator.add 作为 Reducer（列表）：对列表字段做「 extend 」式追加，多节点返回的列表会按顺序合并成一个列表。

对应教程章节：第 23 章 - LangGraph API：图与状态 → 3、State 的更新机制：Reducer（规约函数）

知识点速览：
- Annotated[int[], operator.add] 表示该字段用 operator.add 规约：语义为列表的 extend，即 current + update 拼成新列表。
- 适合多节点各自产生一段数据、最后合并成一条列表的场景（如多路采集再汇总）；前提是业务确实允许简单拼接。
 */

import operator
from typing import Annotated, List
from typing_extensions import TypedDict
import { StateGraph, START, END, Annotation } from "@langchain/langgraph"


type ListAddState = {
    data: Annotated[int[], operator.add]


def producer_1(state: ListAddState) -> dict:
    return {"data": [1, 2]}


def producer_2(state: ListAddState) -> dict:
    return {"data": [3, 4]}


function run_demo() {
    console.log("3.1 列表追加 Reducer 演示:")
    builder = StateGraph(ListAddState)
    builder.add_node("producer1", producer_1)
    builder.add_node("producer2", producer_2)
    builder.add_edge(START, "producer1")
    builder.add_edge("producer1", "producer2")
    builder.add_edge("producer2", END)
    graph = builder.compile()
    result = graph.invoke({"data": [0]})
    console.log(`初始状态: {{'data': [0]}}`)
    console.log(`执行结果: {result}\n`)


if (__name__ == "__main__") {
    run_demo()

/* 
【输出示例】
3.1 列表追加 Reducer 演示:
初始状态: {'data': [0]}
执行结果: {'data': [0, 1, 2, 3, 4]}
 */
