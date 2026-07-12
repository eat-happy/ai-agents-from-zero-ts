from pathlib import Path
reps = [
  ("Python 脚本", "TypeScript 脚本"),
  ("python 脚本", "TypeScript 脚本"),
  ("Python 文件", "TypeScript 文件"),
  ("Python 模块", "TypeScript 模块"),
  ("Python 包", "npm 包"),
  ("Python 环境", "Node.js 环境"),
  ("Python 依赖", "npm 依赖"),
  ("pip 安装", "npm 安装"),
]
count=0
for f in Path('book').rglob('*.md'):
    t=f.read_text(encoding='utf-8')
    o=t
    for a,b in reps:
        o=o.replace(a,b)
    if o!=t:
        f.write_text(o, encoding='utf-8')
        count+=1
print('files_prose', count)
