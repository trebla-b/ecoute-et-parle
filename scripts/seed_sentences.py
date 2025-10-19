#!/usr/bin/env python3
"""
Seed the local CSV data folder with a curated multilingual sentence bank.

Usage:
    python3 scripts/seed_sentences.py
"""

from __future__ import annotations

import csv
from datetime import datetime
from pathlib import Path
from typing import TypedDict
from uuid import uuid4

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
SENTENCES_CSV = DATA_DIR / "sentences.csv"


class SentenceRow(TypedDict):
    id: str
    target_lang: str
    sentence_text: str
    translation_lang: str
    translation_text: str
    difficulty: str
    tags: str
    created_at: str
    updated_at: str


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def build_sentences() -> list[SentenceRow]:
    timestamp = now_iso()
    rows: list[SentenceRow] = []

    def add(sentence: str, translation: str, difficulty: str, tags: str) -> None:
        rows.append(
            {
                "id": str(uuid4()),
                "target_lang": "fr-FR",
                "sentence_text": sentence,
                "translation_lang": "zh-CN",
                "translation_text": translation,
                "difficulty": difficulty,
                "tags": tags,
                "created_at": timestamp,
                "updated_at": timestamp,
            }
        )

    # Easy (20)
    easy_sentences = [
        ("Bonjour, comment ça va ?", "你好，你好吗？", "salutation"),
        ("Je m'appelle Marie.", "我叫玛丽。", "présentation"),
        ("J'habite à Lyon.", "我住在里昂。", "ville"),
        ("Je voudrais un café, s'il vous plaît.", "请给我一杯咖啡。", "restaurant,commande"),
        ("Il fait beau aujourd'hui.", "今天天气很好。", "météo"),
        ("Où est la gare ?", "火车站在哪里？", "transport,direction"),
        ("Je suis heureux de te voir.", "见到你我很高兴。", "émotion"),
        ("Quel âge as-tu ?", "你多大了？", "conversation"),
        ("Je travaille demain matin.", "我明天早上要工作。", "temps,travail"),
        ("Nous partons en vacances.", "我们要去度假。", "voyage"),
        ("J'aime écouter de la musique.", "我喜欢听音乐。", "loisir"),
        ("Peux-tu répéter, s'il te plaît ?", "请你再重复一遍好吗？", "conversation"),
        ("Le train arrive à midi.", "火车中午到。", "transport"),
        ("Je prends le bus pour l'école.", "我坐公交车去学校。", "transport,école"),
        ("Elle lit un nouveau livre.", "她正在读一本新书。", "lecture"),
        ("Nous avons un chien.", "我们有一只狗。", "famille"),
        ("Je prépare le dîner.", "我在准备晚餐。", "cuisine"),
        ("Il pleut cet après-midi.", "今天下午在下雨。", "météo"),
        ("Je vais au marché.", "我要去市场。", "courses"),
        ("Merci pour votre aide.", "谢谢您的帮助。", "politesse"),
    ]
    for sentence, translation, tags in easy_sentences:
        add(sentence, translation, "easy", tags)

    # Medium (20)
    medium_sentences = [
        ("Je dois acheter des légumes frais pour la soupe.", "我得买些新鲜蔬菜来做汤。", "courses,cuisine"),
        ("Ils attendent leurs amis devant le cinéma.", "他们在电影院前等朋友。", "rendez-vous,loisir"),
        ("Nous avons réservé une table pour quatre personnes.", "我们预订了一张四人桌。", "restaurant"),
        ("Le médecin m'a conseillé de faire plus d'exercice.", "医生建议我多运动。", "santé"),
        ("Peux-tu me prêter ta voiture ce week-end ?", "这个周末你能把车借给我吗？", "favori,transport"),
        (
            "Je cherche un cadeau original pour l'anniversaire de ma sœur.",
            "我在找一个特别的礼物送给我妹妹过生日。",
            "famille,shopping",
        ),
        ("Nous avons visité un musée d'art contemporain.", "我们参观了一个当代艺术博物馆。", "culture"),
        ("Ils habitent dans un petit village près de la mer.", "他们住在海边的一个小村庄。", "ville,géographie"),
        ("Je dois terminer ce rapport avant vendredi soir.", "我必须在周五晚上之前完成这份报告。", "travail"),
        ("Le train a été retardé à cause du mauvais temps.", "由于恶劣天气火车晚点了。", "transport,météo"),
        ("Nous avons adopté un chat noir l'automne dernier.", "去年秋天我们收养了一只黑猫。", "animaux"),
        ("Ils organisent une fête surprise pour leur ami.", "他们正在为朋友筹办惊喜派对。", "événement"),
        ("J'apprends le français depuis six mois.", "我学法语已经六个月了。", "langue"),
        ("Elle joue du piano depuis son enfance.", "她从小就弹钢琴。", "musique"),
        ("Le professeur a expliqué la leçon avec patience.", "老师耐心地讲解了这课。", "éducation"),
        ("Nous avons fait une randonnée dans les Alpes.", "我们在阿尔卑斯山徒步旅行。", "voyage,nature"),
        ("Je dois renouveler mon passeport avant de voyager.", "出行前我得更新护照。", "administratif"),
        ("Ils discutent des prochaines élections municipales.", "他们正在讨论即将到来的市政选举。", "politique"),
        ("Elle prépare un dessert au chocolat pour ses invités.", "她正在为客人准备巧克力甜点。", "cuisine"),
        ("Nous avons planté des fleurs dans le jardin ce matin.", "我们今天早上在花园里种了花。", "jardinage"),
    ]
    for sentence, translation, tags in medium_sentences:
        add(sentence, translation, "medium", tags)

    # Hard (20)
    hard_sentences = [
        (
            "Même si la pluie tombait sans cesse, ils décidèrent de continuer leur promenade le long du fleuve.",
            "尽管雨不停地下，他们还是决定沿着河边继续散步。",
            "météo,nature",
        ),
        (
            "Il faudra négocier attentivement le contrat afin d'éviter toute ambiguïté juridique.",
            "必须仔细谈判合同以避免任何法律上的歧义。",
            "travail,juridique",
        ),
        (
            "Ayant oublié son parapluie, elle improvisa un abri avec son sac et un vieux journal.",
            "她忘了带伞，只好用包和旧报纸临时遮雨。",
            "quotidien,improvisation",
        ),
        (
            "Le chef a revisité ce plat traditionnel en y ajoutant des épices venues d'Asie.",
            "主厨在这道传统菜里加入来自亚洲的香料进行了改良。",
            "cuisine,innovation",
        ),
        (
            "Nous devrons analyser les résultats dans leur contexte historique pour comprendre leurs conséquences.",
            "我们必须在历史背景下分析这些结果，才能理解其影响。",
            "histoire,analyse",
        ),
        (
            "Bien qu'ils aient peu dormi, ils terminèrent le projet avant l'échéance fixée.",
            "尽管睡得很少，他们还是在截止日期前完成了项目。",
            "travail,projet",
        ),
        (
            "Si tu avais assisté à la réunion, tu aurais compris les enjeux financiers.",
            "如果你参加了会议，你就会明白其中的财务问题。",
            "finance,conditionnel",
        ),
        (
            "Elle raconte avec émotion les souvenirs d'enfance passés dans cette maison isolée.",
            "她饱含深情地讲述在那座偏僻房子里度过的童年回忆。",
            "souvenir,émotion",
        ),
        (
            "Après avoir consulté plusieurs experts, ils ont finalement opté pour une solution durable.",
            "在咨询了几位专家后，他们最终选择了一个可持续的方案。",
            "environnement,décision",
        ),
        (
            "Le scientifique a démontré l'hypothèse grâce à une série d'expériences minutieuses.",
            "科学家通过一系列细致的实验证明了这个假设。",
            "science,recherche",
        ),
        (
            "Malgré les obstacles administratifs, l'association a réussi à obtenir les autorisations nécessaires.",
            "尽管有行政障碍，该协会还是成功获得了必要的许可。",
            "administratif,association",
        ),
        (
            "Elle a confié son manuscrit à un éditeur qui a accepté de le publier l'année prochaine.",
            "她把手稿交给了一位编辑，后者同意在明年出版。",
            "littérature,édition",
        ),
        (
            "Nous avions beau insister, il refusait de reconnaître son erreur devant le comité.",
            "尽管我们一再坚持，他还是拒绝在委员会面前承认自己的错误。",
            "travail,conflit",
        ),
        (
            "Les voyageurs, fatigués mais enthousiastes, atteignirent enfin le sommet enneigé.",
            "旅客们虽然疲惫但充满热情，终于登上了白雪覆盖的山顶。",
            "voyage,montagne",
        ),
        (
            "Une fois les documents signés, le chantier pourra officiellement commencer.",
            "文件一旦签署，工地就可以正式开工。",
            "construction,administratif",
        ),
        (
            "Le directeur espère que cette initiative encouragera l'innovation au sein de l'entreprise.",
            "主管希望这项举措能促进公司内部的创新。",
            "entreprise,innovation",
        ),
        (
            "Ils ont été impressionnés par la richesse du patrimoine culturel de la région.",
            "他们对该地区丰富的文化遗产印象深刻。",
            "culture,patrimoine",
        ),
        (
            "Avant que tu ne partes, pourrais-tu vérifier l'état des réservations pour la semaine prochaine ?",
            "在你离开之前，能否检查一下下周的预订情况？",
            "organisation,travail",
        ),
        (
            "La conférence a mis en lumière l'importance de la coopération internationale face aux défis climatiques.",
            "会议强调了面对气候挑战国际合作的重要性。",
            "climat,coopération",
        ),
        (
            "À condition que toutes les parties soient d'accord, nous signerons le partenariat mardi prochain.",
            "只要各方同意，我们将在下周二签署合作协议。",
            "négociation,entreprise",
        ),
    ]
    for sentence, translation, tags in hard_sentences:
        add(sentence, translation, "hard", tags)

    return rows


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    sentences = build_sentences()
    fieldnames = [
        "id",
        "target_lang",
        "sentence_text",
        "translation_lang",
        "translation_text",
        "difficulty",
        "tags",
        "created_at",
        "updated_at",
    ]
    with SENTENCES_CSV.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(sentences)
    print(f"Seeded {len(sentences)} sentences into {SENTENCES_CSV.relative_to(BASE_DIR)}")


if __name__ == "__main__":
    main()
