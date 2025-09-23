import os
import sys
from pathlib import Path
from datetime import datetime
import markdown

BASE_DIR = Path(__file__).resolve().parents[1]
# 既定（引数なし時）は 07_Design/03_DatabaseDesign を対象
DEFAULT_SRC_ROOT = BASE_DIR / '07_Design' / '03_DatabaseDesign'
OUT_BASE = BASE_DIR / '99_html'

HTML_HEAD = '''<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <link rel="stylesheet" href="{rel_prefix}assets/css/style.css">
  <link rel="stylesheet" href="{rel_prefix}print.css" media="print">
</head>
<body>
<main class="markdown-body">
'''

HTML_FOOT = '''
</main>
</body>
</html>
'''

def rel_prefix_from(out_path: Path) -> str:
    """出力先HTMLから 99_html 直下の assets/ および print.css への相対パスを算出する。

    例:
      - out: BASE/99_html/index.html        -> rel_prefix = ''
      - out: BASE/99_html/90_prompts/a.html -> rel_prefix = '../'
      - out: BASE/99_html/x/y/z/a.html      -> rel_prefix = '../../../'
    """
    try:
        rel = out_path.parent.relative_to(OUT_BASE)
    except ValueError:
        # 念のため OUT_BASE 配下以外が来た場合はカレント参照にする
        return ''
    depth = len(rel.parts)
    return '../' * depth

def convert_md_file(md_path: Path):
    # 変換元MDの BASE_DIR からの相対パスを保ったまま 99_html 配下に配置する
    md_path = md_path.resolve()
    rel_from_base = md_path.relative_to(BASE_DIR)
    out_dir = OUT_BASE / rel_from_base.parent
    out_dir.mkdir(parents=True, exist_ok=True)
    out_html = out_dir / (md_path.stem + '.html')

    text = md_path.read_text(encoding='utf-8')
    html_body = markdown.markdown(text, extensions=['tables', 'fenced_code'])

    rel_prefix = rel_prefix_from(out_html)
    title = md_path.stem
    html = HTML_HEAD.format(title=title, rel_prefix=rel_prefix) + html_body + HTML_FOOT
    out_html.write_text(html, encoding='utf-8')
    return out_html


def collect_targets(args: list[Path]) -> list[Path]:
    targets: list[Path] = []
    if args:
        for p in args:
            if p.is_file() and p.suffix.lower() == '.md':
                targets.append(p)
            elif p.is_dir():
                for md in p.rglob('*.md'):
                    targets.append(md)
    else:
        # デフォルトは 07_Design/03_DatabaseDesign 配下の *.md
        if DEFAULT_SRC_ROOT.exists():
            targets.extend(sorted(DEFAULT_SRC_ROOT.glob('*.md')))
    return targets


def main():
    args = [Path(a).resolve() for a in sys.argv[1:]]
    # BASE_DIR 配下のみに制限
    args = [a for a in args if str(BASE_DIR) in str(a)] if args else args

    targets = collect_targets(args)
    if not targets:
        print('No markdown files found.')
        return 1

    print(f"Converting {len(targets)} files...")
    for md in targets:
        out = convert_md_file(md)
        print(f" - {md.relative_to(BASE_DIR)} -> {out.relative_to(BASE_DIR)}")
    print('Done.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
