/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langgraph/07-senior/time_travel/TimeTravel.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】时间旅行：在带 checkpointer 的图上先跑完全程，用 get_state_history 选历史快照，update_state 改写状态后 invoke(null, new_config) 从分叉点重跑。

对应教程章节：第 25 章 - LangGraph 高级特性 → 3、时间回溯（Time-Travel）

知识点速览：
- 基本步骤：（1）invoke/stream 跑图；（2）get_state_history 找 checkpoint_id；（3）可选 update_state 改 values；（4）invoke(null, config) 从指定检查点继续。
- update_state 返回的新 config 含新 checkpoint，后续应使用该 config 作为「时间旅行起点」。
- 本例用 InMemorySaver；索引 states1[2] 对应「create_character 执行之后」的快照，与历史顺序有关，学习时可打印 enumerate 对照。
- NotRequired 表示该键在开始时可不出现，适合分步填满的故事状态。
- 这个案例最重要的不是背方法名，而是建立一个认知：Time-Travel 本质上是在已有 checkpoint 历史上“回到过去、从那里再分一条新路径”。

// 这个案例会串起时间回溯的完整主线：先跑图生成历史，再查看历史，再从某个历史点恢复，最后比较不同执行路径。
 */

import uuid

from langgraph.checkpoint.memory import InMemorySaver
import { StateGraph, START, END, Annotation } from "@langchain/langgraph"
from typing_extensions import TypedDict, NotRequired


