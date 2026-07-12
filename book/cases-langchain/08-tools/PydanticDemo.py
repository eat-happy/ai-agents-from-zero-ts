"""
【案例】Pydantic 入门：类型校验、自动转换与 ValidationError

对应教程章节：第 17 章 - Tools 工具调用 → 4、参数 schema：为什么要配合 Pydantic → 4.2 Pydantic 定义 / 4.3 入门案例

知识点速览：
- 本例先单独演示 Pydantic，本身不直接定义 Tool；它的作用是帮助你理解后面为什么 `args_schema` 能提升工具参数的清晰度与安全性。
- Pydantic 基于类型注解在「实例化时」做校验与转换：合法则自动转，不合法则抛 `ValidationError`。
- `StrictInt` 这类严格类型会拒绝自动转换，仅接受真实 `int`，适合在工具参数需要更严格约束时使用。
"""
from pydantic import BaseModel, ValidationError, StrictInt


# 继承 BaseModel：实例化时按类型注解校验，不合规则抛出 ValidationError
class User(BaseModel):
    # id: int  # 普通 int 时，传入 "41" 会被自动转成 41
    id: StrictInt  # 严格整数：不接受字符串等，必须已是 int，否则报错
    name: str
    age: int = 0  # 可选字段，默认 0；传入值会被校验并转换


try:
    # 合法：id=42 为 int，实例化成功
    u = User(id=42, name="z3")
except ValidationError as e:
    print(e)
print(u.id, type(u.id))  # 42 <class 'int'>

print()
print()

# 非法：id="abc" 不是 int，StrictInt 不做模糊转换，直接抛出 ValidationError
try:
    User(id="abc", name="Bob")
except ValidationError as e:
    print(e)
# 输出示例：
# 1 validation error for User
# id
#   value is not a valid integer (type=type_error.integer)
