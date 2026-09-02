export const DAILY_PRAYERS = Object.freeze({
  诞育: { prayer: "感孕生命，衍育自然", god: "生命之神" }, 繁荣: { prayer: "万物滋生，亦繁亦荣", god: "繁荣之神" }, 死亡: { prayer: "灵魂安眠，生命终焉", god: "死亡之神" },
  污堕: { prayer: "解脱枷锁，直面心欲", god: "欲望之神" }, 腐朽: { prayer: "众生应腐，万物将朽", god: "腐朽之神" }, 湮灭: { prayer: "于无中生，于寂中灭", god: "湮灭之神" },
  秩序: { prayer: "文明火起，秩序长存", god: "秩序之神" }, 真理: { prayer: "洞窥本质，行见真理", god: "真理之神" }, 战争: { prayer: "何以求存，唯血与火", god: "战争之神" },
  混乱: { prayer: "虚构规律，寰宇笑谈", god: "混乱之神" }, 痴愚: { prayer: "生命皆痴，文明皆愚", god: "痴愚之神" }, 沉默: { prayer: "万物归寂，寰宇无音", god: "沉默之神" },
  记忆: { prayer: "昔我长铭，流光拓影", god: "记忆之神" }, 时间: { prayer: "时光如隙，我亦如风", god: "时间之神" }, 欺诈: { prayer: "不辨真伪，勿论虚实", god: "欺诈之神" },
  命运: { prayer: "命若繁星，望而不及", god: "命运之神" },
} as const);

export const PRAYER_BY_WORD = new Map(Object.entries(DAILY_PRAYERS).map(([faith, value]) => [value.prayer, { faith, god: value.god }]));
