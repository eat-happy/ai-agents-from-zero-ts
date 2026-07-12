"""
【案例】文本提示词模板：partial_variables 与 partial()

对应教程章节：第 13 章 - 提示词与消息模板 → 6、文本提示词模板（PromptTemplate）

知识点速览：
- `partial_variables` 用于“创建模板时就固定一部分变量”，`partial()` 用于“已有模板上再固定一部分变量”。
- 两者都能实现“先固定公共部分，后续只传变化部分”，只是发生的时机不同。
- 真实项目里，这类写法很适合沉淀稳定角色、固定规则、时间戳等公共上下文。
"""

from langchain_core.prompts import PromptTemplate
from datetime import datetime
import time

# ---------- 1. 创建时用 partial_variables 固定「时间」----------
# 写法一：构造函数。input_variables 只写「后续 format 还要传」的变量（这里只剩 question；time 已用 partial_variables 固定）
template1 = PromptTemplate(
    template="现在时间是：{time},请对我的问题给出答案，我的问题是：{question}",
    input_variables=["question"],
    partial_variables={"time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")},
)
# 写法二（等价）：from_template(..., partial_variables={...})
# template1 = PromptTemplate.from_template(
#     "现在时间是：{time},请对我的问题给出答案，我的问题是：{question}",
#     partial_variables={"time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
# )
prompt1 = template1.format(question="今天是几号？")
print(prompt1)

time.sleep(2)

# ---------- 2. 用 partial() 方法：先有模板，再「固定一部分」得到新模板 ----------
template2 = PromptTemplate.from_template(
    "现在时间是：{time},请对我的问题给出答案，我的问题是：{question}"
)
partial = template2.partial(time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
prompt2 = partial.format(question="今天是几号？")
print(prompt2)

# ---------- 3. 构造函数里也可用 partial_variables ----------
# 若 format 时仍传入 foo，会覆盖 partial_variables 里的值；不传则用预设的 "hello"
template3 = PromptTemplate(
    template="{foo} {bar}",
    input_variables=["foo", "bar"],
    partial_variables={"foo": "hello"},
)
print(template3.format(foo="li4", bar="world"))  # li4 world
print(template3.format(bar="world"))  # hello world

"""
【输出示例】
现在时间是：2026-02-25 15:30:59,请对我的问题给出答案，我的问题是：今天是几号？
现在时间是：2026-02-25 15:31:01,请对我的问题给出答案，我的问题是：今天是几号？
li4 world
hello world
"""
