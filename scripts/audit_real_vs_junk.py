from pathlib import Path
import re
from collections import defaultdict

BOOK = Path("book")

# Signals of machine-translated / junk TS
JUNK = {
    "auto_migrated": r"\[TS-PORT\] Auto-migrated|机翻|auto-migrated",
    "from_import": r"(?m)^\s*from\s+\S+\s+import\s+",
    "def_kw": r"(?m)^\s*(?:async\s+)?def\s+\w+\s*\(",
    "self_dot": r"\bself\.",
    "constructor_self": r"constructor\s*\(\s*self",
    "new_new": r"new\s+new\s+",
    "python_fence": r"```python",
    "if_name_main": r"__name__\s*==\s*['\"]__main__['\"]",
    "print_call": r"(?m)^\s*print\s*\(",
    "pip_python_cmd": r"\bpython3?\s+-m\b|\bpip\s+install\b",
    "huggingface_py": r"langchain_huggingface|HuggingFaceEndpointEmbeddings|aembed_query",
    "kwargs_eq_model": r"\bapi_key\s*=|\bbase_url\s*=|\bmodel_provider\s*=",
    "todo_map_import": r"TODO:\s*map to TS import",
}

# Signals of real repo TS
REAL = {
    "real_marker": r"Real TypeScript from repo:",
    "recommended": r"TypeScript 可运行示例（推荐）",
    "examples_path": r"examples/",
    "polished_case": r"book/cases-",
    "shop_app": r"apps/shop-query-agent/",
}

junk_hits = defaultdict(list)
real_hits = defaultdict(int)
files_with_junk = set()
files_with_ts = set()
ts_blocks_total = 0
ts_blocks_real = 0
ts_blocks_junk = 0
ts_blocks_unknown = 0

for f in BOOK.rglob("*.md"):
    t = f.read_text(encoding="utf-8")
    rel = f.as_posix()

    for name, pat in REAL.items():
        c = len(re.findall(pat, t))
        if c:
            real_hits[name] += c

    for name, pat in JUNK.items():
        for m in re.finditer(pat, t):
            line = t[:m.start()].count("\n") + 1
            junk_hits[name].append(f"{rel}:{line}")
            files_with_junk.add(rel)

    # analyze each typescript fence
    for m in re.finditer(r"```typescript\s*\n([\s\S]*?)```", t):
        ts_blocks_total += 1
        files_with_ts.add(rel)
        body = m.group(1)
        is_real = bool(re.search(r"Real TypeScript from repo:|// examples/|// book/cases-|// apps/shop-query-agent/", body))
        is_junk = bool(re.search(
            r"\[TS-PORT\] Auto-migrated|^\s*from\s+\S+\s+import\s+|^\s*(?:async\s+)?def\s+|constructor\s*\(\s*self|\bself\.|new\s+new\s+|__name__\s*==",
            body, re.M))
        if is_real and not is_junk:
            ts_blocks_real += 1
        elif is_junk:
            ts_blocks_junk += 1
            files_with_junk.add(rel)
        else:
            # may still be hand-written polished or partial
            ts_blocks_unknown += 1

print("=== SUMMARY ===")
print({
    "md_files": len(list(BOOK.rglob('*.md'))),
    "files_with_ts_fences": len(files_with_ts),
    "ts_blocks_total": ts_blocks_total,
    "ts_blocks_real_repo": ts_blocks_real,
    "ts_blocks_junk": ts_blocks_junk,
    "ts_blocks_unknown": ts_blocks_unknown,
    "files_with_any_junk_signal": len(files_with_junk),
})
print("\n=== REAL SIGNAL COUNTS ===")
for k,v in real_hits.items():
    print(f"{k}: {v}")
print("\n=== JUNK SIGNAL COUNTS ===")
for k,v in sorted(junk_hits.items(), key=lambda x: -len(x[1])):
    print(f"{k}: {len(v)}")
    for s in v[:5]:
        print("  ", s)

# list unknown blocks sample: files with ts but no real marker
print("\n=== FILES WITH TS BUT NO 'Real TypeScript' MARKER ===")
no_real = []
for f in sorted(BOOK.rglob('*.md')):
    t = f.read_text(encoding='utf-8')
    if '```typescript' in t and 'Real TypeScript from repo:' not in t and 'TypeScript 可运行示例（推荐）' not in t:
        # exclude pure non-code docs?
        if re.search(r'```typescript\s*\n', t):
            no_real.append(f.as_posix())
print("count", len(no_real))
for x in no_real[:30]:
    print(x)
