"""
【案例】文本提示词模板：用构造函数创建 PromptTemplate

对应教程章节：第 13 章 - 提示词与消息模板 → 6、文本提示词模板（PromptTemplate）

知识点速览：
- `PromptTemplate` 适合把“固定句式 + 可变变量”组织成一条可复用的文本提示。
- 用构造函数创建时，需要显式写出 `template` 和 `input_variables`，因此变量边界更清楚。
- 这类模板格式化后得到的是字符串，适合作为聊天模型的简单输入，或作为后续链条中的前置文本。
"""

import os

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.prompts import PromptTemplate

load_dotenv()

# ---------- 1. 用构造函数创建模板 ----------
# template：整段话里用 {变量名} 表示占位符；input_variables：列出所有需要「每次调用时传入」的变量名
template = PromptTemplate(
    template="你是一个专业的{role}工程师，请回答我的问题给出回答，我的问题是：{question}",
    input_variables=["role", "question"],
)

# ---------- 2. 用 format 填入占位符，得到一条最终提示词字符串 ----------
prompt = template.format(
    role="python开发", question="冒泡排序怎么写,只要代码其它不要，简洁"
)
print(prompt)

# ---------- 3. 将格式化后的字符串发给模型（部分聊天模型支持直接传字符串）----------
model = init_chat_model(
    model="qwen-plus",
    model_provider="openai",
    api_key=os.getenv("aliQwen-api"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
result = model.invoke(prompt)
print(result.content)
print("\n\n")

# ---------- 4. 同一模板复用：换不同参数得到不同提示词 ----------
template = PromptTemplate(
    template="请评价{product}的优缺点，包括{aspect1}和{aspect2}。",
    input_variables=["product", "aspect1", "aspect2"],
)
prompt_1 = template.format(product="智能手机", aspect1="电池续航", aspect2="拍照质量")
prompt_2 = template.format(product="笔记本电脑", aspect1="处理速度", aspect2="便携性")
print(prompt_1)
print(prompt_2)


"""
【输出示例】
你是一个专业的python开发工程师，请回答我的问题给出回答，我的问题是：冒泡排序怎么写,只要代码其它不要，简洁
```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
```


# 请评价智能手机的优缺点，包括电池续航和拍照质量。
# 请评价笔记本电脑的优缺点，包括处理速度和便携性。
"""
