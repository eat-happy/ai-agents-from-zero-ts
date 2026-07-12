"""
【案例】基础加法工具：使用 @tool 装饰器将普通函数转为 LangChain Tool

对应教程章节：第 17 章 - Tools 工具调用 → 3、自定义 Tool：先从最简单的工具开始 → 3.1 使用 @tool 装饰器 / 3.2 基础案例：加法工具

知识点速览：
- `@tool` 会把普通 Python 函数包装成 LangChain Tool，使它具备 `name`、`description`、`args` 等元信息，便于后续交给模型或 Agent 使用。
- 本例中的 `tool.invoke(...)` 是“程序侧直接执行工具”的写法，用来先理解 Tool 本身；它不等同于“模型已经自动发起了工具调用”。
- 函数的 docstring 默认会成为工具的 `description`，因此建议至少写清“做什么”；参数更多、要求更严格时，再结合 `args_schema` 补充说明。
"""

from langchain_core.tools import tool


# @tool 装饰器：不写参数时，工具名默认为函数名 add_number，description 取自下方 docstring
@tool
def add_number(a: int, b: int) -> int:
    """两个整数相加"""
    return a + b


# 直接执行工具：invoke 接收参数字典，键为参数名，值为参数值（与函数签名对应）
result = add_number.invoke({"a": 1, "b": 12})
print(result)

print()

# 查看工具元信息：这些内容正是模型后续理解工具时会重点参考的部分
print(f"{add_number.name=}\n{add_number.description=}\n{add_number.args=}")

"""
【输出示例】
13

add_number.name='add_number'
add_number.description='两个整数相加'
add_number.args={'a': {'title': 'A', 'type': 'integer'}, 'b': {'title': 'B', 'type': 'integer'}}
"""
