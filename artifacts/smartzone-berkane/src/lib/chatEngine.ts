import { Quartier } from '../data/quartiers';

export interface ChatResponse {
  text: string;
  topQuartiers: Quartier[];
  action?: 'zoom' | 'highlight' | 'compare';
  criterion?: string;
}

const extractPrice = (priceStr: string) => {
  const match = priceStr.replace(/\s+/g, '').match(/\d+/);
  return match ? parseInt(match[0], 10) : 9999999;
};

export const parseMessage = (message: string, quartiers: Quartier[]): ChatResponse => {
  const msg = message.toLowerCase();
  
  if (msg.includes('compare') || (msg.includes('entre') && msg.includes('et'))) {
    const q1 = quartiers.find(q => msg.includes(q.nom.toLowerCase()));
    const q2 = quartiers.find(q => q.id !== q1?.id && msg.includes(q.nom.toLowerCase()));
    
    if (q1 && q2) {
      return {
        text: `Voici la comparaison entre ${q1.nom} et ${q2.nom}. Lequel correspond le mieux à vos attentes ?\n\n🏠 **${q1.nom}** — Score: ${q1.scoreGlobal}/100\n🏠 **${q2.nom}** — Score: ${q2.scoreGlobal}/100`,
        topQuartiers: [q1, q2],
        action: 'compare'
      };
    }
  }

  if (msg.includes('tous') || msg.includes('comparer tous')) {
    const sorted = [...quartiers].sort((a, b) => b.scoreGlobal - a.scoreGlobal);
    return {
      text: "Voici le classement de tous les quartiers selon leur score global. Vous pouvez consulter le tableau comparatif pour plus de détails.",
      topQuartiers: sorted,
      action: 'highlight'
    };
  }

  if (msg.match(/(d[ds]*)s*(mad|dh|dirham)/i) || msg.includes('moins cher') || msg.includes('pas cher') || msg.includes('économique')) {
    const sorted = [...quartiers].sort((a, b) => extractPrice(a.prixEstime) - extractPrice(b.prixEstime));
    const top = sorted.slice(0, 3);
    return {
      text: "J'ai trouvé les quartiers les plus accessibles en termes de budget :\n" + 
        top.map(q => `🏠 **${q.nom}** — ${q.prixEstime}`).join('\n'),
      topQuartiers: top,
      action: 'highlight',
      criterion: 'prix'
    };
  }

  if (msg.includes('calme') || msg.includes('tranquille') || msg.includes('silencieux')) {
    const sorted = [...quartiers].sort((a, b) => (b.scores.routeNationale + b.scores.securite) - (a.scores.routeNationale + a.scores.securite));
    const top = sorted.slice(0, 2);
    return {
      text: "Vous cherchez la tranquillité. Voici les quartiers les plus calmes, éloignés des grands axes et très sécurisés :\n" +
        top.map(q => `🏠 **${q.nom}** — Score de calme : ${Math.round((q.scores.routeNationale + q.scores.securite) / 2)}/100`).join('\n'),
      topQuartiers: top,
      action: 'highlight',
      criterion: 'calme'
    };
  }

  if (msg.includes('sécurité') || msg.includes('sécurisé')) {
    const sorted = [...quartiers].sort((a, b) => b.scores.securite - a.scores.securite);
    const top = sorted.slice(0, 2);
    return {
      text: "La sécurité est primordiale. Voici les quartiers les mieux notés sur ce critère :\n" +
        top.map(q => `🏠 **${q.nom}** — Sécurité : ${q.scores.securite}/100`).join('\n'),
      topQuartiers: top,
      action: 'highlight',
      criterion: 'securite'
    };
  }

  if (msg.includes('hôpital') || msg.includes('clinique') || msg.includes('médecin') || msg.includes('santé')) {
    const sorted = [...quartiers].sort((a, b) => b.scores.hopital - a.scores.hopital);
    const top = sorted.slice(0, 2);
    return {
      text: "Voici les quartiers avec le meilleur accès aux soins et hôpitaux :\n" +
        top.map(q => `🏠 **${q.nom}** — Hôpital à ${q.distances.hopital}`).join('\n'),
      topQuartiers: top,
      action: 'highlight',
      criterion: 'hopital'
    };
  }

  if (msg.includes('école') || msg.includes('enfants') || msg.includes('scolarité')) {
    const sorted = [...quartiers].sort((a, b) => b.scores.ecole - a.scores.ecole);
    const top = sorted.slice(0, 2);
    return {
      text: "Idéal pour les familles. Ces quartiers offrent une excellente proximité avec les écoles :\n" +
        top.map(q => `🏠 **${q.nom}** — Écoles à ${q.distances.ecole}`).join('\n'),
      topQuartiers: top,
      action: 'highlight',
      criterion: 'ecole'
    };
  }

  if (msg.includes('parc') || msg.includes('vert') || msg.includes('nature') || msg.includes('verdure')) {
    const sorted = [...quartiers].sort((a, b) => b.scores.espacesVerts - a.scores.espacesVerts);
    const top = sorted.slice(0, 2);
    return {
      text: "Vous aimez la nature. Voici les zones avec les meilleurs espaces verts :\n" +
        top.map(q => `🏠 **${q.nom}** — Parc à ${q.distances.parc}`).join('\n'),
      topQuartiers: top,
      action: 'highlight',
      criterion: 'espacesVerts'
    };
  }

  if (msg.includes('commerce') || msg.includes('supermarché') || msg.includes('courses')) {
    const sorted = [...quartiers].sort((a, b) => b.scores.commerces - a.scores.commerces);
    const top = sorted.slice(0, 2);
    return {
      text: "Pour un accès rapide aux commerces, ces quartiers sont parfaits :\n" +
        top.map(q => `🏠 **${q.nom}** — Commerces à ${q.distances.supermarche}`).join('\n'),
      topQuartiers: top,
      action: 'highlight',
      criterion: 'commerces'
    };
  }

  if (msg.includes('centre') || msg.includes('central')) {
    const sorted = [...quartiers].sort((a, b) => b.scores.centreville - a.scores.centreville);
    const top = sorted.slice(0, 2);
    return {
      text: "Au cœur de l'action. Voici les quartiers les plus centraux :\n" +
        top.map(q => `🏠 **${q.nom}** — Score centre-ville : ${q.scores.centreville}/100`).join('\n'),
      topQuartiers: top,
      action: 'highlight',
      criterion: 'centreville'
    };
  }

  if (msg.includes('mosquée') || msg.includes('prière')) {
    const sorted = [...quartiers].sort((a, b) => b.scores.mosquees - a.scores.mosquees);
    const top = sorted.slice(0, 2);
    return {
      text: "Voici les quartiers avec une forte proximité des mosquées :\n" +
        top.map(q => `🏠 **${q.nom}** — Mosquée à ${q.distances.mosquee}`).join('\n'),
      topQuartiers: top,
      action: 'highlight',
      criterion: 'mosquees'
    };
  }

  if (msg.includes('transport') || msg.includes('bus')) {
    const sorted = [...quartiers].sort((a, b) => b.scores.transport - a.scores.transport);
    const top = sorted.slice(0, 2);
    return {
      text: "Si vous dépendez des transports, ces quartiers sont très bien desservis :\n" +
        top.map(q => `🏠 **${q.nom}** — Score transport : ${q.scores.transport}/100`).join('\n'),
      topQuartiers: top,
      action: 'highlight',
      criterion: 'transport'
    };
  }

  if (msg.includes('meilleur') || msg.includes('top') || msg.includes('classement')) {
    const sorted = [...quartiers].sort((a, b) => b.scoreGlobal - a.scoreGlobal);
    const top = sorted.slice(0, 3);
    return {
      text: "D'après notre algorithme global, voici les meilleurs quartiers de Berkane :\n" +
        top.map((q, i) => `${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} **${q.nom}** — Score : ${q.scoreGlobal}/100`).join('\n'),
      topQuartiers: top,
      action: 'highlight'
    };
  }

  // Fallback
  const sorted = [...quartiers].sort((a, b) => b.scoreGlobal - a.scoreGlobal);
  const top = sorted.slice(0, 3);
  return {
    text: "Je peux vous aider à trouver le quartier idéal selon vos critères (calme, budget, écoles, etc.). En attendant, voici notre top 3 général :\n" +
      top.map((q, i) => `${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} **${q.nom}** — Score : ${q.scoreGlobal}/100`).join('\n'),
    topQuartiers: top,
    action: 'highlight'
  };
};
