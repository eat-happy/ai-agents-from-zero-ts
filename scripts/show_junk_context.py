from pathlib import Path
import re

# Show context for remaining junk signals
checks = [
    ("auto", r"\[TS-PORT\] Auto-migrated|机翻|auto-migrated"),
    ("from_import", r"(?m)^\s*from\s+\S+\s+import\s+"),
    ("def_kw", r"(?m)^\s*(?:async\s+)?def\s+\w+\s*\("),
    ("self_dot", r"\bself\."),
    ("kwargs", r"\bapi_key\s*=|\bbase_url\s*=|\bmodel_provider\s*="),
    ("pip", r"\bpython3?\s+-m\b|\bpip\s+install\b"),
    ("hf", r"langchain_huggingface|HuggingFaceEndpointEmbeddings|aembed_query"),
    ("print", r"(?m)^\s*print\s*\("),
]
for name, pat in checks:
    print("\n====", name, "====")
    n=0
    for f in Path("book").rglob("*.md"):
        t=f.read_text(encoding="utf-8")
        for m in re.finditer(pat, t):
            line=t[:m.start()].count("\n")+1
            lines=t.splitlines()
            snippet=lines[line-1].strip()[:160]
            print(f"{f.as_posix()}:{line}: {snippet}")
            n+=1
            if n>=8: break
        if n>=8: break
    print("shown", n)
