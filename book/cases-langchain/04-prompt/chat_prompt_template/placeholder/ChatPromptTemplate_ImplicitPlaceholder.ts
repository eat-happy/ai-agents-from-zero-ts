/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langchain/04-prompt/chat_prompt_template/placeholder/ChatPromptTemplate_ImplicitPlaceholder.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】隐式使用 MessagesPlaceholder：("placeholder", "{变量名}") 简写

对应教程章节：第 13 章 - 提示词与消息模板 → 7.5、MessagesPlaceholder：消息占位符

知识点速览：
- `("placeholder", "{memory}")` 是 `MessagesPlaceholder("memory")` 的简写，作用完全相同。
- 它适合让整份消息模板都保持“元组风格”，写起来更短，但理解门槛略高于显式写法。
- 学习上可以先掌握显式写法，再回头看这种简写形式。
 */

import { HumanMessage, AIMessage } from "@langchain/core/messages"
import { ChatPromptTemplate } from "@langchain/core/prompts"

// 隐式：("placeholder", "{memory}") 等价于 MessagesPlaceholder("memory")
// 模板结构仍然建议写成「系统设定 + 历史消息 + 当前问题」，更便于和正文中的主线对应
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "你是一个资深的Python应用开发工程师，请认真回答我提出的Python相关的问题",
        ),
        ("placeholder", "{memory}"),
        ("human", "{question}"),
    ]
)

// 传入 memory（历史消息列表）和 question（当前问题）
prompt_value = prompt.invoke(
    {
        "memory": [
            HumanMessage("我的名字叫亮仔，是一名程序员"),
            AIMessage("好的，亮仔你好"),
        ],
        "question": "请问我的名字叫什么？",
    }
)
console.log(prompt_value.to_string())

/* 
【输出示例】
System: 你是一个资深的Python应用开发工程师，请认真回答我提出的Python相关的问题
Human: 我的名字叫亮仔，是一名程序员
AI: 好的，亮仔你好
Human: 请问我的名字叫什么？
 */
