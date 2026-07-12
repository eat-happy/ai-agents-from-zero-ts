/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langchain/05_parser/AnnotatedTypedDict.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】Python 入门：Annotated 与 TypedDict（仅类型提示、无运行时校验）

对应教程章节：第 14 章 - 输出解析器 → 3、结构化输出（TypedDict / Zod / Annotated）

知识点速览：
- Annotated[类型, "描述"] 中的描述只是元数据，供文档、类型检查或 LangChain 生成提示用；Python 运行时不会按描述做校验，故 age2=188 不会报错。
- 类型提示在运行时总体是「装饰性」的；若需运行时范围校验，要用 Zod 的 Field（见 AnnotatedZod.py）。
 */

from typing import Annotated, TypedDict

// Annotated[int, "年龄，范围0-150"]：类型仍是 int，后面的字符串只是元数据，运行时不会做 0–150 的校验
Age = Annotated[int, "年龄，范围0-150"]


type Person = {
    name: string
    age: number
    age2: Age  // 本质还是 int，元数据 "年龄，范围0-150" 不参与运行时校验


// TypedDict 实例化时不会校验 age2 是否在 0–150，只要类型是 int 即可
p = Person(name="z3", age=111, age2=188)
console.log(p)

// p = Person(name="z3", age="1111")  # 若用字符串赋给 age，部分环境可能报错，取决于具体运行时

/* 
【输出示例】
{'name': 'z3', 'age': 111, 'age2': 188}
 */

