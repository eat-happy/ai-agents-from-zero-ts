from pathlib import Path
from collections import Counter
import re

terms = [
    r'\bPython\b', r'\bpip\b', r'\buv run\b', r'python -m', r'FastAPI', r'uvicorn',
    r'SQLAlchemy', r'Pydantic', r'jieba', r'huggingface_hub', r'HuggingFaceEndpoint',
    r'PyCharm', r'requirements\.txt', r'venv', r'conda', r'asyncio', r'self\.',
    r'api_key=', r'base_url=', r'model_provider', r'langchain_python', r'init_chat_model',
    r'create_agent\b', r'AgentExecutor', r'TypedDict', r'dataclass', r'\.py\b',
]
c=Counter()
samples={}
for f in Path('book').rglob('*.md'):
    t=f.read_text(encoding='utf-8')
    # skip code fences roughly by removing them
    prose=re.sub(r'```[\s\S]*?```','',t)
    for pat in terms:
        n=len(re.findall(pat, prose, flags=re.I))
        if n:
            c[pat]+=n
            if pat not in samples:
                for m in re.finditer(pat, prose, flags=re.I):
                    line=prose[:m.start()].count('\n')+1
                    samples[pat]=f"{f.as_posix()}:{line}"
                    break
print('PROSE TERM COUNTS')
for k,v in c.most_common():
    print(f'{v:4d}  {k}  e.g. {samples.get(k)}')
