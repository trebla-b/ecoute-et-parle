#!/usr/bin/env python3
"""
Seed the local CSV data folder with a curated set of practice sentences.

Usage:
    python scripts/seed_sentences.py
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
    fr_text: str
    en_text: str
    difficulty: str
    tags: str
    created_at: str
    updated_at: str


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def build_sentences() -> list[SentenceRow]:
    timestamp = now_iso()
    raw = [
        # Easy
        ("Bonjour, comment ça va ?", "Hello, how are you?", "easy", "salutation"),
        ("Je m'appelle Marie.", "My name is Marie.", "easy", "présentation"),
        ("J'habite à Lyon.", "I live in Lyon.", "easy", "ville"),
        ("Je voudrais un café, s'il vous plaît.", "I'd like a coffee, please.", "easy", "restaurant,commande"),
        ("Il fait beau aujourd'hui.", "The weather is nice today.", "easy", "météo"),
        ("Où est la gare ?", "Where is the train station?", "easy", "transport,direction"),
        ("Je suis heureux de te voir.", "I'm happy to see you.", "easy", "émotion"),
        ("Quel âge as-tu ?", "How old are you?", "easy", "conversation"),
        ("Je travaille demain matin.", "I work tomorrow morning.", "easy", "temps,travail"),
        ("Nous partons en vacances.", "We're leaving on vacation.", "easy", "voyage"),
        ("J'aime écouter de la musique.", "I like listening to music.", "easy", "loisir"),
        ("Peux-tu répéter, s'il te plaît ?", "Can you repeat, please?", "easy", "conversation"),
        ("Le train arrive à midi.", "The train arrives at noon.", "easy", "transport"),
        ("Je prends le bus pour l'école.", "I take the bus to school.", "easy", "transport,école"),
        ("Elle lit un nouveau livre.", "She is reading a new book.", "easy", "lecture"),
        ("Nous avons un chien.", "We have a dog.", "easy", "famille"),
        ("Je prépare le dîner.", "I'm preparing dinner.", "easy", "cuisine"),
        ("Il pleut cet après-midi.", "It's raining this afternoon.", "easy", "météo"),
        ("Je vais au marché.", "I'm going to the market.", "easy", "courses"),
        ("Merci pour votre aide.", "Thank you for your help.", "easy", "politesse"),
        # Medium
        ("Je dois acheter des légumes frais pour la soupe.", "I need to buy fresh vegetables for the soup.", "medium", "courses,cuisine"),
        ("Ils attendent leurs amis devant le cinéma.", "They are waiting for their friends in front of the cinema.", "medium", "rendez-vous,loisir"),
        ("Nous avons réservé une table pour quatre personnes.", "We reserved a table for four people.", "medium", "restaurant"),
        ("Le médecin m'a conseillé de faire plus d'exercice.", "The doctor advised me to exercise more.", "medium", "santé"),
        ("Peux-tu me prêter ta voiture ce week-end ?", "Can you lend me your car this weekend?", "medium", "favori,transport"),
        ("Je cherche un cadeau original pour l'anniversaire de ma sœur.", "I'm looking for an original gift for my sister's birthday.", "medium", "famille,shopping"),
        ("Nous avons visité un musée d'art contemporain.", "We visited a contemporary art museum.", "medium", "culture"),
        ("Ils habitent dans un petit village près de la mer.", "They live in a small village near the sea.", "medium", "ville,géographie"),
        ("Je dois terminer ce rapport avant vendredi soir.", "I must finish this report before Friday evening.", "medium", "travail"),
        ("Le train a été retardé à cause du mauvais temps.", "The train was delayed because of the bad weather.", "medium", "transport,météo"),
        ("Nous avons adopté un chat noir l'automne dernier.", "We adopted a black cat last autumn.", "medium", "animaux"),
        ("Ils organisent une fête surprise pour leur ami.", "They're organizing a surprise party for their friend.", "medium", "événement"),
        ("J'apprends le français depuis six mois.", "I've been learning French for six months.", "medium", "langue"),
        ("Elle joue du piano depuis son enfance.", "She has played the piano since childhood.", "medium", "musique"),
        ("Le professeur a expliqué la leçon avec patience.", "The teacher explained the lesson patiently.", "medium", "éducation"),
        ("Nous avons fait une randonnée dans les Alpes.", "We went for a hike in the Alps.", "medium", "voyage,nature"),
        ("Je dois renouveler mon passeport avant de voyager.", "I need to renew my passport before traveling.", "medium", "administratif"),
        ("Ils discutent des prochaines élections municipales.", "They are discussing the upcoming municipal elections.", "medium", "politique"),
        ("Elle prépare un dessert au chocolat pour ses invités.", "She's preparing a chocolate dessert for her guests.", "medium", "cuisine"),
        ("Nous avons planté des fleurs dans le jardin ce matin.", "We planted flowers in the garden this morning.", "medium", "jardinage"),
        # Hard
        ("Même si la pluie tombait sans cesse, ils décidèrent de continuer leur promenade le long du fleuve.", "Even though the rain kept falling, they decided to continue their walk along the river.", "hard", "météo,nature"),
        ("Il faudra négocier attentivement le contrat afin d'éviter toute ambiguïté juridique.", "The contract will need to be negotiated carefully to avoid any legal ambiguity.", "hard", "travail,juridique"),
        ("Ayant oublié son parapluie, elle improvisa un abri avec son sac et un vieux journal.", "Having forgotten her umbrella, she improvised shelter with her bag and an old newspaper.", "hard", "quotidien,improvisation"),
        ("Le chef a revisité ce plat traditionnel en y ajoutant des épices venues d'Asie.", "The chef reinvented this traditional dish by adding spices from Asia.", "hard", "cuisine,innovation"),
        ("Nous devrons analyser les résultats dans leur contexte historique pour comprendre leurs conséquences.", "We will need to analyze the results in their historical context to understand their consequences.", "hard", "histoire,analyse"),
        ("Bien qu'ils aient peu dormi, ils terminèrent le projet avant l'échéance fixée.", "Although they slept little, they finished the project before the deadline.", "hard", "travail,projet"),
        ("Si tu avais assisté à la réunion, tu aurais compris les enjeux financiers.", "If you had attended the meeting, you would have understood the financial stakes.", "hard", "finance,conditionnel"),
        ("Elle raconte avec émotion les souvenirs d'enfance passés dans cette maison isolée.", "She recounts with emotion the childhood memories spent in that isolated house.", "hard", "souvenir,émotion"),
        ("Après avoir consulté plusieurs experts, ils ont finalement opté pour une solution durable.", "After consulting several experts, they finally opted for a sustainable solution.", "hard", "environnement,décision"),
        ("Le scientifique a démontré l'hypothèse grâce à une série d'expériences minutieuses.", "The scientist proved the hypothesis through a series of meticulous experiments.", "hard", "science,recherche"),
        ("Malgré les obstacles administratifs, l'association a réussi à obtenir les autorisations nécessaires.", "Despite administrative obstacles, the association managed to obtain the necessary permits.", "hard", "administratif,association"),
        ("Elle a confié son manuscrit à un éditeur qui a accepté de le publier l'année prochaine.", "She entrusted her manuscript to a publisher who agreed to release it next year.", "hard", "littérature,édition"),
        ("Nous avions beau insister, il refusait de reconnaître son erreur devant le comité.", "We kept insisting, but he refused to acknowledge his mistake in front of the committee.", "hard", "travail,conflit"),
        ("Les voyageurs, fatigués mais enthousiastes, atteignirent enfin le sommet enneigé.", "The travelers, tired but enthusiastic, finally reached the snowy summit.", "hard", "voyage,montagne"),
        ("Une fois les documents signés, le chantier pourra officiellement commencer.", "Once the documents are signed, the construction site can officially begin.", "hard", "construction,administratif"),
        ("Le directeur espère que cette initiative encouragera l'innovation au sein de l'entreprise.", "The director hopes this initiative will encourage innovation within the company.", "hard", "entreprise,innovation"),
        ("Ils ont été impressionnés par la richesse du patrimoine culturel de la région.", "They were impressed by the richness of the region's cultural heritage.", "hard", "culture,patrimoine"),
        ("Avant que tu ne partes, pourrais-tu vérifier l'état des réservations pour la semaine prochaine ?", "Before you leave, could you check the status of the reservations for next week?", "hard", "organisation,travail"),
        ("La conférence a mis en lumière l'importance de la coopération internationale face aux défis climatiques.", "The conference highlighted the importance of international cooperation in the face of climate challenges.", "hard", "climat,coopération"),
        ("À condition que toutes les parties soient d'accord, nous signerons le partenariat mardi prochain.", "Provided all parties agree, we will sign the partnership next Tuesday.", "hard", "négociation,entreprise"),
    ]

    sentences: list[SentenceRow] = []
    for fr_text, en_text, difficulty, tags in raw:
        sentences.append(
            {
                "id": str(uuid4()),
                "fr_text": fr_text,
                "en_text": en_text,
                "difficulty": difficulty,
                "tags": tags,
                "created_at": timestamp,
                "updated_at": timestamp,
            }
        )
    return sentences


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    sentences = build_sentences()
    fieldnames = ["id", "fr_text", "en_text", "difficulty", "tags", "created_at", "updated_at"]
    with SENTENCES_CSV.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(sentences)
    print(f"Seeded {len(sentences)} sentences into {SENTENCES_CSV.relative_to(BASE_DIR)}")


if __name__ == "__main__":
    main()
