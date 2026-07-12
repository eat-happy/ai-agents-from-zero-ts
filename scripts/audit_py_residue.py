import re
from pathlib import Path
from collections import Counter

patterns = {
  "from_import": r"(?m)^from\s+\S+\s+import\s+",
  "import_py_style": r"(?m)^import\s+[a-zA-Z0-9_\.]+$",
  "constructor_self": r"constructor\(self",
  "function_self": r"function\s+\w+\(self",
  "this_colon_type": r"this\.\w+:\s*",
  "kwarg_eq": r"\b\w+=(?!=)",
  "slice_py": r"\[\s*:\s*\d+\s*\]",
  "if_name_main": r"__name__\s*==\s*[\"']__main__[\"']",
  "huggingface_py": r"langchain_huggingface|HuggingFaceEndpointEmbeddings|aembed_query",
  "self_dot": r"\bself\.",
  "pip_python3": r"python3?\s+-m\s+|pip install",
  "return_dict_py": r'return\s*\{\s*"[^"]+"\s*:',
}
counts = Counter()
examples = {k: [] for k in patterns}
for f in Path("book").rglob("*.md"):
    t = f.read_text(encoding="utf-8")
    for name, pat in patterns.items():
        hits = list(re.finditer(pat, t))
        if hits:
            counts[name] += len(hits)
            if len(examples[name]) < 3:
                for h in hits[:3]:
                    line = t[:h.start()].count("\n") + 1
                    examples[name].append(f"{f.as_posix()}:{line}")
print("COUNTS")
for k,v in counts.most_common():
    print(f"{k}: {v}")
print("\nSAMPLES")
for k,v in examples.items():
    if v: print(k, v)