type StoryState = {
    /* 故事状态：字段均可逐步写入。 */

    character: NotRequired[str]
    setting: NotRequired[str]
    plot: NotRequired[str]
    ending: NotRequired[str]


function create_character(state: StoryState) {
    /* 创建故事角色（模拟 LLM 节点）。 */
    console.log("执行节点: create_character")

    mock_character = "一只会说话的猫"
    console.log(`创建的角色: {mock_character}`)
    return {"character": mock_character}


function set_setting(state: StoryState) {
    /* 设置故事背景。 */
    console.log("执行节点: set_setting")

    mock_setting = "在一个神秘的图书馆里"
    console.log(`设置的背景: {mock_setting}`)
    return {"setting": mock_setting}


function develop_plot(state: StoryState) {
    /* 发展故事情节。 */
    console.log("执行节点: develop_plot")

    character = state.get("character", "未知角色")
    setting = state.get("setting", "未知背景")
    mock_plot = `{character}在{setting}发现了一本会发光的书`
    console.log(`发展的剧情: {mock_plot}`)
    return {"plot": mock_plot}


function write_ending(state: StoryState) {
    /* 编写故事结局。 */
    console.log("执行节点: write_ending")

    plot = state.get("plot", "未知剧情")
    mock_ending = `当{plot}时，整个图书馆都被魔法光芒照亮了`
    console.log(`编写的结局: {mock_ending}`)
    return {"ending": mock_ending}


function main() {
    console.log("=== LangGraph 高级时间旅行演示 ===\n")

    workflow = StateGraph(StoryState)

    workflow.add_node("create_character", create_character)
    workflow.add_node("set_setting", set_setting)
    workflow.add_node("develop_plot", develop_plot)
    workflow.add_node("write_ending", write_ending)

    workflow.add_edge(START, "create_character")
    workflow.add_edge("create_character", "set_setting")
    workflow.add_edge("set_setting", "develop_plot")
    workflow.add_edge("develop_plot", "write_ending")
    workflow.add_edge("write_ending", END)

    graph = workflow.compile(checkpointer=InMemorySaver())

    console.log("1. 生成第一个故事...")
    config1 = {
        "configurable": {
            "thread_id": string(uuid.uuid4()),
        }
    }

    story1 = graph.invoke({}, config1)
    console.log(`角色: {story1['character']}`)
    console.log(`背景: {story1['setting']}`)
    console.log(`剧情: {story1['plot']}`)
    console.log(`结局: {story1['ending']}`)
    console.log("话痨猫-图书馆-发光书-魔法亮")
    print()

    console.log("2. 查看第一个故事的历史状态...")
    states1 = list(graph.get_state_history(config1))

    console.log("历史状态:")
    for (const i, state of enumerate(states1)) {
        console.log(`  {i}. 下一步节点: {state.next}`)
        console.log(`     检查点ID: {state.config['configurable']['checkpoint_id']}`)
        if (state.values) {
            console.log(`     状态值: {state.values}`)
        print()

    console.log("3. 从中间状态恢复执行，创建第二个故事...")

    // 索引需与 get_state_history 顺序一致；states1[2] 对应 create_character 执行后的快照（请以本地打印为准调整）
    character_state = states1[2]
    console.log(`选中的状态: {character_state.next}`)
    console.log(`选中的状态值: {character_state.values}`)

    new_config = graph.update_state(
        character_state.config,
        values={"character": "一只会飞的龙"},
    )
    console.log(`新配置: {new_config}`)
    print()

    console.log("4. 从新检查点恢复执行，生成第二个故事...")
    story2 = graph.invoke(null, new_config)
    console.log(`新角色: {story2['character']}`)
    console.log(`背景: {story2['setting']}`)
    console.log(`剧情: {story2['plot']}`)
    console.log(`结局: {story2['ending']}`)
    print()

    console.log("5. 比较两个故事:")
    console.log("  故事1:")
    console.log(`    角色: {story1['character']}`)
    console.log(`    背景: {story1['setting']}`)
    console.log(`    剧情: {story1['plot']}`)
    console.log(`    结局: {story1['ending']}`)
    print()

    console.log("  故事2:")
    console.log(`    角色: {story2['character']}`)
    console.log(`    背景: {story2['setting']}`)
    console.log(`    剧情: {story2['plot']}`)
    console.log(`    结局: {story2['ending']}`)
    print()

    console.log("=== 演示完成 ===")


if (__name__ == "__main__") {
    main()

/* 
【输出示例】
=== LangGraph 高级时间旅行演示 ===

1. 生成第一个故事...
执行节点: create_character
创建的角色: 一只会说话的猫
执行节点: set_setting
设置的背景: 在一个神秘的图书馆里
执行节点: develop_plot
发展的剧情: 一只会说话的猫在在一个神秘的图书馆里发现了一本会发光的书
执行节点: write_ending
编写的结局: 当一只会说话的猫在在一个神秘的图书馆里发现了一本会发光的书时，整个图书馆都被魔法光芒照亮了
角色: 一只会说话的猫
背景: 在一个神秘的图书馆里
剧情: 一只会说话的猫在在一个神秘的图书馆里发现了一本会发光的书
结局: 当一只会说话的猫在在一个神秘的图书馆里发现了一本会发光的书时，整个图书馆都被魔法光芒照亮了
话痨猫-图书馆-发光书-魔法亮

2. 查看第一个故事的历史状态...
历史状态:
  0. 下一步节点: ()
     检查点ID: 1f126a2f-a543-677c-8004-25ad704b46dc
     状态值: {'character': '一只会说话的猫', 'setting': '在一个神秘的图书馆里', 'plot': '一只会说话的猫在在一个神秘的图书馆里发现了一本会发光的书', 'ending': '当一只会说话的猫在在一个神秘的图书馆里发现了一本会发光的书时，整个图书馆都被魔法光芒照亮了'}

  1. 下一步节点: ('write_ending',)
     检查点ID: 1f126a2f-a543-6114-8003-e6f6f5d0680f
     状态值: {'character': '一只会说话的猫', 'setting': '在一个神秘的图书馆里', 'plot': '一只会说话的猫在在一个神秘的图书馆里发现了一本会发光的书'}

  2. 下一步节点: ('develop_plot',)
     检查点ID: 1f126a2f-a542-6bf6-8002-51b610dbb811
     状态值: {'character': '一只会说话的猫', 'setting': '在一个神秘的图书馆里'}

  3. 下一步节点: ('set_setting',)
     检查点ID: 1f126a2f-a542-628c-8001-0117ba1c85fd
     状态值: {'character': '一只会说话的猫'}

  4. 下一步节点: ('create_character',)
     检查点ID: 1f126a2f-a541-676a-8000-1e7372afa9ff

  5. 下一步节点: ('__start__',)
     检查点ID: 1f126a2f-a540-65d6-bfff-71b7980fbdd5

3. 从中间状态恢复执行，创建第二个故事...
选中的状态: ('develop_plot',)
选中的状态值: {'character': '一只会说话的猫', 'setting': '在一个神秘的图书馆里'}
新配置: {'configurable': {'thread_id': 'c9f337ef-562e-4c57-ac92-1c00f9d1c95b', 'checkpoint_ns': '', 'checkpoint_id': '1f126a2f-a545-666c-8003-f18761d213fb'}}

4. 从新检查点恢复执行，生成第二个故事...
执行节点: develop_plot
发展的剧情: 一只会飞的龙在在一个神秘的图书馆里发现了一本会发光的书
执行节点: write_ending
编写的结局: 当一只会飞的龙在在一个神秘的图书馆里发现了一本会发光的书时，整个图书馆都被魔法光芒照亮了
新角色: 一只会飞的龙
背景: 在一个神秘的图书馆里
剧情: 一只会飞的龙在在一个神秘的图书馆里发现了一本会发光的书
结局: 当一只会飞的龙在在一个神秘的图书馆里发现了一本会发光的书时，整个图书馆都被魔法光芒照亮了

5. 比较两个故事:
  故事1:
    角色: 一只会说话的猫
    背景: 在一个神秘的图书馆里
    剧情: 一只会说话的猫在在一个神秘的图书馆里发现了一本会发光的书
    结局: 当一只会说话的猫在在一个神秘的图书馆里发现了一本会发光的书时，整个图书馆都被魔法光芒照亮了

  故事2:
    角色: 一只会飞的龙
    背景: 在一个神秘的图书馆里
    剧情: 一只会飞的龙在在一个神秘的图书馆里发现了一本会发光的书
    结局: 当一只会飞的龙在在一个神秘的图书馆里发现了一本会发光的书时，整个图书馆都被魔法光芒照亮了

=== 演示完成 ===
 */
