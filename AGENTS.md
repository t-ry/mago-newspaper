# このプロジェクトの開発方法

- ユーザーとの対話とプロジェクト固有の仕様は日本語を基本とする。
- `.specify/memory/constitution.md`を読み、仕様駆動開発で進める。
- フィーチャーの成果物は`specs/NNN-feature-name/`にまとめる。
- 仕様は`spec.md`、技術計画は`plan.md`、作業一覧は`tasks.md`に記録する。
- 各段階では`.specify/templates/commands/`の対応する公式手順と`.specify/templates/`のテンプレートを参照する。コマンド内のプレースホルダーは現在の会話の入力と実際のパスに読み替える。
- 製品の目的が未確定の間は勝手に機能や技術スタックを確定しない。未確定事項は`docs/product-brief.md`に記録する。
- 実装後は受け入れ条件と照合し、実行した検証と残課題を記録する。
- Spec Kitの導入状況と出典は`.specify/UPSTREAM.md`を参照する。
