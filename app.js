const TYPE_ORDER=["ノーマル","ほのお","みず","でんき","くさ","こおり","かくとう","どく","じめん","ひこう","エスパー","むし","いわ","ゴースト","ドラゴン","あく","はがね","フェアリー"];
const TYPE_CHART={ノーマル:{いわ:0.5,ゴースト:0,はがね:0.5},ほのお:{ほのお:0.5,みず:0.5,くさ:2,こおり:2,むし:2,いわ:0.5,ドラゴン:0.5,はがね:2},みず:{ほのお:2,みず:0.5,くさ:0.5,じめん:2,いわ:2,ドラゴン:0.5},でんき:{みず:2,でんき:0.5,くさ:0.5,じめん:0,ひこう:2,ドラゴン:0.5},くさ:{ほのお:0.5,みず:2,くさ:0.5,どく:0.5,じめん:2,ひこう:0.5,むし:0.5,いわ:2,ドラゴン:0.5,はがね:0.5},こおり:{ほのお:0.5,みず:0.5,くさ:2,こおり:0.5,じめん:2,ひこう:2,ドラゴン:2,はがね:0.5},かくとう:{ノーマル:2,こおり:2,どく:0.5,ひこう:0.5,エスパー:0.5,むし:0.5,いわ:2,ゴースト:0,あく:2,はがね:2,フェアリー:0.5},どく:{くさ:2,どく:0.5,じめん:0.5,いわ:0.5,ゴースト:0.5,はがね:0,フェアリー:2},じめん:{ほのお:2,でんき:2,くさ:0.5,どく:2,ひこう:0,むし:0.5,いわ:2,はがね:2},ひこう:{でんき:0.5,くさ:2,かくとう:2,むし:2,いわ:0.5,はがね:0.5},エスパー:{かくとう:2,どく:2,エスパー:0.5,あく:0,はがね:0.5},むし:{ほのお:0.5,くさ:2,かくとう:0.5,どく:0.5,ひこう:0.5,エスパー:2,ゴースト:0.5,あく:2,はがね:0.5,フェアリー:0.5},いわ:{ほのお:2,こおり:2,かくとう:0.5,じめん:0.5,ひこう:2,むし:2,はがね:0.5},ゴースト:{ノーマル:0,エスパー:2,ゴースト:2,あく:0.5},ドラゴン:{ドラゴン:2,はがね:0.5,フェアリー:0},あく:{かくとう:0.5,エスパー:2,ゴースト:2,あく:0.5,フェアリー:0.5},はがね:{ほのお:0.5,みず:0.5,でんき:0.5,こおり:2,いわ:2,はがね:0.5,フェアリー:2},フェアリー:{ほのお:0.5,かくとう:2,どく:0.5,ドラゴン:2,あく:2,はがね:0.5}};
const TARGET_ORDER=["1匹選択","選択した相手","相手全体","全体","自分以外","相手の場","味方の場","自分の場","ランダム1体","自分"];
const STATS=[{key:"hp",label:"HP",nature:false},{key:"atk",label:"攻撃",nature:true},{key:"def",label:"防御",nature:true},{key:"spa",label:"特攻",nature:true},{key:"spd",label:"特防",nature:true},{key:"spe",label:"素早",nature:true}];
const SIDE_VISIBLE_STATS={attacker:["atk","spa"],defender:["hp","def","spd"]};
const FIELD_IDS=["level","weather","terrain","attackerGrounded","defenderGrounded","doubleBattle","moveName","moveType","moveCategory","movePower","moveAccuracy","moveTarget","moveHits","moveVariablePower","moveUserDefenseActual","moveTargetAttackActual","moveTargetStatused","moveTargetHasItem","attackerName","attackerAbility","attackerAbilityEnabled","supremeOverlordMultiplier","attackerType1","attackerType2","attackStage","specialAttackStage","defenderName","defenderAbility","defenderAbilityEnabled","defenderType1","defenderType2","defenseStage","specialDefenseStage","isCritical","applySpreadPenalty","helpingHand","allySteelySpirit","allyBattery","allyPowerSpot","isBurned","hasPoison","hasParalysis","hasSleep","hasFreeze","defenderStatused","defenderFullHp","reflect","lightScreen","auroraVeil","choiceBand","choiceSpecs","lifeOrb","expertBelt","muscleBand","wiseGlasses","typeBoostItem","assaultVest","eviolite","resistBerry"];
const dataStore={pokemonEntries:[],moveEntries:[],pokemonLookup:new Map(),moveLookup:new Map(),types:[],targets:[],selectedPokemon:{attacker:null,defender:null},selectedMove:null};
const byId=(id)=>document.getElementById(id);
const sanitizeNumber=(value,fallback=0)=>{const n=Number(value);return Number.isFinite(n)?n:fallback;};
const clampNumber=(value,min,max)=>Math.min(max,Math.max(min,value));
function isBlockedHost(){return window.location.protocol==="http:"&&(window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1")&&window.location.port==="8000";}
function renderBlockedHostMessage(){document.body.classList.add("host-blocked");const block=byId("hostBlockMessage");if(!block)return;block.classList.remove("is-hidden");block.innerHTML=`<div class="host-block-card"><p class="section-tag">Blocked Host</p><h1>このアドレスでは開けません</h1><p>ローカルファイルか、別ポートのローカルサーバーから開いてください。</p></div>`;}
function escapeHtml(value){return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");}
function normalizeSearchText(value){return String(value||"").normalize("NFKC").toLowerCase().replace(/\s+/g,"").replace(/[.\-_'’]/g,"");}
function optionMarkup(value,label=value){return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;}
function indexEntry(map,entry){const names=new Set([entry.displayName,entry.nameJa,entry.nameEn,entry.apiName,...(entry.aliases||[])].filter(Boolean));names.forEach((name)=>{const key=normalizeSearchText(name);if(key&&!map.has(key))map.set(key,entry);});}
function buildPokemonDisplayName(entry,nameCounts,usedLabels){const primaryName=entry.nameJa||entry.nameEn||entry.apiName||"不明";if((nameCounts.get(primaryName)||0)<=1)return primaryName;const typeLabel=(entry.types||[]).filter(Boolean).join("/");let candidate=`${primaryName} (${typeLabel||entry.apiName})`;if(usedLabels.has(candidate))candidate=`${primaryName} (${typeLabel||"-"} / ${entry.apiName})`;usedLabels.add(candidate);return candidate;}
function buildDataStore(){const pokemonData=window.POKEDEX_DATA;const moveData=window.MOVEDEX_DATA;if(!pokemonData||!moveData)return false;dataStore.pokemonEntries=pokemonData.entries||[];dataStore.moveEntries=moveData.entries||[];const pokemonNameCounts=new Map();dataStore.pokemonEntries.forEach((entry)=>{const name=entry.nameJa||entry.nameEn||entry.apiName||"";pokemonNameCounts.set(name,(pokemonNameCounts.get(name)||0)+1);});const usedPokemonLabels=new Set();dataStore.pokemonEntries.forEach((entry)=>{entry.displayName=buildPokemonDisplayName(entry,pokemonNameCounts,usedPokemonLabels);});dataStore.moveEntries.forEach((entry)=>{entry.displayName=entry.nameJa||entry.nameEn||entry.apiName||"";});dataStore.pokemonLookup=new Map();dataStore.moveLookup=new Map();dataStore.pokemonEntries.forEach((e)=>indexEntry(dataStore.pokemonLookup,e));dataStore.moveEntries.forEach((e)=>indexEntry(dataStore.moveLookup,e));const typeSet=new Set();dataStore.pokemonEntries.forEach((e)=>(e.types||[]).forEach((t)=>typeSet.add(t)));dataStore.moveEntries.forEach((e)=>{if(e.type&&TYPE_ORDER.includes(e.type))typeSet.add(e.type);});dataStore.types=TYPE_ORDER.filter((t)=>typeSet.has(t));const targetSet=new Set(dataStore.moveEntries.map((e)=>e.target).filter(Boolean));const preferred=TARGET_ORDER.filter((t)=>targetSet.has(t));const extras=[...targetSet].filter((t)=>!preferred.includes(t)).sort((a,b)=>a.localeCompare(b,"ja"));dataStore.targets=[...preferred,...extras];return true;}
function fillDataList(datalistId,entries){const ordered=[...entries].sort((a,b)=>{const aid=Number.isFinite(a.id)?a.id:Number.MAX_SAFE_INTEGER;const bid=Number.isFinite(b.id)?b.id:Number.MAX_SAFE_INTEGER;if(aid!==bid)return aid-bid;return String(a.nameJa||a.displayName||"").localeCompare(String(b.nameJa||b.displayName||""),"ja");});byId(datalistId).innerHTML=ordered.map((entry)=>{const labelParts=[entry.displayName||entry.nameJa||entry.nameEn||entry.apiName];if(entry.nameEn)labelParts.push(entry.nameEn);return `<option value="${escapeHtml(entry.displayName||entry.nameJa||entry.nameEn||entry.apiName)}" label="${escapeHtml(labelParts.join(" / "))}"></option>`;}).join("");}
function renderTypeOptions(select,includeBlank=false){const options=[];if(includeBlank)options.push(optionMarkup("","なし"));dataStore.types.forEach((type)=>options.push(optionMarkup(type)));select.innerHTML=options.join("");}
function renderTargetOptions(){byId("moveTarget").innerHTML=dataStore.targets.map((t)=>optionMarkup(t)).join("");}
function abilityOptionLabel(ability){return ability.isHidden?`${ability.nameJa} (隠れ)`:(ability.nameJa||ability.nameEn||ability.apiName);}
function renderAbilityOptions(side,entry){const select=byId(`${side}Ability`),enabled=byId(`${side}AbilityEnabled`);if(!select)return;const abilities=entry?.abilities||[];const previousValue=select.value;const previousEnabled=enabled?enabled.checked:false;const options=abilities.length?abilities.map((ability)=>optionMarkup(ability.apiName,abilityOptionLabel(ability))):[optionMarkup("","特性なし")];select.innerHTML=options.join("");const nextValue=abilities.some((ability)=>ability.apiName===previousValue)?previousValue:(abilities[0]?.apiName||"");select.value=nextValue;if(enabled){enabled.disabled=!abilities.length;enabled.checked=abilities.length?(previousValue===nextValue?previousEnabled:true):false;}}
function getSelectedAbility(side){const entry=dataStore.selectedPokemon[side];const selectedApiName=byId(`${side}Ability`)?.value||"";if(!entry||!selectedApiName)return null;return (entry.abilities||[]).find((ability)=>ability.apiName===selectedApiName)||null;}
function getSelectedMove(){return dataStore.selectedMove;}
function renderStages(selectId){const select=byId(selectId);const options=[];for(let stage=-6;stage<=6;stage+=1){options.push(optionMarkup(String(stage),stage>0?`+${stage}`:`${stage}`));}select.innerHTML=options.join("");select.value="0";}
function renderStatRows(side){const visible=new Set(SIDE_VISIBLE_STATS[side]);byId(`${side}StatRows`).innerHTML=STATS.filter((stat)=>visible.has(stat.key)).map((stat)=>{const natureCell=stat.nature?`<select id="${side}-${stat.key}-nature"><option value="1">補正なし</option><option value="1.1">上昇</option><option value="0.9">下降</option></select>`:'<span class="table-note">-</span>';return `<tr><th scope="row">${escapeHtml(stat.label)}</th><td><span id="${side}-${stat.key}-base" class="base-stat-value">0</span></td><td><div class="effort-input-group"><input id="${side}-${stat.key}-ev" type="number" min="0" max="252" step="1" inputmode="numeric" title="0, 4, 12, 20 ... 252" value="0"><div class="effort-stepper" aria-label="努力値操作"><button type="button" class="effort-stepper-button" data-side="${side}" data-stat="${stat.key}" data-direction="1" aria-label="努力値を上げる">▲</button><button type="button" class="effort-stepper-button" data-side="${side}" data-stat="${stat.key}" data-direction="-1" aria-label="努力値を下げる">▼</button></div></div></td><td>${natureCell}</td><td><input id="${side}-${stat.key}-actual" class="actual-value-input" type="number" inputmode="numeric"></td></tr>`;}).join("");}
function getValidEffortValues(){const values=[0];for(let value=4;value<=252;value+=8)values.push(value);return values;}
function normalizeEffortValue(value){const numeric=clampNumber(Math.round(sanitizeNumber(value,0)),0,252);if(numeric===0)return 0;if(numeric<=4)return 4;return clampNumber(4+Math.round((numeric-4)/8)*8,4,252);}
const nextEffortValue=(current)=>current<=0?4:clampNumber(current+8,4,252);
const previousEffortValue=(current)=>current<=4?0:clampNumber(current-8,0,252);
function getNatureMultiplier(side,statKey){if(statKey==="hp")return 1;const input=byId(`${side}-${statKey}-nature`);return input?sanitizeNumber(input.value,1):1;}
function calculateActualStat(base,ev,level,nature,isHp){const iv=31;const effort=Math.floor(ev/4);if(isHp){if(base<=1)return 1;return Math.floor(((2*base+iv+effort)*level)/100)+level+10;}const raw=Math.floor(((2*base+iv+effort)*level)/100)+5;return Math.floor(raw*nature);}
function getActualStatBounds(base,level,nature,isHp){const actuals=getValidEffortValues().map((ev)=>calculateActualStat(base,ev,level,nature,isHp));return{min:Math.min(...actuals),max:Math.max(...actuals)};}
function getBaseStat(side,statKey){return sanitizeNumber(byId(`${side}-${statKey}-base`)?.textContent,0);}
function getEffortValue(side,statKey){return normalizeEffortValue(byId(`${side}-${statKey}-ev`)?.value??0);}
function getCalculatedStat(side,statKey){return calculateActualStat(getBaseStat(side,statKey),getEffortValue(side,statKey),sanitizeNumber(byId("level").value,50),getNatureMultiplier(side,statKey),statKey==="hp");}
function updateActualInputBounds(side,statKey){const actualInput=byId(`${side}-${statKey}-actual`);if(!actualInput)return;const bounds=getActualStatBounds(getBaseStat(side,statKey),sanitizeNumber(byId("level").value,50),getNatureMultiplier(side,statKey),statKey==="hp");actualInput.min=String(bounds.min);actualInput.max=String(bounds.max);actualInput.title=`${bounds.min} - ${bounds.max}`;}
function syncCalculatedStats(){["attacker","defender"].forEach((side)=>{STATS.forEach((stat)=>{const actualInput=byId(`${side}-${stat.key}-actual`);if(!actualInput)return;updateActualInputBounds(side,stat.key);actualInput.value=String(getCalculatedStat(side,stat.key));});});}
function findEffortForActual(base,level,nature,isHp,desiredActual){const values=getValidEffortValues();let closestEv=values[0];let closestDiff=Infinity;for(const ev of values){const actual=calculateActualStat(base,ev,level,nature,isHp);const diff=Math.abs(actual-desiredActual);if(actual===desiredActual)return ev;if(diff<closestDiff||(diff===closestDiff&&ev<closestEv)){closestDiff=diff;closestEv=ev;}}return closestEv;}
function commitActualInput(side,statKey){const actualInput=byId(`${side}-${statKey}-actual`);const evInput=byId(`${side}-${statKey}-ev`);if(!actualInput||!evInput)return;const base=getBaseStat(side,statKey);const level=sanitizeNumber(byId("level").value,50);const nature=getNatureMultiplier(side,statKey);const isHp=statKey==="hp";const bounds=getActualStatBounds(base,level,nature,isHp);const raw=actualInput.value.trim();if(!raw){actualInput.value=String(getCalculatedStat(side,statKey));return;}const desired=clampNumber(Math.round(sanitizeNumber(raw,bounds.min)),bounds.min,bounds.max);const ev=findEffortForActual(base,level,nature,isHp,desired);evInput.value=String(ev);actualInput.value=String(calculateActualStat(base,ev,level,nature,isHp));updateCalculator();saveState();}
function normalizeEffortInput(side,statKey){const input=byId(`${side}-${statKey}-ev`);if(input)input.value=String(normalizeEffortValue(input.value));}
function applyEffortStep(side,statKey,direction){const input=byId(`${side}-${statKey}-ev`);if(!input)return;const current=normalizeEffortValue(input.value);input.value=String(direction>0?nextEffortValue(current):previousEffortValue(current));updateCalculator();saveState();}
function getStats(side){const result={};STATS.forEach((stat)=>{const actual=byId(`${side}-${stat.key}-actual`);if(actual)result[stat.key]=sanitizeNumber(actual.value,0);});return result;}
function applyStage(stat,stage){const s=sanitizeNumber(stage,0);return s>=0?Math.floor((stat*(2+s))/2):Math.floor((stat*2)/(2-s));}
function getTypeEffectiveness(moveType,defenderTypes){if(!moveType)return 1;return defenderTypes.reduce((multiplier,type)=>multiplier*(((TYPE_CHART[moveType]||{})[type])??1),1);}
function isAbilityActive(side,apiName){return byId(`${side}AbilityEnabled`)?.checked&&getSelectedAbility(side)?.apiName===apiName;}
function getStabModifier(moveType){const attackerTypes=[byId("attackerType1").value,byId("attackerType2").value].filter(Boolean);if(!moveType||!attackerTypes.includes(moveType))return 1;return isAbilityActive("attacker","adaptability")?2:1.5;}
function getWeatherModifier(moveType){const weather=getActiveWeather();if(weather==="sun"){if(moveType==="ほのお")return 1.5;if(moveType==="みず")return 0.5;}if(weather==="rain"){if(moveType==="みず")return 1.5;if(moveType==="ほのお")return 0.5;}return 1;}
function isSpreadTarget(target){return /全体|自分以外|相手全体|ランダム1体/.test(target||"");}
function syncAbilityDerivedModifiers(){const attackerEnabled=byId("attackerAbilityEnabled"),defenderEnabled=byId("defenderAbilityEnabled");if(attackerEnabled&&!byId("attackerAbility").value)attackerEnabled.checked=false;if(defenderEnabled&&!byId("defenderAbility").value)defenderEnabled.checked=false;const attackerAbility=getSelectedAbility("attacker")?.apiName||"";const defenderAbility=getSelectedAbility("defender")?.apiName||"";const supremeField=byId("supremeOverlordField");if(supremeField)supremeField.classList.toggle("is-hidden",attackerAbility!=="supreme-overlord");const defenderStateField=byId("defenderAbilityStateField");const defenderStatusedField=byId("defenderStatusedField");const defenderFullHpField=byId("defenderFullHpField");const showStatused=defenderAbility==="marvel-scale";const showFullHp=["shadow-shield","multiscale"].includes(defenderAbility);if(defenderStatusedField)defenderStatusedField.classList.toggle("is-hidden",!showStatused);if(defenderFullHpField)defenderFullHpField.classList.toggle("is-hidden",!showFullHp);if(defenderStateField)defenderStateField.classList.toggle("is-hidden",!(showStatused||showFullHp));}
const SOUND_MOVE_APIS=new Set(["growl","roar","sing","supersonic","screech","snore","uproar","hyper-voice","metal-sound","grass-whistle","bug-buzz","chatter","perish-song","heal-bell","round","echoed-voice","relic-song","noble-roar","disarming-voice","boomburst","confide","snarl","sparkling-aria","clangorous-soulblaze","clanging-scales","overdrive","torch-song","alluring-voice","psychic-noise"]);
const BULLET_MOVE_APIS=new Set(["acid-spray","aura-sphere","bullet-seed","egg-bomb","electro-ball","energy-ball","focus-blast","gyro-ball","ice-ball","magnet-bomb","mist-ball","mud-bomb","octazooka","pollen-puff","pyro-ball","rock-wrecker","seed-bomb","shadow-ball","sludge-bomb","weather-ball","zap-cannon","syrup-bomb"]);
const PULSE_MOVE_APIS=new Set(["aura-sphere","dark-pulse","dragon-pulse","heal-pulse","origin-pulse","terrain-pulse","water-pulse"]);
const PUNCH_MOVE_APIS=new Set(["bullet-punch","comet-punch","dizzy-punch","drain-punch","dynamic-punch","fire-punch","focus-punch","hammer-arm","ice-hammer","ice-punch","mach-punch","mega-punch","plasma-fists","shadow-punch","sky-uppercut","surging-strikes","thunder-punch","wicked-blow"]);
const BITE_MOVE_APIS=new Set(["bite","crunch","fire-fang","fishious-rend","hyper-fang","ice-fang","jaw-lock","poison-fang","psychic-fangs","super-fang","thunder-fang"]);
const SLICING_MOVE_APIS=new Set(["air-cutter","air-slash","aqua-cutter","behemoth-blade","bitter-blade","ceaseless-edge","cross-poison","cut","fury-cutter","ivy-cudgel","kowtow-cleave","leaf-blade","night-slash","psyblade","psycho-cut","razor-shell","razor-wind","sacred-sword","secret-sword","slash","solar-blade","stone-axe","tachyon-cutter","x-scissor"]);
const POWDER_MOVE_APIS=new Set(["cotton-spore","magic-powder","poison-powder","powder","rage-powder","sleep-powder","spore","stun-spore"]);
const CRASH_MOVE_APIS=new Set(["axe-kick","high-jump-kick","jump-kick"]);
const DEFENDER_STAT_STAGE_IGNORING_MOVE_APIS=new Set(["chip-away","darkest-lariat","sacred-sword"]);
const SCREEN_BREAKING_MOVE_APIS=new Set(["brick-break","psychic-fangs","raging-bull"]);
const DEFENSE_USING_SPECIAL_MOVE_APIS=new Set(["psyshock","psystrike","secret-sword"]);
const PHYSICAL_OR_SPECIAL_BY_HIGHER_ATTACK_MOVE_APIS=new Set(["photon-geyser","light-that-burns-the-sky"]);
const USER_HP_BASED_POWER_MOVE_APIS=new Set(["eruption","water-spout","flail","reversal"]);
const TARGET_HP_BASED_POWER_MOVE_APIS=new Set(["brine"]);
const WEIGHT_BASED_POWER_MOVE_APIS=new Set(["grass-knot","low-kick","heat-crash","heavy-slam"]);
const SPEED_BASED_POWER_MOVE_APIS=new Set(["gyro-ball","electro-ball"]);
const DIRECT_POWER_INPUT_MOVE_APIS=new Set([...USER_HP_BASED_POWER_MOVE_APIS,...TARGET_HP_BASED_POWER_MOVE_APIS,...WEIGHT_BASED_POWER_MOVE_APIS,...SPEED_BASED_POWER_MOVE_APIS]);
const USER_DEFENSE_ATTACK_MOVE_APIS=new Set(["body-press"]);
const TARGET_ATTACK_POWER_MOVE_APIS=new Set(["foul-play"]);
const TARGET_STATUS_POWER_MOVE_APIS=new Set(["hex","infernal-parade","venoshock","barb-barrage"]);
const TARGET_ITEM_POWER_MOVE_APIS=new Set(["knock-off"]);
const GRASSY_TERRAIN_HALVED_MOVE_APIS=new Set(["earthquake","bulldoze","magnitude"]);
const NON_CONTACT_MOVE_APIS=new Set(["accelerock","aerial-ace","air-cutter","air-slash","aqua-cutter","armor-cannon","arrow-raid","attack-order","aurora-beam","barb-barrage","beak-blast","behemoth-blade","blizzard","blue-flare","bolt-strike","boomburst","breaking-swipe","brine","bubble-beam","bug-buzz","bullet-seed","charge-beam","clangorous-soulblaze","clanging-scales","dark-pulse","dazzling-gleam","dire-claw","disarming-voice","dragon-energy","dragon-pulse","draco-meteor","electro-shot","energy-ball","eruption","expanding-force","fiery-dance","fire-blast","flamethrower","flash-cannon","freeze-dry","freezing-glare","frost-breath","fusion-bolt","fusion-flare","gunk-shot","head-smash","heat-wave","hydro-cannon","hydro-pump","ice-beam","ice-spinner","icicle-crash","infernal-parade","leaf-storm","luster-purge","meteor-beam","moonblast","mud-shot","mystical-fire","night-daze","origin-pulse","overdrive","pin-missile","power-gem","precipice-blades","psybeam","psychic","psychic-noise","pyro-ball","rock-slide","rock-throw","rock-tomb","sandsear-storm","scale-shot","scorching-sands","seed-flare","shadow-ball","shock-wave","silver-wind","sludge-bomb","sludge-wave","snarl","solar-beam","spacial-rend","steel-beam","stone-edge","strange-steam","surf","swift","terrain-pulse","thunder","thunderbolt","thunderclap","vacuum-wave","water-gun","water-pulse","water-shuriken","weather-ball"]);
function hasAnyStatusAilment(){return ["isBurned","hasPoison","hasParalysis","hasSleep","hasFreeze"].some((id)=>byId(id)?.checked);}
function defenderHasStatusAilment(){return Boolean(byId("defenderStatused")?.checked);}
function defenderIsAtFullHp(){return Boolean(byId("defenderFullHp")?.checked);}
function isWeatherSuppressed(){return ["attacker","defender"].some((side)=>{const ability=getSelectedAbility(side)?.apiName||"";return byId(`${side}AbilityEnabled`)?.checked&&["air-lock","cloud-nine"].includes(ability);});}
function getActiveWeather(){return isWeatherSuppressed()?"none":byId("weather").value;}
function areItemsSuppressed(side){return isAbilityActive(side,"klutz");}
function getSupremeOverlordMultiplier(){return clampNumber(sanitizeNumber(byId("supremeOverlordMultiplier")?.value,1),1,1.5);}
function moveHasSecondaryEffect(moveEntry){if(!moveEntry)return false;const meta=moveEntry.meta||{};return Boolean((moveEntry.effectChance||0)>0||(meta.flinchChance||0)>0||(meta.statChance||0)>0||(meta.ailmentChance||0)>0);}
function moveHasRecoilOrCrash(moveEntry){if(!moveEntry)return false;return (moveEntry.meta?.drain||0)<0||CRASH_MOVE_APIS.has(moveEntry.apiName);}
function getMoveHitRange(moveEntry){if(!moveEntry)return null;const minHits=moveEntry.meta?.minHits,maxHits=moveEntry.meta?.maxHits;if(Number.isFinite(minHits)&&Number.isFinite(maxHits)&&maxHits>1)return{min:minHits,max:maxHits};if(moveEntry.apiName==="population-bomb")return{min:1,max:10};return null;}
function getSelectedMoveHits(){const range=getMoveHitRange(getSelectedMove());const input=byId("moveHits");if(!range||!input)return 1;return clampNumber(sanitizeNumber(input.value,range.min),range.min,range.max);}
function moveIsSound(moveEntry){return Boolean(moveEntry&&SOUND_MOVE_APIS.has(moveEntry.apiName));}
function moveIsBullet(moveEntry){return Boolean(moveEntry&&BULLET_MOVE_APIS.has(moveEntry.apiName));}
function moveIsPulse(moveEntry){return Boolean(moveEntry&&PULSE_MOVE_APIS.has(moveEntry.apiName));}
function moveIsPunch(moveEntry){return Boolean(moveEntry&&PUNCH_MOVE_APIS.has(moveEntry.apiName));}
function moveIsBite(moveEntry){return Boolean(moveEntry&&BITE_MOVE_APIS.has(moveEntry.apiName));}
function moveIsSlicing(moveEntry){return Boolean(moveEntry&&SLICING_MOVE_APIS.has(moveEntry.apiName));}
function moveIsPowder(moveEntry){return Boolean(moveEntry&&POWDER_MOVE_APIS.has(moveEntry.apiName));}
function moveIgnoresDefenderStatStages(moveEntry){return Boolean(moveEntry&&DEFENDER_STAT_STAGE_IGNORING_MOVE_APIS.has(moveEntry.apiName));}
function moveBreaksScreens(moveEntry){return Boolean(moveEntry&&SCREEN_BREAKING_MOVE_APIS.has(moveEntry.apiName));}
function moveUsesDefenseStat(moveEntry){return Boolean(moveEntry&&DEFENSE_USING_SPECIAL_MOVE_APIS.has(moveEntry.apiName));}
function moveUsesHigherOffenseCategory(moveEntry){return Boolean(moveEntry&&PHYSICAL_OR_SPECIAL_BY_HIGHER_ATTACK_MOVE_APIS.has(moveEntry.apiName));}
function moveMakesContact(moveEntry){if(!moveEntry||moveEntry.category!=="physical")return false;if(NON_CONTACT_MOVE_APIS.has(moveEntry.apiName)||moveIsBullet(moveEntry)||moveIsSound(moveEntry)||moveIsPulse(moveEntry)||moveIsPowder(moveEntry))return false;return true;}
function attackerIgnoresDefenderAbility(){return ["mold-breaker","teravolt","turboblaze"].some((ability)=>isAbilityActive("attacker",ability));}
function isGrounded(side){return Boolean(byId(`${side}Grounded`)?.checked);}
function terrainTypeName(terrain){return({electric:"でんき",grassy:"くさ",psychic:"エスパー",misty:"フェアリー"})[terrain]||"";}
function getCheckedItemCount(){return["choiceBand","choiceSpecs","lifeOrb","expertBelt","muscleBand","wiseGlasses","typeBoostItem"].filter((id)=>byId(id)?.checked).length;}
function hasAttackerHeldItem(){return getCheckedItemCount()>0;}
function toggleHidden(id,hidden){const element=byId(id);if(element)element.classList.toggle("is-hidden",hidden);}
function getMoveSpecificConfig(moveEntry){
  const apiName=moveEntry?.apiName||"";
  return{
    showVariablePower:DIRECT_POWER_INPUT_MOVE_APIS.has(apiName),
    showUserDefense:USER_DEFENSE_ATTACK_MOVE_APIS.has(apiName),
    showTargetAttack:TARGET_ATTACK_POWER_MOVE_APIS.has(apiName),
    showTargetStatus:TARGET_STATUS_POWER_MOVE_APIS.has(apiName),
    showTargetItem:TARGET_ITEM_POWER_MOVE_APIS.has(apiName),
  };
}
function syncMoveSpecificFields(entry=getSelectedMove()){
  const config=getMoveSpecificConfig(entry);
  const showSection=Object.values(config).some(Boolean);
  toggleHidden("moveSpecificSection",!showSection);
  toggleHidden("moveVariablePowerField",!config.showVariablePower);
  toggleHidden("moveUserDefenseField",!config.showUserDefense);
  toggleHidden("moveTargetAttackField",!config.showTargetAttack);
  toggleHidden("moveTargetStatusField",!config.showTargetStatus);
  toggleHidden("moveTargetItemField",!config.showTargetItem);
}
function getClampedPositiveInt(id,fallback=1,max=9999){return clampNumber(Math.round(sanitizeNumber(byId(id)?.value,fallback)),1,max);}
function getVariablePowerDefault(moveEntry){
  const apiName=moveEntry?.apiName||"";
  if(apiName==="eruption"||apiName==="water-spout")return 150;
  if(apiName==="brine")return 65;
  if(apiName==="flail"||apiName==="reversal")return 20;
  if(apiName==="grass-knot"||apiName==="low-kick")return 20;
  if(apiName==="heat-crash"||apiName==="heavy-slam")return 40;
  if(apiName==="gyro-ball")return 1;
  if(apiName==="electro-ball")return 40;
  return Math.max(1,sanitizeNumber(moveEntry?.power,1));
}
function getVariablePowerOptions(moveEntry){
  const apiName=moveEntry?.apiName||"";
  if(apiName==="brine")return[65,130];
  if(apiName==="flail"||apiName==="reversal")return[20,40,80,100,150,200];
  if(apiName==="grass-knot"||apiName==="low-kick")return[20,40,60,80,100,120];
  if(apiName==="heat-crash"||apiName==="heavy-slam")return[40,60,80,100,120];
  if(apiName==="electro-ball")return[40,60,80,120,150];
  if(apiName==="eruption"||apiName==="water-spout"||apiName==="gyro-ball"){
    const values=[];
    for(let value=1;value<=150;value+=1)values.push(value);
    return values;
  }
  return[getVariablePowerDefault(moveEntry)];
}
function getSelectedVariablePower(moveEntry){
  if(!moveEntry||!DIRECT_POWER_INPUT_MOVE_APIS.has(moveEntry.apiName))return null;
  return clampNumber(Math.round(sanitizeNumber(byId("moveVariablePower")?.value,getVariablePowerDefault(moveEntry))),1,300);
}
function getAuraModifier(moveType){const hasDarkAura=["attacker","defender"].some((side)=>isAbilityActive(side,"dark-aura"));const hasFairyAura=["attacker","defender"].some((side)=>isAbilityActive(side,"fairy-aura"));const hasAuraBreak=["attacker","defender"].some((side)=>isAbilityActive(side,"aura-break"));if(moveType==="あく"&&hasDarkAura)return{multiplier:hasAuraBreak?0.75:4/3,label:hasAuraBreak?"オーラブレイク":"ダークオーラ"};if(moveType==="フェアリー"&&hasFairyAura)return{multiplier:hasAuraBreak?0.75:4/3,label:hasAuraBreak?"オーラブレイク":"フェアリーオーラ"};return{multiplier:1,label:""};}
function applySkinAbility(context,ability){const convertedTypeMap={aerilate:"ひこう",pixilate:"フェアリー",refrigerate:"こおり",galvanize:"でんき"};const nextType=convertedTypeMap[ability];if(!nextType||context.originalMoveType!=="ノーマル"||context.movePower<=0)return context;context.moveType=nextType;context.powerMultiplier*=1.2;context.modifierLabels.push(getSelectedAbility("attacker")?.nameJa||"スキン");return context;}
function applyRuinAbilityModifiers(context){if(isAbilityActive("attacker","sword-of-ruin")&&context.isPhysical){context.defenseMultiplier*=0.75;context.modifierLabels.push("わざわいのつるぎ");}if(isAbilityActive("attacker","beads-of-ruin")&&!context.isPhysical){context.defenseMultiplier*=0.75;context.modifierLabels.push("わざわいのたま");}if(isAbilityActive("defender","tablets-of-ruin")&&context.isPhysical){context.attackMultiplier*=0.75;context.modifierLabels.push("わざわいのおふだ");}if(isAbilityActive("defender","vessel-of-ruin")&&!context.isPhysical){context.attackMultiplier*=0.75;context.modifierLabels.push("わざわいのうつわ");}return context;}
function applyAttackerAbilityModifiers(context){
  const ability=getSelectedAbility("attacker")?.apiName||"";
  if(!byId("attackerAbilityEnabled")?.checked||!ability)return context;
  applySkinAbility(context,ability);
  switch(ability){
    case "analytic":
      context.powerMultiplier*=1.3;
      context.modifierLabels.push("アナライズ");
      break;
    case "blaze":
      if(context.moveType==="ほのお"){context.powerMultiplier*=1.5;context.modifierLabels.push("もうか");}
      break;
    case "torrent":
      if(context.moveType==="みず"){context.powerMultiplier*=1.5;context.modifierLabels.push("げきりゅう");}
      break;
    case "overgrow":
      if(context.moveType==="くさ"){context.powerMultiplier*=1.5;context.modifierLabels.push("しんりょく");}
      break;
    case "swarm":
      if(context.moveType==="むし"){context.powerMultiplier*=1.5;context.modifierLabels.push("むしのしらせ");}
      break;
    case "flash-fire":
      if(context.moveType==="ほのお"){context.powerMultiplier*=1.5;context.modifierLabels.push("もらいび");}
      break;
    case "steelworker":
      if(context.moveType==="はがね"){context.powerMultiplier*=1.5;context.modifierLabels.push("はがねつかい");}
      break;
    case "steely-spirit":
      if(context.moveType==="はがね"){context.powerMultiplier*=1.5;context.modifierLabels.push("はがねのせいしん");}
      break;
    case "rocky-payload":
      if(context.moveType==="いわ"){context.powerMultiplier*=1.5;context.modifierLabels.push("いわはこび");}
      break;
    case "technician":
      if(context.movePower<=60){context.powerMultiplier*=1.5;context.modifierLabels.push("テクニシャン");}
      break;
    case "sand-force":
      if(getActiveWeather()==="sand"&&["じめん","いわ","はがね"].includes(context.moveType)){context.powerMultiplier*=1.3;context.modifierLabels.push("すなのちから");}
      break;
    case "guts":
      if(context.isPhysical&&hasAnyStatusAilment()){context.attackMultiplier*=1.5;context.modifierLabels.push("こんじょう");}
      break;
    case "toxic-boost":
      if(context.isPhysical&&byId("hasPoison").checked){context.attackMultiplier*=1.5;context.modifierLabels.push("どくぼうそう");}
      break;
    case "flare-boost":
      if(!context.isPhysical&&byId("isBurned").checked){context.attackMultiplier*=1.5;context.modifierLabels.push("ねつぼうそう");}
      break;
    case "solar-power":
      if(!context.isPhysical&&getActiveWeather()==="sun"){context.attackMultiplier*=1.5;context.modifierLabels.push("サンパワー");}
      break;
    case "hustle":
      if(context.isPhysical){context.attackMultiplier*=1.5;context.modifierLabels.push("はりきり");}
      break;
    case "huge-power":
    case "pure-power":
      if(context.isPhysical){context.attackMultiplier*=2;context.modifierLabels.push(ability==="huge-power"?"ちからもち":"ヨガパワー");}
      break;
    case "parental-bond":
      context.finalDamageMultiplier*=1.25;
      context.modifierLabels.push("おやこあい");
      break;
    case "tough-claws":
      if(moveMakesContact(context.moveEntry)){context.powerMultiplier*=1.3;context.modifierLabels.push("かたいツメ");}
      break;
    case "strong-jaw":
      if(moveIsBite(context.moveEntry)){context.powerMultiplier*=1.5;context.modifierLabels.push("がんじょうあご");}
      break;
    case "sharpness":
      if(moveIsSlicing(context.moveEntry)){context.powerMultiplier*=1.5;context.modifierLabels.push("きれあじ");}
      break;
    case "quark-drive":
      context.attackMultiplier*=1.3;
      context.modifierLabels.push("クォークチャージ");
      break;
    case "protosynthesis":
      context.attackMultiplier*=1.3;
      context.modifierLabels.push("こだいかっせい");
      break;
    case "gorilla-tactics":
      if(context.isPhysical){context.attackMultiplier*=1.5;context.modifierLabels.push("ごりむちゅう");}
      break;
    case "water-bubble":
      if(context.moveType==="みず"){context.powerMultiplier*=2;context.modifierLabels.push("すいほう");}
      break;
    case "reckless":
      if(moveHasRecoilOrCrash(context.moveEntry)){context.powerMultiplier*=1.2;context.modifierLabels.push("すてみ");}
      break;
    case "supreme-overlord": {
      const multiplier=getSupremeOverlordMultiplier();
      if(multiplier>1){context.finalDamageMultiplier*=multiplier;context.modifierLabels.push(`そうだいしょう ${formatMultiplier(multiplier)}`);}
      break;
    }
    case "sheer-force":
      if(moveHasSecondaryEffect(context.moveEntry)){context.powerMultiplier*=1.3;context.modifierLabels.push("ちからずく");}
      break;
    case "iron-fist":
      if(moveIsPunch(context.moveEntry)){context.powerMultiplier*=1.2;context.modifierLabels.push("てつのこぶし");}
      break;
    case "rivalry":
      context.finalDamageMultiplier*=1.25;
      context.modifierLabels.push("とうそうしん");
      break;
    case "transistor":
      if(context.moveType==="でんき"){context.powerMultiplier*=1.3;context.modifierLabels.push("トランジスタ");}
      break;
    case "hadron-engine":
      if(!context.isPhysical){context.attackMultiplier*=4/3;context.modifierLabels.push("ハドロンエンジン");}
      break;
    case "orichalcum-pulse":
      if(context.isPhysical){context.attackMultiplier*=4/3;context.modifierLabels.push("ひひいろのこどう");}
      break;
    case "punk-rock":
      if(moveIsSound(context.moveEntry)){context.powerMultiplier*=1.3;context.modifierLabels.push("パンクロック");}
      break;
    case "plus":
    case "minus":
      if(!context.isPhysical){context.attackMultiplier*=1.5;context.modifierLabels.push(ability==="plus"?"プラス":"マイナス");}
      break;
    case "mega-launcher":
      if(moveIsPulse(context.moveEntry)){context.powerMultiplier*=1.5;context.modifierLabels.push("メガランチャー");}
      break;
    case "mold-breaker":
    case "teravolt":
    case "turboblaze":
      context.ignoreDefenderAbility=true;
      context.modifierLabels.push(getSelectedAbility("attacker")?.nameJa||"かたやぶり系");
      break;
    case "defeatist":
      context.attackMultiplier*=0.5;
      context.modifierLabels.push("よわき");
      break;
    case "dragons-maw":
      if(context.moveType==="ドラゴン"){context.powerMultiplier*=1.5;context.modifierLabels.push("りゅうのあぎと");}
      break;
    default:
      break;
  }
  return context;
}
function applyAttackerPostTypeModifiers(context){
  const ability=getSelectedAbility("attacker")?.apiName||"";
  if(!byId("attackerAbilityEnabled")?.checked||!ability)return context;
  if(ability==="tinted-lens"&&context.typeEffectiveness>0&&context.typeEffectiveness<1){context.typeEffectiveness*=2;context.modifierLabels.push("いろめがね");}
  if(ability==="brain-force"&&context.typeEffectiveness>1){context.finalDamageMultiplier*=1.25;context.modifierLabels.push("ブレインフォース");}
  return context;
}
function applyDefenderAbilityModifiers(context){
  const ability=getSelectedAbility("defender")?.apiName||"";
  if(!byId("defenderAbilityEnabled")?.checked||!ability||context.ignoreDefenderAbility)return context;
  switch(ability){
    case "levitate":
      if(context.moveType==="じめん"){context.typeEffectiveness=0;context.modifierLabels.push("ふゆう");}
      break;
    case "water-absorb":
      if(context.moveType==="みず"){context.typeEffectiveness=0;context.modifierLabels.push("ちょすい");}
      break;
    case "volt-absorb":
      if(context.moveType==="でんき"){context.typeEffectiveness=0;context.modifierLabels.push("ちくでん");}
      break;
    case "lightning-rod":
      if(context.moveType==="でんき"){context.typeEffectiveness=0;context.modifierLabels.push("ひらいしん");}
      break;
    case "motor-drive":
      if(context.moveType==="でんき"){context.typeEffectiveness=0;context.modifierLabels.push("でんきエンジン");}
      break;
    case "storm-drain":
      if(context.moveType==="みず"){context.typeEffectiveness=0;context.modifierLabels.push("よびみず");}
      break;
    case "sap-sipper":
      if(context.moveType==="くさ"){context.typeEffectiveness=0;context.modifierLabels.push("そうしょく");}
      break;
    case "flash-fire":
      if(context.moveType==="ほのお"){context.typeEffectiveness=0;context.modifierLabels.push("もらいび");}
      break;
    case "dry-skin":
      if(context.moveType==="みず"){context.typeEffectiveness=0;context.modifierLabels.push("かんそうはだ");}
      else if(context.moveType==="ほのお"){context.finalDamageMultiplier*=1.25;context.modifierLabels.push("かんそうはだ");}
      break;
    case "earth-eater":
      if(context.moveType==="じめん"){context.typeEffectiveness=0;context.modifierLabels.push("どしょく");}
      break;
    case "well-baked-body":
      if(context.moveType==="ほのお"){context.typeEffectiveness=0;context.modifierLabels.push("こんがりボディ");}
      break;
    case "thick-fat":
      if(context.moveType==="ほのお"||context.moveType==="こおり"){context.finalDamageMultiplier*=0.5;context.modifierLabels.push("あついしぼう");}
      break;
    case "heatproof":
      if(context.moveType==="ほのお"){context.finalDamageMultiplier*=0.5;context.modifierLabels.push("たいねつ");}
      break;
    case "water-bubble":
      if(context.moveType==="ほのお"){context.finalDamageMultiplier*=0.5;context.modifierLabels.push("すいほう");}
      break;
    case "fur-coat":
      if(context.isPhysical){context.defenseMultiplier*=2;context.modifierLabels.push("ファーコート");}
      break;
    case "ice-scales":
      if(!context.isPhysical){context.finalDamageMultiplier*=0.5;context.modifierLabels.push("こおりのりんぷん");}
      break;
    case "soundproof":
      if(moveIsSound(context.moveEntry)){context.typeEffectiveness=0;context.modifierLabels.push("ぼうおん");}
      break;
    case "bulletproof":
      if(moveIsBullet(context.moveEntry)){context.typeEffectiveness=0;context.modifierLabels.push("ぼうだん");}
      break;
    case "overcoat":
      if(moveIsPowder(context.moveEntry)){context.typeEffectiveness=0;context.modifierLabels.push("ぼうじん");}
      break;
    case "marvel-scale":
      if(defenderHasStatusAilment()&&context.isPhysical){context.defenseMultiplier*=1.5;context.modifierLabels.push("ふしぎなうろこ");}
      break;
    case "grass-pelt":
      if(byId("terrain").value==="grassy"&&context.isPhysical){context.defenseMultiplier*=1.5;context.modifierLabels.push("くさのけがわ");}
      break;
    case "shadow-shield":
    case "multiscale":
      if(defenderIsAtFullHp()){if((context.hitCount||1)>1)context.firstHitOnlyFinalDamageMultiplier*=0.5;else context.finalDamageMultiplier*=0.5;context.modifierLabels.push(ability==="shadow-shield"?"ファントムガード":"マルチスケイル");}
      break;
    case "fluffy":
      if(context.moveType==="ほのお"){context.finalDamageMultiplier*=2;context.modifierLabels.push("もふもふ");}
      else if(context.isPhysical&&moveMakesContact(context.moveEntry)){context.finalDamageMultiplier*=0.5;context.modifierLabels.push("もふもふ");}
      break;
    case "filter":
      if(context.typeEffectiveness>1){context.finalDamageMultiplier*=0.75;context.modifierLabels.push("フィルター");}
      break;
    case "solid-rock":
      if(context.typeEffectiveness>1){context.finalDamageMultiplier*=0.75;context.modifierLabels.push("ハードロック");}
      break;
    case "prism-armor":
      if(context.typeEffectiveness>1){context.finalDamageMultiplier*=0.75;context.modifierLabels.push("プリズムアーマー");}
      break;
    case "punk-rock":
      if(moveIsSound(context.moveEntry)){context.finalDamageMultiplier*=0.5;context.modifierLabels.push("パンクロック");}
      break;
    case "purifying-salt":
      if(context.moveType==="ゴースト"){context.finalDamageMultiplier*=0.5;context.modifierLabels.push("きよめのしお");}
      break;
    case "wonder-guard":
      if(context.typeEffectiveness<=1){context.typeEffectiveness=0;context.modifierLabels.push("ふしぎなまもり");}
      break;
    default:
      break;
  }
  return context;
}
function formatMultiplier(multiplier){return `${multiplier.toFixed(2).replace(/\.00$/,"")}x`;}
function updateDamageBar(maxPercent,category){const fill=byId("damageBarFill");fill.style.width=`${Math.min(100,Math.max(0,maxPercent))}%`;fill.classList.remove("damage-bar-fill--physical","damage-bar-fill--special");fill.classList.add(category==="special"?"damage-bar-fill--special":"damage-bar-fill--physical");}
function buildModifierSummary(labels){return labels.length===0?"適用補正: なし":`適用補正: ${labels.join(" / ")}`;}
function updateResultDisplay(payload){byId("damageRange").textContent=payload.range;byId("damagePercent").textContent=payload.percent;byId("koSummary").textContent=payload.ko;byId("finalPowerValue").textContent=payload.finalPower;byId("finalAttackValue").textContent=payload.finalAttack;byId("finalDefenseValue").textContent=payload.finalDefense;byId("typeEffectivenessValue").textContent=payload.typeEffectiveness;byId("stabValue").textContent=payload.stab;byId("modifierSummary").textContent=payload.modifiers;updateDamageBar(payload.bar,payload.category);}
function clearDamageResult(){updateResultDisplay({range:"-",percent:"-",ko:"-",finalPower:"-",finalAttack:"-",finalDefense:"-",typeEffectiveness:"-",stab:"-",modifiers:"-",bar:0,category:"physical"});}
function calculateDamage(){
  syncCalculatedStats();
  const moveEntry=getSelectedMove();
  let moveType=byId("moveType").value;
  const baseMoveCategory=byId("moveCategory").value;
  const selectedVariablePower=getSelectedVariablePower(moveEntry);
  const movePowerInput=selectedVariablePower??clampNumber(Math.round(sanitizeNumber(byId("movePower").value,0)),0,999);
  if(!moveType||!baseMoveCategory||movePowerInput<=0){
    clearDamageResult();
    return;
  }
  const attackerStats=getStats("attacker");
  const defenderStats=getStats("defender");
  const rawAttackStage=sanitizeNumber(byId("attackStage").value,0);
  const rawSpecialAttackStage=sanitizeNumber(byId("specialAttackStage").value,0);
  let moveCategory=baseMoveCategory;
  if(moveUsesHigherOffenseCategory(moveEntry)){
    const stagedAttack=applyStage(attackerStats.atk,rawAttackStage);
    const stagedSpecialAttack=applyStage(attackerStats.spa,rawSpecialAttackStage);
    moveCategory=stagedAttack>stagedSpecialAttack?"physical":"special";
  }
  const isPhysical=moveCategory==="physical";
  const usesDefenseStat=!isPhysical&&moveUsesDefenseStat(moveEntry);
  const attackStageInput=sanitizeNumber(byId(isPhysical?"attackStage":"specialAttackStage").value,0);
  const defenseStageInput=sanitizeNumber(byId(isPhysical||usesDefenseStat?"defenseStage":"specialDefenseStage").value,0);
  const isCriticalHit=byId("isCritical").checked;
  const ignoresNegativeAttackStage=isCriticalHit&&attackStageInput<0;
  const ignoresPositiveDefenseStage=isCriticalHit&&defenseStageInput>0;
  const ignoresDefenderStatStages=moveIgnoresDefenderStatStages(moveEntry);
  const ignoresScreens=isCriticalHit||moveBreaksScreens(moveEntry);
  const effectiveAttackStage=ignoresNegativeAttackStage?0:attackStageInput;
  const effectiveDefenseStage=ignoresDefenderStatStages?0:(ignoresPositiveDefenseStage?0:defenseStageInput);
  const weatherSuppressed=isWeatherSuppressed()&&byId("weather").value!=="none";
  const terrain=byId("terrain").value;
  const attackerGrounded=isGrounded("attacker");
  const defenderGrounded=isGrounded("defender");
  const hitCount=getSelectedMoveHits();
  const moveApiName=moveEntry?.apiName||"";
  let effectiveMovePower=movePowerInput;
  const moveSpecificLabels=[];
  if(selectedVariablePower!==null){
    effectiveMovePower=selectedVariablePower;
    moveSpecificLabels.push(`可変威力 ${effectiveMovePower}`);
  }
  if(moveApiName==="facade"&&["isBurned","hasPoison","hasParalysis"].some((id)=>byId(id)?.checked)){
    effectiveMovePower*=2;
    moveSpecificLabels.push("からげんき");
  }
  if((moveApiName==="hex"||moveApiName==="infernal-parade")&&byId("moveTargetStatused")?.checked){
    effectiveMovePower*=2;
    moveSpecificLabels.push(moveApiName==="hex"?"たたりめ":"しょうねつのたたり");
  }
  if((moveApiName==="venoshock"||moveApiName==="barb-barrage")&&byId("moveTargetStatused")?.checked){
    effectiveMovePower*=2;
    moveSpecificLabels.push(moveApiName==="venoshock"?"ベノムショック":"どくどくバリ");
  }
  if(moveApiName==="acrobatics"&&!hasAttackerHeldItem()){
    effectiveMovePower*=2;
    moveSpecificLabels.push("アクロバット");
  }
  if(moveApiName==="knock-off"&&byId("moveTargetHasItem")?.checked){
    effectiveMovePower=Math.floor(effectiveMovePower*1.5);
    moveSpecificLabels.push("はたきおとす");
  }
  if((moveApiName==="solar-beam"||moveApiName==="solar-blade")&&["rain","sand","snow"].includes(getActiveWeather())){
    effectiveMovePower=Math.max(1,Math.floor(effectiveMovePower/2));
    moveSpecificLabels.push("天候で威力半減");
  }
  if(moveApiName==="terrain-pulse"&&terrain!=="none"&&attackerGrounded){
    moveType=terrainTypeName(terrain)||moveType;
    effectiveMovePower*=2;
    moveSpecificLabels.push("だいちのはどう");
  }
  let context={moveEntry,moveType,originalMoveType:moveType,movePower:effectiveMovePower,isPhysical,hitCount,powerMultiplier:1,attackMultiplier:1,defenseMultiplier:1,finalDamageMultiplier:1,firstHitOnlyFinalDamageMultiplier:1,typeEffectiveness:1,modifierLabels:[...moveSpecificLabels],ignoreDefenderAbility:false};
  if(byId("helpingHand").checked){
    context.powerMultiplier*=1.5;
    context.modifierLabels.push("てだすけ");
  }
  if(byId("allySteelySpirit").checked&&moveType==="はがね"){
    context.powerMultiplier*=1.5;
    context.modifierLabels.push("味方はがねのせいしん");
  }
  if(byId("allyBattery").checked&&!isPhysical){
    context.powerMultiplier*=1.3;
    context.modifierLabels.push("味方バッテリー");
  }
  if(byId("allyPowerSpot").checked){
    context.powerMultiplier*=1.3;
    context.modifierLabels.push("味方パワースポット");
  }
  if(!areItemsSuppressed("attacker")){
    if(byId("muscleBand").checked&&isPhysical){
      context.powerMultiplier*=1.1;
      context.modifierLabels.push("ちからのハチマキ");
    }
    if(byId("wiseGlasses").checked&&!isPhysical){
      context.powerMultiplier*=1.1;
      context.modifierLabels.push("ものしりメガネ");
    }
    if(byId("typeBoostItem").checked&&moveType==="ノーマル"){
      context.powerMultiplier*=1.3;
      context.modifierLabels.push("ジュエル");
    }
    if(byId("choiceBand").checked&&isPhysical){
      context.attackMultiplier*=1.5;
      context.modifierLabels.push("こだわりハチマキ");
    }
    if(byId("choiceSpecs").checked&&!isPhysical){
      context.attackMultiplier*=1.5;
      context.modifierLabels.push("こだわりメガネ");
    }
  }
  context=applyAttackerAbilityModifiers(context);
  moveType=context.moveType;
  const aura=getAuraModifier(moveType);
  if(aura.multiplier!==1){
    context.powerMultiplier*=aura.multiplier;
    context.modifierLabels.push(aura.label);
  }
  if(terrain==="electric"&&moveType==="でんき"&&attackerGrounded){
    context.powerMultiplier*=1.3;
    context.modifierLabels.push("エレキフィールド");
  }
  if(terrain==="electric"&&moveApiName==="rising-voltage"&&defenderGrounded){
    context.powerMultiplier*=2;
    context.modifierLabels.push("ライジングボルト");
  }
  if(terrain==="grassy"&&moveType==="くさ"&&attackerGrounded){
    context.powerMultiplier*=1.3;
    context.modifierLabels.push("グラスフィールド");
  }
  if(terrain==="grassy"&&GRASSY_TERRAIN_HALVED_MOVE_APIS.has(moveApiName)&&defenderGrounded){
    context.powerMultiplier*=0.5;
    context.modifierLabels.push("グラスフィールドで半減");
  }
  if(terrain==="psychic"&&moveType==="エスパー"&&attackerGrounded){
    context.powerMultiplier*=1.3;
    context.modifierLabels.push("サイコフィールド");
  }
  if(terrain==="psychic"&&moveApiName==="expanding-force"&&attackerGrounded){
    context.powerMultiplier*=1.5;
    context.modifierLabels.push("ワイドフォース");
  }
  if(terrain==="misty"&&moveType==="ドラゴン"&&defenderGrounded){
    context.finalDamageMultiplier*=0.5;
    context.modifierLabels.push("ミストフィールド");
  }
  if(terrain==="misty"&&moveApiName==="misty-explosion"&&attackerGrounded){
    context.powerMultiplier*=1.5;
    context.modifierLabels.push("ミストバースト");
  }
  const defenderTypes=[byId("defenderType1").value,byId("defenderType2").value].filter(Boolean);
  context.typeEffectiveness=getTypeEffectiveness(moveType,defenderTypes);
  if(moveApiName==="freeze-dry"&&defenderTypes.includes("みず")){
    context.typeEffectiveness*=4;
    context.modifierLabels.push("フリーズドライ");
  }
  context=applyAttackerPostTypeModifiers(context);
  if(!isPhysical&&getActiveWeather()==="sand"&&defenderTypes.includes("いわ")){
    context.defenseMultiplier*=1.5;
    context.modifierLabels.push("すなあらし特防補正");
  }
  if(isPhysical&&getActiveWeather()==="snow"&&defenderTypes.includes("こおり")){
    context.defenseMultiplier*=1.5;
    context.modifierLabels.push("ゆき防御補正");
  }
  if(!areItemsSuppressed("defender")){
    if(byId("assaultVest").checked&&!isPhysical){
      context.defenseMultiplier*=1.5;
      context.modifierLabels.push("とつげきチョッキ");
    }
    if(byId("eviolite").checked){
      context.defenseMultiplier*=1.5;
      context.modifierLabels.push("しんかのきせき");
    }
  }
  context=applyRuinAbilityModifiers(context);
  context=applyDefenderAbilityModifiers(context);
  let attackerStatValue=isPhysical?attackerStats.atk:attackerStats.spa;
  const usesManualAttackStat=USER_DEFENSE_ATTACK_MOVE_APIS.has(moveApiName)||TARGET_ATTACK_POWER_MOVE_APIS.has(moveApiName);
  if(USER_DEFENSE_ATTACK_MOVE_APIS.has(moveApiName)){
    attackerStatValue=getClampedPositiveInt("moveUserDefenseActual",100,999);
    context.modifierLabels.push("自分防御参照");
  }else if(TARGET_ATTACK_POWER_MOVE_APIS.has(moveApiName)){
    attackerStatValue=getClampedPositiveInt("moveTargetAttackActual",100,999);
    context.modifierLabels.push("相手攻撃参照");
  }else if(moveUsesHigherOffenseCategory(moveEntry)){
    context.modifierLabels.push(moveCategory==="physical"?"高い攻撃値で物理化":"高い攻撃値で特殊維持");
  }
  const defenderStatValue=usesDefenseStat?defenderStats.def:(isPhysical?defenderStats.def:defenderStats.spd);
  const finalPower=Math.max(1,Math.floor(context.movePower*context.powerMultiplier));
  const finalAttack=Math.max(1,Math.floor(applyStage(attackerStatValue,usesManualAttackStat?0:effectiveAttackStage)*context.attackMultiplier));
  const finalDefense=Math.max(1,Math.floor(applyStage(defenderStatValue,effectiveDefenseStage)*context.defenseMultiplier));
  const stab=getStabModifier(moveType);
  const weather=getWeatherModifier(moveType);
  const critical=isCriticalHit?1.5:1;
  const burn=isPhysical&&byId("isBurned").checked&&!isAbilityActive("attacker","guts")&&!isAbilityActive("attacker","water-bubble")?0.5:1;
  const spread=byId("doubleBattle").checked&&byId("applySpreadPenalty").checked&&isSpreadTarget(byId("moveTarget").value)?0.75:1;
  if(spread!==1)context.modifierLabels.push("範囲減衰");
  if(hitCount>1)context.modifierLabels.push(`${hitCount}回命中`);
  if(isCriticalHit)context.modifierLabels.push("急所");
  if(usesDefenseStat)context.modifierLabels.push("防御参照");
  if(ignoresNegativeAttackStage)context.modifierLabels.push("急所で攻撃下降無視");
  if(ignoresDefenderStatStages)context.modifierLabels.push("相手能力変化無視");
  else if(ignoresPositiveDefenseStage)context.modifierLabels.push("急所で防御上昇無視");
  if(isAbilityActive("attacker","adaptability")&&stab!==1)context.modifierLabels.push("てきおうりょく");
  if(stab!==1)context.modifierLabels.push(`タイプ一致 ${formatMultiplier(stab)}`);
  if(weather!==1)context.modifierLabels.push(getActiveWeather()==="sun"?"晴れ補正":"雨補正");
  if(weatherSuppressed)context.modifierLabels.push("エアロック系");
  if(burn!==1)context.modifierLabels.push("やけど");
  const screenActive=byId("auroraVeil").checked||(isPhysical?byId("reflect").checked:byId("lightScreen").checked);
  if(screenActive){
    if(ignoresScreens){
      context.modifierLabels.push(isCriticalHit?"急所で壁無視":"壁破壊");
    }else{
      context.finalDamageMultiplier*=byId("doubleBattle").checked?2/3:0.5;
      context.modifierLabels.push(byId("auroraVeil").checked?"オーロラベール":isPhysical?"リフレクター":"ひかりのかべ");
    }
  }
  if(!areItemsSuppressed("attacker")&&byId("lifeOrb").checked){
    context.finalDamageMultiplier*=1.3;
    context.modifierLabels.push("いのちのたま");
  }
  if(!areItemsSuppressed("attacker")&&byId("expertBelt").checked&&context.typeEffectiveness>1){
    context.finalDamageMultiplier*=1.2;
    context.modifierLabels.push("たつじんのおび");
  }
  if(!areItemsSuppressed("defender")&&byId("resistBerry").checked&&context.typeEffectiveness>1){
    context.finalDamageMultiplier*=0.5;
    context.modifierLabels.push("半減きのみ");
  }
  if(context.typeEffectiveness===0){
    updateResultDisplay({range:"0 - 0",percent:"0.0% - 0.0%",ko:"無効",finalPower:String(finalPower),finalAttack:String(finalAttack),finalDefense:String(finalDefense),typeEffectiveness:formatMultiplier(context.typeEffectiveness),stab:formatMultiplier(stab),modifiers:buildModifierSummary(context.modifierLabels),bar:0,category:moveCategory});
    return;
  }
  const level=sanitizeNumber(byId("level").value,50);
  const baseDamage=Math.floor(Math.floor(Math.floor((((level*2)/5+2)*finalPower*finalAttack)/finalDefense)/50)+2);
  const hp=Math.max(1,defenderStats.hp||1);
  const rolls=[];
  for(let roll=85;roll<=100;roll+=1){
    let damage=baseDamage;
    damage=Math.max(1,Math.floor(damage*spread));
    damage=Math.max(1,Math.floor(damage*weather));
    damage=Math.max(1,Math.floor(damage*critical));
    damage=Math.max(1,Math.floor((damage*roll)/100));
    damage=Math.max(1,Math.floor(damage*stab));
    damage=Math.max(1,Math.floor(damage*context.typeEffectiveness));
    damage=Math.max(1,Math.floor(damage*burn));
    damage=Math.max(1,Math.floor(damage*context.finalDamageMultiplier));
    const firstHitDamage=context.firstHitOnlyFinalDamageMultiplier!==1?Math.max(1,Math.floor(damage*context.firstHitOnlyFinalDamageMultiplier)):damage;
    const totalDamage=hitCount>1&&context.firstHitOnlyFinalDamageMultiplier!==1?firstHitDamage+damage*(hitCount-1):damage*hitCount;
    rolls.push(totalDamage);
  }
  const minDamage=Math.min(...rolls),maxDamage=Math.max(...rolls),minPercent=minDamage/hp*100,maxPercent=maxDamage/hp*100,ohkoCount=rolls.filter((value)=>value>=hp).length;
  let koText=`${Math.ceil(hp/maxDamage)}発目安`;
  if(minDamage>=hp)koText="確定1発";
  else if(ohkoCount>0)koText=`乱数1発 ${((ohkoCount/16)*100).toFixed(1)}%`;
  else if(minDamage*2>=hp)koText="確定2発";
  else if(maxDamage*2>=hp)koText="乱数2発";
  updateResultDisplay({range:`${minDamage} - ${maxDamage}`,percent:`${minPercent.toFixed(1)}% - ${maxPercent.toFixed(1)}%`,ko:koText,finalPower:String(finalPower),finalAttack:String(finalAttack),finalDefense:String(finalDefense),typeEffectiveness:formatMultiplier(context.typeEffectiveness),stab:formatMultiplier(stab),modifiers:buildModifierSummary(context.modifierLabels),bar:Math.min(maxPercent,100),category:moveCategory});
}
function typeIconPath(type){return type?`type/${type}.png`:"";}
function renderTypeIcons(targetId,types){byId(targetId).innerHTML=(types||[]).filter(Boolean).map((type)=>`<span class="type-icon-chip" title="${escapeHtml(type)}"><img src="${escapeHtml(typeIconPath(type))}" alt="${escapeHtml(type)}"></span>`).join("");}
function renderMoveTypeIcon(type){byId("moveTypeIcon").innerHTML=type?`<img src="${escapeHtml(typeIconPath(type))}" alt="${escapeHtml(type)}">`:"";}
function renderPokemonArtwork(side,entry){const image=byId(`${side}Artwork`),fallback=byId(`${side}ArtworkFallback`),label=byId(`${side}ArtworkLabel`);if(!entry){image.classList.add("is-hidden");image.removeAttribute("src");fallback.classList.remove("is-hidden");label.textContent="ポケモンを選択";return;}const src=entry.sprites?.artwork||entry.sprites?.sprite||"";if(src){image.src=src;image.classList.remove("is-hidden");fallback.classList.add("is-hidden");}else{image.classList.add("is-hidden");image.removeAttribute("src");fallback.classList.remove("is-hidden");}label.textContent=entry.nameJa||entry.nameEn||entry.apiName||"ポケモン";}
function summarizeBaseStats(side){const visible=new Set(SIDE_VISIBLE_STATS[side]);return STATS.filter((stat)=>visible.has(stat.key)).map((stat)=>`${stat.label}${getBaseStat(side,stat.key)}`).join(" ");}
function inferGroundedDefault(side,entry){if(!entry)return true;const hasFlyingType=(entry.types||[]).includes("ひこう");const selectedAbilityApiName=byId(`${side}Ability`)?.value||"";return !(hasFlyingType||selectedAbilityApiName==="levitate");}
function updateSummaryPanels(){const attackerTypes=[byId("attackerType1").value,byId("attackerType2").value].filter(Boolean);const defenderTypes=[byId("defenderType1").value,byId("defenderType2").value].filter(Boolean);const attackerAbility=getSelectedAbility("attacker");const defenderAbility=getSelectedAbility("defender");const moveEntry=getSelectedMove();const moveType=byId("moveType").value||"-";const moveCategory=byId("moveCategory").value==="physical"?"物理":"特殊";const movePower=getSelectedVariablePower(moveEntry)??sanitizeNumber(byId("movePower").value,0);const moveAccuracy=byId("moveAccuracy").value||"-";const moveTarget=byId("moveTarget").value||"-";const moveHits=getMoveHitRange(moveEntry)?` / ${getSelectedMoveHits()}回`:"";const attackerAbilityLabel=attackerAbility?`${abilityOptionLabel(attackerAbility)} ${byId("attackerAbilityEnabled").checked?"(発動)":"(未発動)"}`:"-";const defenderAbilityLabel=defenderAbility?`${abilityOptionLabel(defenderAbility)} ${byId("defenderAbilityEnabled").checked?"(発動)":"(未発動)"}`:"-";renderTypeIcons("attackerTypeIcons",attackerTypes);renderTypeIcons("defenderTypeIcons",defenderTypes);renderMoveTypeIcon(byId("moveType").value);byId("attackerSummary").textContent=`${attackerTypes.join(" / ")||"-"} | 特性:${attackerAbilityLabel} | ${summarizeBaseStats("attacker")}`;byId("defenderSummary").textContent=`${defenderTypes.join(" / ")||"-"} | 特性:${defenderAbilityLabel} | ${summarizeBaseStats("defender")}`;byId("moveSummaryText").textContent=`${moveType} / ${moveCategory} / 威力${movePower} / 命中${moveAccuracy} / ${moveTarget}${moveHits}`;byId("battleSummaryAttacker").textContent=`${byId("attackerName").value||"-"} | ${attackerTypes.join(" / ")||"-"} | ${attackerAbilityLabel}`;byId("battleSummaryMove").textContent=`${byId("moveName").value||"-"} | ${moveType} / ${moveCategory}${moveHits}`;byId("battleSummaryDefender").textContent=`${byId("defenderName").value||"-"} | ${defenderTypes.join(" / ")||"-"} | ${defenderAbilityLabel}`;}
function updateMoveHitOptions(entry){const field=byId("moveHitsField"),select=byId("moveHits");if(!field||!select)return;const range=getMoveHitRange(entry);if(!range){field.classList.add("is-hidden");select.innerHTML="";select.value="1";return;}const previousValue=sanitizeNumber(select.value,range.min);const options=[];for(let hits=range.min;hits<=range.max;hits+=1)options.push(optionMarkup(String(hits),`${hits}回`));select.innerHTML=options.join("");select.value=String(clampNumber(previousValue,range.min,range.max));field.classList.remove("is-hidden");}
function syncVariablePowerInput(entry,preferredValue=null){
  const input=byId("moveVariablePower");
  if(!input)return;
  const values=getVariablePowerOptions(entry);
  const defaultValue=getVariablePowerDefault(entry);
  const preferredNumber=sanitizeNumber(preferredValue,defaultValue);
  input.innerHTML=values.map((value)=>optionMarkup(String(value),`${value}`)).join("");
  const nextValue=values.includes(preferredNumber)?preferredNumber:(values.includes(defaultValue)?defaultValue:(values[0]||defaultValue));
  input.value=String(nextValue);
}
function findEntryExact(map,rawQuery){const key=normalizeSearchText(rawQuery);return key?(map.get(key)||null):null;}
function findEntryFuzzy(map,rawQuery){const key=normalizeSearchText(rawQuery);if(!key)return null;if(map.has(key))return map.get(key);for(const [candidate,entry] of map.entries()){if(candidate.includes(key))return entry;}return null;}
function applyPokemonToSide(side,entry){dataStore.selectedPokemon[side]=entry;byId(`${side}Name`).value=entry.displayName||entry.nameJa||entry.nameEn||entry.apiName;byId(`${side}Type1`).value=entry.types?.[0]||"";byId(`${side}Type2`).value=entry.types?.[1]||"";renderAbilityOptions(side,entry);const grounded=byId(`${side}Grounded`);if(grounded)grounded.checked=inferGroundedDefault(side,entry);Object.entries(entry.stats||{}).forEach(([statKey,value])=>{const base=byId(`${side}-${statKey}-base`);if(base)base.textContent=String(value);});renderPokemonArtwork(side,entry);updateCalculator();}
function applyMoveEntry(entry){const previousVariablePower=byId("moveVariablePower")?.value;dataStore.selectedMove=entry;byId("moveName").value=entry.nameJa||entry.nameEn||entry.apiName;byId("moveType").value=entry.type||"";byId("moveCategory").value=entry.category==="special"?"special":"physical";byId("movePower").value=String(entry.power||0);byId("moveAccuracy").value=entry.accuracy==null?"--":String(entry.accuracy);if(entry.target)byId("moveTarget").value=entry.target;updateMoveHitOptions(entry);syncVariablePowerInput(entry,previousVariablePower);syncMoveSpecificFields(entry);updateCalculator();}
function tryApplyPokemon(side,exactOnly=false,silent=false){const field=byId(`${side}Name`),status=byId(`${side}LookupStatus`),finder=exactOnly?findEntryExact:findEntryFuzzy;const entry=finder(dataStore.pokemonLookup,field.value);if(!entry){status.textContent=!silent&&field.value.trim()?"該当するポケモンが見つかりません。":"";return false;}applyPokemonToSide(side,entry);status.textContent=`${entry.nameJa||entry.nameEn} を反映しました。`;return true;}
function tryApplyMove(exactOnly=false,silent=false){const field=byId("moveName"),status=byId("moveLookupStatus"),finder=exactOnly?findEntryExact:findEntryFuzzy;const entry=finder(dataStore.moveLookup,field.value);if(!entry){dataStore.selectedMove=null;updateMoveHitOptions(null);syncMoveSpecificFields(null);status.textContent=!silent&&field.value.trim()?"該当する技が見つかりません。":"";return false;}applyMoveEntry(entry);status.textContent=`${entry.nameJa||entry.nameEn} を反映しました。`;return true;}
function saveState(){const state={};FIELD_IDS.forEach((id)=>{const element=byId(id);if(!element)return;state[id]=element.type==="checkbox"?element.checked:element.value;});["attacker","defender"].forEach((side)=>{STATS.forEach((stat)=>{["ev","nature","actual"].forEach((suffix)=>{const element=byId(`${side}-${stat.key}-${suffix}`);if(element)state[`${side}-${stat.key}-${suffix}`]=element.value;});});});localStorage.setItem("pokemon-damage-tool-state",JSON.stringify(state));}
function restoreState(){const raw=localStorage.getItem("pokemon-damage-tool-state");if(!raw)return;try{const state=JSON.parse(raw);Object.entries(state).forEach(([key,value])=>{const element=byId(key);if(!element)return;if(element.type==="checkbox")element.checked=Boolean(value);else element.value=value;});}catch(error){console.warn("restore failed",error);}}
function updateCalculator(){["attacker","defender"].forEach((side)=>STATS.forEach((stat)=>normalizeEffortInput(side,stat.key)));syncCalculatedStats();syncAbilityDerivedModifiers();syncMoveSpecificFields();updateSummaryPanels();calculateDamage();}
function bindLookupEvents(){byId("applyAttackerButton").addEventListener("click",()=>{tryApplyPokemon("attacker");saveState();});byId("applyDefenderButton").addEventListener("click",()=>{tryApplyPokemon("defender");saveState();});byId("applyMoveButton").addEventListener("click",()=>{tryApplyMove();saveState();});["attacker","defender"].forEach((side)=>{const field=byId(`${side}Name`);field.addEventListener("input",()=>{if(tryApplyPokemon(side,true,true))saveState();});field.addEventListener("change",()=>{tryApplyPokemon(side,false);saveState();});});const moveField=byId("moveName");moveField.addEventListener("input",()=>{if(tryApplyMove(true,true))saveState();});moveField.addEventListener("change",()=>{tryApplyMove(false);saveState();});}
function bindFieldEvents(){FIELD_IDS.forEach((id)=>{const element=byId(id);if(!element)return;element.addEventListener("input",()=>{updateCalculator();saveState();});element.addEventListener("change",()=>{updateCalculator();saveState();});});["attacker","defender"].forEach((side)=>{STATS.forEach((stat)=>{const ev=byId(`${side}-${stat.key}-ev`),nature=byId(`${side}-${stat.key}-nature`),actual=byId(`${side}-${stat.key}-actual`);if(ev){ev.addEventListener("keydown",(event)=>{if(event.key==="ArrowUp"||event.key==="ArrowDown"){event.preventDefault();applyEffortStep(side,stat.key,event.key==="ArrowUp"?1:-1);}});ev.addEventListener("input",()=>{updateCalculator();saveState();});ev.addEventListener("change",()=>{normalizeEffortInput(side,stat.key);updateCalculator();saveState();});}if(nature){nature.addEventListener("change",()=>{updateCalculator();saveState();});}if(actual){actual.addEventListener("keydown",(event)=>{if(event.key==="Enter"){event.preventDefault();commitActualInput(side,stat.key);}});actual.addEventListener("change",()=>{commitActualInput(side,stat.key);});}});});document.querySelectorAll(".effort-stepper-button").forEach((button)=>{button.addEventListener("click",()=>{applyEffortStep(button.dataset.side,button.dataset.stat,sanitizeNumber(button.dataset.direction,0));});});}
function initializeDefaults(){renderStages("attackStage");renderStages("specialAttackStage");renderStages("defenseStage");renderStages("specialDefenseStage");renderStatRows("attacker");renderStatRows("defender");}
function initializeSelectors(){renderTypeOptions(byId("attackerType1"),true);renderTypeOptions(byId("attackerType2"),true);renderTypeOptions(byId("defenderType1"),true);renderTypeOptions(byId("defenderType2"),true);renderTypeOptions(byId("moveType"),false);renderTargetOptions();renderAbilityOptions("attacker",null);renderAbilityOptions("defender",null);}
function initialize(){if(isBlockedHost()){renderBlockedHostMessage();return;}initializeDefaults();if(!buildDataStore())return;initializeSelectors();fillDataList("pokemonOptions",dataStore.pokemonEntries);fillDataList("moveOptions",dataStore.moveEntries);bindLookupEvents();bindFieldEvents();restoreState();tryApplyPokemon("attacker",false,true);tryApplyPokemon("defender",false,true);tryApplyMove(false,true);renderPokemonArtwork("attacker",findEntryExact(dataStore.pokemonLookup,byId("attackerName").value));renderPokemonArtwork("defender",findEntryExact(dataStore.pokemonLookup,byId("defenderName").value));updateCalculator();}
initialize();

