/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langchain/04-prompt/prompt_templates/PromptTemplate_Constructor.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】文本提示词模板：用构造函数创建 PromptTemplate

对应教程章节：第 13 章 - 提示词与消息模板 → 6、文本提示词模板（PromptTemplate）

知识点速览：
- `PromptTemplate` 适合把“固定句式 + 可变变量”组织成一条可复用的文本提示。
- 用构造函数创建时，需要显式写出 `template` 和 `input_variables`，因此变量边界更清楚。
- 这类模板格式化后得到的是字符串，适合作为聊天模型的简单输入，或作为后续链条中的前置文本。
 */

import os

import "dotenv/config"
import { ChatOpenAI } from "@langchain/openai"
from langchain_core.prompts import PromptTemplate

// dotenv/config loaded

// ---------- 1. 用构造函数创建模板 ----------
// template：整段话里用 {变量名} 表示占位符；input_variables：列出所有需要「每次调用时传入」的变量名
template = PromptTemplate(
    template="你是一个专业的{role}工程师，请回答我的问题给出回答，我的问题是：{question}",
    input_variables=["role", "question"],
)

// ---------- 2. 用 format 填入占位符，得到一条最终提示词字符串 ----------
prompt = template.format(
    role="python开发", question="冒泡排序怎么写,只要代码其它不要，简洁"
)
console.log(prompt)

// ---------- 3. 将格式化后的字符串发给模型（部分聊天模型支持直接传字符串）----------
model = new new ChatOpenAI(
    model="qwen-plus",
    
    apiKey:process.env.aliQwen-api,
    configuration: { baseURL:"https://dashscope.aliyuncs.com/compatible-mode/v1",
)
result = model.invoke(prompt)
console.log(result.content)
console.log("\n\n")

// ---------- 4. 同一模板复用：换不同参数得到不同提示词 ----------
template = PromptTemplate(
    template="请评价{product}的优缺点，包括{aspect1}和{aspect2}。",
    input_variables=["product", "aspect1", "aspect2"],
)
prompt_1 = template.format(product="智能手机", aspect1="电池续航", aspect2="拍照质量")
prompt_2 = template.format(product="笔记本电脑", aspect1="处理速度", aspect2="便携性")
console.log(prompt_1)
console.log(prompt_2)


/* 
【输出示例】
你是一个专业的python开发工程师，请回答我的问题给出回答，我的问题是：冒泡排序怎么写,只要代码其它不要，简洁
```python
function bubble_sort(arr) {
    n = len(arr)
    for (const i of range(n)) {
        for (const j of range(0, n - i - 1)) {
            if (arr[j] > arr[j + 1]) {
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
```


// 请评价智能手机的优缺点，包括电池续航和拍照质量。
// 请评价笔记本电脑的优缺点，包括处理速度和便携性。
 */
