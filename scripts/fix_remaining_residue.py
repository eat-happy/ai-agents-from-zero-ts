from pathlib import Path
import re

# Fix bad prose introduced by earlier replace
for f in Path('book').rglob('*.md'):
    t = f.read_text(encoding='utf-8')
    o = t
    o = o.replace(
        'Prefer this over OpenAIEmbeddings（对接 TEI OpenAI 兼容接口） in Node/LangChain.js.',
        'Prefer OpenAIEmbeddings against TEI OpenAI-compatible endpoint in Node/LangChain.js.',
    )
    o = o.replace('OpenAIEmbeddings（对接 TEI OpenAI 兼容接口）', 'OpenAIEmbeddings')
    # remaining python-ish patterns inside typescript fences only
    def clean(m):
        body = m.group(1)
        body = body.replace('function (self)', '()')
        body = re.sub(r'function\s+\(self,\s*', '(', body)
        body = re.sub(r'async function\s+\(self,\s*', 'async (', body)
        body = body.replace('self.', 'this.')
        body = re.sub(r'if\s*\(\s*__name__\s*==\s*[\'"]__main__[\'"]\s*\)', 'if (import.meta.url.endsWith(process.argv[1] || ""))', body)
        body = re.sub(r'(?m)^from\s+\S+\s+import\s+.+$', lambda mm: '// ' + mm.group(0), body)
        body = re.sub(r'(?m)^import\s+[a-zA-Z_][\w\.]*\s*$', '', body)
        body = re.sub(r'(\w+)\[:(\d+)\]', r'\1.slice(0, \2)', body)
        return '```typescript\n' + body + '\n```'
    o2 = re.sub(r'```typescript\s*\n([\s\S]*?)```', clean, o)
    if o2 != t:
        f.write_text(o2, encoding='utf-8')
        print('fixed', f)
print('done')
