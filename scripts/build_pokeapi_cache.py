from __future__ import annotations

import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


BASE_URL = "https://pokeapi.co/api/v2"
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
MAX_WORKERS = 4
TIMEOUT = 30

TYPE_NAME_MAP = {
    "normal": "ノーマル",
    "fire": "ほのお",
    "water": "みず",
    "electric": "でんき",
    "grass": "くさ",
    "ice": "こおり",
    "fighting": "かくとう",
    "poison": "どく",
    "ground": "じめん",
    "flying": "ひこう",
    "psychic": "エスパー",
    "bug": "むし",
    "rock": "いわ",
    "ghost": "ゴースト",
    "dragon": "ドラゴン",
    "dark": "あく",
    "steel": "はがね",
    "fairy": "フェアリー",
}

MOVE_TARGET_MAP = {
    "specific-move": "不定",
    "selected-pokemon-me-first": "1体選択",
    "ally": "味方1体",
    "users-field": "味方の場",
    "user-or-ally": "自分か味方",
    "opponents-field": "相手の場",
    "user": "自分",
    "random-opponent": "ランダム1体",
    "all-other-pokemon": "自分以外全体",
    "selected-pokemon": "1体選択",
    "all-opponents": "相手全体",
    "entire-field": "全体の場",
    "user-and-allies": "味方全体",
    "all-pokemon": "全体",
    "all-allies": "味方全体",
    "users-side": "味方の場",
}


@lru_cache(maxsize=None)
def fetch_json(url: str) -> Any:
    request = Request(
        url,
        headers={
            "User-Agent": "pokemon-damage-tool/1.0 (+local cache builder)",
            "Accept": "application/json",
        },
    )
    with urlopen(request, timeout=TIMEOUT) as response:
        return json.loads(response.read().decode("utf-8"))


def paged_results(endpoint: str, limit: int = 2000) -> list[dict[str, Any]]:
    data = fetch_json(f"{BASE_URL}/{endpoint}?limit={limit}")
    return data["results"]


def localized_name(names: list[dict[str, Any]], fallback: str) -> str:
    preferred = ("ja-Hrkt", "ja", "en")
    for language in preferred:
        for entry in names:
            if entry.get("language", {}).get("name") == language:
                return entry["name"]
    return fallback


def localized_name_for_languages(names: list[dict[str, Any]], languages: tuple[str, ...], fallback: str) -> str:
    for language in languages:
        for entry in names:
            if entry.get("language", {}).get("name") == language:
                return entry["name"]
    return fallback


def fetch_json_or_none(url: str) -> Any | None:
    try:
        return fetch_json(url)
    except HTTPError as error:
        if error.code == 404:
            return None
        raise


def is_mega_name(name: str) -> bool:
    return "-mega" in name


FORM_SUFFIX_LABELS = {
    "alola": "アローラのすがた",
    "galar": "ガラルのすがた",
    "hisui": "ヒスイのすがた",
    "paldea": "パルデアのすがた",
    "single-strike": "いちげきのかた",
    "rapid-strike": "れんげきのかた",
    "midday": "まひるのすがた",
    "midnight": "まよなかのすがた",
    "dusk": "たそがれのすがた",
    "incarnate": "けしんフォルム",
    "therian": "れいじゅうフォルム",
    "altered": "アナザーフォルム",
    "origin": "オリジンフォルム",
    "land": "ランドフォルム",
    "sky": "スカイフォルム",
    "ordinary": "たんじゅん",
    "resolute": "かくご",
    "shield": "シールドフォルム",
    "blade": "ブレードフォルム",
    "school": "むれたすがた",
    "solo": "たんどく",
    "east": "ひがしのうみ",
    "west": "にしのうみ",
    "male": "オス",
    "female": "メス",
    "red-striped": "あかすじ",
    "blue-striped": "あおすじ",
    "white-striped": "しろすじ",
    "average": "へいじょう",
    "small": "ちいさいサイズ",
    "large": "おおきいサイズ",
    "super": "とくだいサイズ",
    "50": "50%",
    "10": "10%",
    "complete": "パーフェクトフォルム",
    "ice-rider": "はくばじょうのすがた",
    "shadow-rider": "こくばじょうのすがた",
    "combat-breed": "コンバットしゅ",
    "blaze-breed": "ブレイズしゅ",
    "aqua-breed": "ウォーターしゅ",
    "cornerstone": "いしずえのめん",
    "wellspring": "いどのめん",
    "hearthflame": "かまどのめん",
    "teal": "みどりのめん",
    "curly": "そったすがた",
    "droopy": "たれたすがた",
    "stretchy": "のびたすがた",
}


