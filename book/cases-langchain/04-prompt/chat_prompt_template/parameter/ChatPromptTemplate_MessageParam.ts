/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langchain/04-prompt/chat_prompt_template/parameter/ChatPromptTemplate_MessageParam.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】用「Message 类」定义 ChatPromptTemplate 的消息

对应教程章节：第 13 章 - 提示词与消息模板 → 7、对话提示词模板（ChatPromptTemplate）

知识点速览：
- `SystemMessage`、`HumanMessage`、`AIMessage` 是 LangChain 最直观的消息表示方式。
- 当你希望角色语义一眼可见，或者后续可能扩展到工具调用、元数据时，Message 类写法通常更稳妥。
- 从学习路径上看：先理解元组与字典，再看 Message 类，会更容易把“角色”和“对象”对应起来。
 */

import { SystemMessage, HumanMessage } from "@langchain/core/messages"
import { ChatPromptTemplate } from "@langchain/core/prompts"

// 用 Message 类列表定义模板：系统消息 + 用户消息，内容里仍可带占位符 {name}、{question}
chat_prompt = ChatPromptTemplate(
    [
        SystemMessage(content="你是AI助手，你的名字叫{name}。"),
        HumanMessage(content="请问：{question}"),
    ]
)

// 传入占位符变量，得到消息列表
message = chat_prompt.format_messages(name="亮仔", question="什么是LangChain")
console.log(message)

/* 
【输出示例】
[SystemMessage(content='你是AI助手，你的名字叫亮仔。', additional_kwargs={}, response_metadata={}), HumanMessage(content='请问：什么是LangChain', additional_kwargs={}, response_metadata={})]
 */
