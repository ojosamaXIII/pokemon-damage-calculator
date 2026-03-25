# ポケモンダメージ計算ツール

メガシンカ主体、テラスタルなし、ダブル補正対応の静的ダメージ計算ツールです。  
ポケモンと技のデータは `PokeAPI` をもとにローカル生成しています。

## 公開 URL

GitHub Pages で公開する場合の URL:

`https://ojosamaXIII.github.io/pokemon-damage-calculator/`

## 使い方

1. 攻撃側ポケモンを選ぶ
2. 技を選ぶ
3. 防御側ポケモンを選ぶ
4. ランク、特性、持ち物、天候、フィールド、壁などを調整する
5. 右側のダメージ結果を見る

補足:

- 同名で姿が異なるポケモンは、入力候補で識別用の表示名に分けています
- 連続技は、技に応じて `命中回数` を選択できます
- 一部の特性条件は、特性選択時のみ追加 UI が出ます

## ローカル実行

`index.html` をブラウザで直接開いて使えます。

## データ更新

`PokeAPI` からデータを再生成する場合:

```powershell
python .\scripts\build_pokeapi_cache.py
```

生成先:

- `data/pokemon-data.js`
- `data/move-data.js`

## データ出典

- PokeAPI: https://pokeapi.co/
- PokeAPI API Docs: https://pokeapi.co/docs/v2

このプロジェクトは `PokeAPI` のデータを取得して、アプリで使いやすい形に整形して利用しています。

## アセット表記

- タイプアイコン: `Pokemon Type Icons :: FREE TO USE` by `audreyeyeyeye`  
  https://www.deviantart.com/audreyeyeyeye/art/Pokemon-Type-Icons-FREE-TO-USE-909562921

## 公開時の注意

- `.edge-profile*` や `__pycache__` は `.gitignore` で除外しています
- 特性や技の一部は、対戦向けにアプリ側で個別実装しています
- すべての技固有例外や世代差分を完全再現しているわけではありません

## ライセンス

MIT License