def form_names(form_data: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not form_data:
        return []
    return [*(form_data.get("form_names") or []), *(form_data.get("names") or [])]


def localized_form_label(species_ja: str, pokemon_name: str, form_data: dict[str, Any] | None) -> str:
    names = form_names(form_data)
    localized_form_name = localized_name_for_languages(names, ("ja-Hrkt", "ja"), "")
    if localized_form_name:
        if species_ja in localized_form_name:
            return localized_form_name
        if localized_form_name.endswith("のすがた") or localized_form_name.endswith("フォルム") or localized_form_name.endswith("のめん"):
            return f"{species_ja} ({localized_form_name})"
        return f"{species_ja} ({localized_form_name})"
    for suffix, label in sorted(FORM_SUFFIX_LABELS.items(), key=lambda item: len(item[0]), reverse=True):
        if pokemon_name.endswith(f"-{suffix}"):
            return f"{species_ja} ({label})"
    return species_ja


def pokemon_signature(pokemon: dict[str, Any]) -> dict[str, Any]:
    stats = tuple((stat["stat"]["name"], stat["base_stat"]) for stat in pokemon.get("stats", []))
    types = tuple(type_slot["type"]["name"] for type_slot in sorted(pokemon.get("types", []), key=lambda item: item["slot"]))
    abilities = tuple(
        (ability_slot.get("slot", 0), (ability_slot.get("ability") or {}).get("name"), bool(ability_slot.get("is_hidden")))
        for ability_slot in sorted(pokemon.get("abilities", []), key=lambda item: item.get("slot", 0))
    )
    return {"stats": stats, "types": types, "abilities": abilities}


def default_species_pokemon(species: dict[str, Any]) -> dict[str, Any] | None:
    for variety in species.get("varieties", []):
        if variety.get("is_default"):
            pokemon_ref = variety.get("pokemon") or {}
            pokemon_url = pokemon_ref.get("url")
            if pokemon_url:
                return fetch_json(pokemon_url)
    return None


def should_include_pokemon(
    pokemon: dict[str, Any],
    species: dict[str, Any],
    form_data: dict[str, Any] | None,
) -> bool:
    if pokemon.get("is_default"):
        return True
    if (form_data and form_data.get("is_mega")) or is_mega_name(pokemon["name"]):
        return True
    default_pokemon = default_species_pokemon(species)
    if default_pokemon is None:
        return False
    return pokemon_signature(pokemon) != pokemon_signature(default_pokemon)


def variant_display_name(species_ja: str, pokemon_name: str, form_data: dict[str, Any] | None) -> str:
    if form_data and form_data.get("is_mega"):
        localized_form_name = localized_name_for_languages(form_data.get("names", []), ("ja-Hrkt", "ja"), "")
        if localized_form_name:
            return localized_form_name
    if pokemon_name.endswith("-mega-x"):
        return f"メガ{species_ja}X"
    if pokemon_name.endswith("-mega-y"):
        return f"メガ{species_ja}Y"
    if is_mega_name(pokemon_name):
        return f"メガ{species_ja}"
    return localized_form_label(species_ja, pokemon_name, form_data)


def variant_aliases(species_ja: str, species_en: str, pokemon_name: str, display_name: str) -> list[str]:
    aliases = {species_ja, species_en, pokemon_name, display_name}
    if is_mega_name(pokemon_name):
        aliases.add(f"mega{species_en}")
        aliases.add(display_name.replace("メガ", ""))
    if display_name != species_ja:
        aliases.add(display_name.replace("(", " ").replace(")", ""))
        aliases.add(display_name.replace(" (", "("))
        if " (" in display_name:
            form_label = display_name.split(" (", 1)[1].rstrip(")")
            aliases.add(f"{species_ja}{form_label}")
            aliases.add(f"{form_label}{species_ja}")
    return sorted(alias for alias in aliases if alias)


def first_sprite(*values: Any) -> str | None:
    for value in values:
        if isinstance(value, str) and value:
            return value
    return None


def sprite_payload(pokemon: dict[str, Any]) -> dict[str, str | None]:
    sprites = pokemon.get("sprites") or {}
    other = sprites.get("other") or {}
    official = other.get("official-artwork") or {}
    home = other.get("home") or {}
    showdown = other.get("showdown") or {}
    dream_world = other.get("dream_world") or {}
    return {
        "artwork": first_sprite(
            official.get("front_default"),
            home.get("front_default"),
            dream_world.get("front_default"),
            sprites.get("front_default"),
        ),
        "sprite": first_sprite(
            home.get("front_default"),
            showdown.get("front_default"),
            sprites.get("front_default"),
        ),
        "shiny": first_sprite(
            official.get("front_shiny"),
            home.get("front_shiny"),
            sprites.get("front_shiny"),
        ),
    }


def ability_payload(pokemon: dict[str, Any]) -> list[dict[str, Any]]:
    abilities: list[dict[str, Any]] = []
    for ability_slot in sorted(pokemon.get("abilities", []), key=lambda item: item.get("slot", 0)):
        ability_ref = ability_slot.get("ability") or {}
        ability_name = ability_ref.get("name") or ""
        ability_url = ability_ref.get("url") or ""
        ability_data = fetch_json(ability_url) if ability_url else None
        names = ability_data.get("names", []) if ability_data else []
        abilities.append(
            {
                "apiName": ability_name,
                "nameJa": localized_name(names, ability_name),
                "nameEn": localized_name_for_languages(names, ("en",), ability_name),
                "isHidden": bool(ability_slot.get("is_hidden")),
                "slot": ability_slot.get("slot", 0),
            }
        )
    return abilities


def fetch_pokemon_entry(pokemon_ref: dict[str, Any]) -> dict[str, Any] | None:
    pokemon = fetch_json(pokemon_ref["url"])
    species = fetch_json(pokemon["species"]["url"])
    form_data = fetch_json_or_none(f"{BASE_URL}/pokemon-form/{pokemon['name']}")

    if not should_include_pokemon(pokemon, species, form_data):
        return None

    stats = {stat["stat"]["name"]: stat["base_stat"] for stat in pokemon["stats"]}
    required_stats = {"hp", "attack", "defense", "special-attack", "special-defense", "speed"}
    if not required_stats.issubset(stats):
        print(f"[warn] pokemon skipped: {pokemon['name']} (missing stats)", file=sys.stderr)
        return None
    types = [
        TYPE_NAME_MAP.get(type_slot["type"]["name"], type_slot["type"]["name"])
        for type_slot in sorted(pokemon["types"], key=lambda item: item["slot"])
    ]
    species_ja = localized_name(species["names"], species["name"])
    species_en = localized_name(
        [entry for entry in species["names"] if entry.get("language", {}).get("name") == "en"],
        species["name"],
    )
    display_name = variant_display_name(species_ja, pokemon["name"], form_data)

    return {
        "id": pokemon["id"],
        "speciesId": species["id"],
        "apiName": pokemon["name"],
        "nameJa": display_name,
        "nameEn": species_en,
        "isMega": bool(form_data and form_data.get("is_mega")) or is_mega_name(pokemon["name"]),
        "sprites": sprite_payload(pokemon),
        "abilities": ability_payload(pokemon),
        "types": types,
        "stats": {
            "hp": stats["hp"],
            "atk": stats["attack"],
            "def": stats["defense"],
            "spa": stats["special-attack"],
            "spd": stats["special-defense"],
            "spe": stats["speed"],
        },
        "aliases": variant_aliases(species_ja, species_en, pokemon["name"], display_name),
    }


def fetch_move_entry(move_ref: dict[str, Any]) -> dict[str, Any]:
    move = fetch_json(move_ref["url"])
    move_type = TYPE_NAME_MAP.get(move["type"]["name"], move["type"]["name"])
    category = move["damage_class"]["name"]
    meta = move.get("meta") or {}
    if category not in {"physical", "special", "status"}:
        category = "status"

    return {
        "id": move["id"],
        "apiName": move["name"],
        "nameJa": localized_name(move["names"], move["name"]),
        "nameEn": localized_name(
            [entry for entry in move["names"] if entry.get("language", {}).get("name") == "en"],
            move["name"],
        ),
        "type": move_type,
        "category": category,
        "power": move["power"] or 0,
        "accuracy": move["accuracy"],
        "pp": move["pp"],
        "effectChance": move.get("effect_chance"),
        "flags": [flag["name"] for flag in move.get("flags", []) if flag.get("name")],
        "meta": {
            "category": (meta.get("category") or {}).get("name"),
            "ailment": (meta.get("ailment") or {}).get("name"),
            "drain": meta.get("drain") or 0,
            "healing": meta.get("healing") or 0,
            "critRate": meta.get("crit_rate") or 0,
            "flinchChance": meta.get("flinch_chance") or 0,
            "statChance": meta.get("stat_chance") or 0,
            "ailmentChance": meta.get("ailment_chance") or 0,
            "minHits": meta.get("min_hits"),
            "maxHits": meta.get("max_hits"),
        },
        "statChanges": [
            {
                "name": change["stat"]["name"],
                "change": change["change"],
            }
            for change in move.get("stat_changes", [])
        ],
        "target": MOVE_TARGET_MAP.get(move["target"]["name"], "不定"),
        "aliases": [
            move["name"],
            localized_name(move["names"], move["name"]),
        ],
    }


def collect_entries(refs: list[dict[str, Any]], fetcher, label: str) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    total = len(refs)
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(fetcher, ref): ref for ref in refs}
        for index, future in enumerate(as_completed(futures), start=1):
            ref = futures[future]
            try:
                entry = future.result()
                if entry is not None:
                    entries.append(entry)
            except (HTTPError, URLError, TimeoutError, ValueError) as error:
                print(f"[warn] {label} fetch failed: {ref['name']} ({error})", file=sys.stderr)
            if index % 50 == 0 or index == total:
                print(f"[info] {label}: {index}/{total}")
    return sorted(entries, key=lambda item: item["id"])


def write_js(filename: str, global_name: str, payload: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = DATA_DIR / filename
    json_text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    path.write_text(f"window.{global_name} = {json_text};\n", encoding="utf-8")


def main() -> int:
    started_at = time.time()
    generated_at = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M:%S %z")

    print("[info] fetching pokemon list")
    pokemon_refs = paged_results("pokemon")

    print("[info] fetching move list")
    move_refs = paged_results("move")

    pokemon_entries = collect_entries(pokemon_refs, fetch_pokemon_entry, "pokemon")
    move_entries = collect_entries(move_refs, fetch_move_entry, "move")

    write_js(
        "pokemon-data.js",
        "POKEDEX_DATA",
        {
            "generatedAt": generated_at,
            "source": "https://pokeapi.co/",
            "count": len(pokemon_entries),
            "entries": pokemon_entries,
        },
    )
    write_js(
        "move-data.js",
        "MOVEDEX_DATA",
        {
            "generatedAt": generated_at,
            "source": "https://pokeapi.co/",
            "count": len(move_entries),
            "entries": move_entries,
        },
    )

    elapsed = time.time() - started_at
    print(f"[done] pokemon={len(pokemon_entries)} move={len(move_entries)} elapsed={elapsed:.1f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
