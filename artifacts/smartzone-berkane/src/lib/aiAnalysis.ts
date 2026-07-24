import { Quartier, haversineMeters } from '../data/quartiers';
import { BerkanePOIs, POI } from './overpassService';

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserPreferences {
  fullName:      string;
  age:           number;
  profession:    string;
  monthlyBudget: number;   // MAD
  familySize:    number;
  phone:         string;

  distances: {
    hospital:    number;   // km, 0 = no preference
    pharmacy:    number;
    school:      number;
    university:  number;
    mosque:      number;
    supermarket: number;
    restaurant:  number;
    cafe:        number;
    transport:   number;
    park:        number;
    beach:       number;
    cityCenter:  number;
    workplace:   number;
  };

  lifestyle: string[];     // e.g. ['quiet', 'family', 'green']
}

export interface QuartierResult {
  quartier:             Quartier;
  rank:                 number;
  compatibilityScore:   number;   // 0-100
  accessibilityScore:   number;
  safetyScore:          number;
  trafficScore:         number;
  environmentalScore:   number;
  costScore:            number;
  servicesScore:        number;
  pros:                 string[];
  cons:                 string[];
  whySelected:          string;
  estimatedMonthlyRent: number;   // MAD
  estimatedTotalCost:   number;   // MAD
  travelTimes: { label: string; walk: string; car: string }[];
}

export interface AIAnalysisResult {
  recommendation: QuartierResult;
  alternatives:   QuartierResult[];
  userProfile:    string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const BERKANE_CENTER = { lat: 34.9218, lng: -2.3200 };
const SAIDIA_BEACH   = { lat: 35.0917, lng: -2.2222 }; // ~30 km

function nearestM(list: POI[], lat: number, lng: number): number {
  if (!list?.length) return Infinity;
  return Math.min(...list.map(p => haversineMeters(lat, lng, p.lat, p.lng)));
}

/** Score = 100 when distance ≤ preferred max, falls off sharply beyond it. */
function distPenalty(actualM: number, preferredKm: number): number {
  if (preferredKm <= 0) return 100;                 // no preference
  if (!isFinite(actualM)) return 40;                // no POI found
  const preferred = preferredKm * 1000;
  if (actualM <= preferred) return 100;
  return Math.max(0, Math.round(100 - ((actualM - preferred) / preferred) * 130));
}

function extractPrice(s: string): { min: number; max: number; avg: number } {
  const nums = s.match(/[\d\s]+/g)?.map(n => parseInt(n.replace(/\s/g, ''), 10)).filter(n => n > 1000) ?? [];
  const min = nums[0] ?? 400_000;
  const max = nums[1] ?? min * 1.4;
  return { min, max, avg: (min + max) / 2 };
}

function minutesCar(m: number)  { return Math.round(m / 1000 / 30 * 60); }
function minutesWalk(m: number) { return Math.round(m / 1000 / 5  * 60); }
function fmtTime(min: number)   { return min < 60 ? `${min} min` : `${(min/60).toFixed(1)} h`; }

// ── Core analysis ────────────────────────────────────────────────────────────

function scoreQuartier(
  q: Quartier,
  prefs: UserPreferences,
  pois: BerkanePOIs | null,
): QuartierResult {
  const { lat, lng } = q;

  // ── Real distances (metres) ──
  const dm = pois ? {
    hospital:    nearestM(pois.hopital,       lat, lng),
    school:      nearestM(pois.ecole,          lat, lng),
    park:        nearestM(pois.espacesVerts,   lat, lng),
    mosque:      nearestM(pois.mosquee,        lat, lng),
    transport:   nearestM(pois.transport,      lat, lng),
    commerce:    nearestM(pois.commerce,       lat, lng),
    police:      nearestM(pois.police,         lat, lng),
    cityCenter:  haversineMeters(lat, lng, BERKANE_CENTER.lat, BERKANE_CENTER.lng),
    beach:       haversineMeters(lat, lng, SAIDIA_BEACH.lat,   SAIDIA_BEACH.lng),
  } : null;

  // ── Distance preference scores ──
  const dp = prefs.distances;
  const distScores: number[] = [];

  if (dm) {
    if (dp.hospital   > 0) distScores.push(distPenalty(dm.hospital,   dp.hospital));
    if (dp.pharmacy   > 0) distScores.push(distPenalty(dm.commerce,   dp.pharmacy));
    if (dp.school     > 0) distScores.push(distPenalty(dm.school,     dp.school));
    if (dp.university > 0) distScores.push(distPenalty(dm.school,     dp.university));
    if (dp.mosque     > 0) distScores.push(distPenalty(dm.mosque,     dp.mosque));
    if (dp.supermarket> 0) distScores.push(distPenalty(dm.commerce,   dp.supermarket));
    if (dp.restaurant > 0) distScores.push(distPenalty(dm.commerce,   dp.restaurant));
    if (dp.cafe       > 0) distScores.push(distPenalty(dm.commerce,   dp.cafe));
    if (dp.transport  > 0) distScores.push(distPenalty(dm.transport,  dp.transport));
    if (dp.park       > 0) distScores.push(distPenalty(dm.park,       dp.park));
    if (dp.beach      > 0) distScores.push(distPenalty(dm.beach,      dp.beach));
    if (dp.cityCenter > 0) distScores.push(distPenalty(dm.cityCenter, dp.cityCenter));
  }

  const accessibilityScore = distScores.length
    ? Math.round(distScores.reduce((a, b) => a + b, 0) / distScores.length)
    : Math.round((q.scores.centreville + q.scores.transport) / 2);

  // ── Safety score ──
  const safetyScore = q.scores.securite;

  // ── Traffic / noise score ──
  const bruitMap = { faible: 95, moyen: 65, élevé: 30 };
  const trafficScore = Math.round(
    (bruitMap[q.bruit] + q.scores.routeNationale) / 2
  );

  // ── Environmental score ──
  const environmentalScore = Math.round(
    (q.scores.espacesVerts * 0.6 + bruitMap[q.bruit] * 0.4)
  );

  // ── Lifestyle score ──
  const lifestyleMap: Record<string, number> = {
    quiet:    bruitMap[q.bruit],
    safe:     q.scores.securite,
    family:   Math.round((q.scores.ecole + q.scores.espacesVerts + q.scores.securite) / 3),
    luxury:   extractPrice(q.prixEstime).avg > 600_000 ? 90 : 40,
    student:  Math.round((q.scores.transport + q.scores.centreville + q.scores.ecole) / 3),
    business: Math.round((q.scores.centreville + q.scores.commerces + q.scores.transport) / 3),
    tourist:  Math.round((q.scores.centreville + q.scores.commerces) / 2),
    rural:    Math.round(Math.max(0, 100 - q.scores.centreville)),
    smart:    Math.round((q.scores.transport + q.scores.centreville + q.scores.commerces) / 3),
    green:    q.scores.espacesVerts,
  };
  const selectedLifestyleScores = prefs.lifestyle
    .map(tag => lifestyleMap[tag] ?? 50);
  const lifestyleScore = selectedLifestyleScores.length
    ? Math.round(selectedLifestyleScores.reduce((a, b) => a + b, 0) / selectedLifestyleScores.length)
    : 70;

  // ── Services score ──
  const servicesScore = Math.round(
    (q.scores.hopital + q.scores.ecole + q.scores.commerces + q.scores.mosquees + q.scores.transport) / 5
  );

  // ── Budget / Cost score ──
  const price = extractPrice(q.prixEstime);
  const monthlyRent   = Math.round(price.avg * 0.004);
  const monthlyFood   = 1800 * prefs.familySize;
  const monthlyTransp = q.scores.transport > 70 ? 400 : 800;
  const monthlyUtil   = 600;
  const totalCost     = monthlyRent + monthlyFood + monthlyTransp + monthlyUtil;

  const costScore = prefs.monthlyBudget > 0
    ? Math.min(100, Math.max(0, Math.round(100 - (totalCost - prefs.monthlyBudget) / prefs.monthlyBudget * 120)))
    : 70;

  // ── Overall compatibility ──
  const weights = {
    accessibility:  0.30,
    safety:         0.15,
    lifestyle:      0.20,
    cost:           0.20,
    services:       0.10,
    environment:    0.05,
  };
  const compatibilityScore = Math.min(100, Math.round(
    accessibilityScore  * weights.accessibility +
    safetyScore         * weights.safety +
    lifestyleScore      * weights.lifestyle +
    costScore           * weights.cost +
    servicesScore       * weights.services +
    environmentalScore  * weights.environment
  ));

  // ── Pros ──
  const pros: string[] = [];
  if (safetyScore >= 80)        pros.push(`Excellente sécurité (score ${safetyScore}/100)`);
  if (accessibilityScore >= 75) pros.push(`Bonne accessibilité aux services souhaités`);
  if (q.scores.ecole >= 75)     pros.push(`Plusieurs écoles à proximité`);
  if (q.scores.espacesVerts >= 70) pros.push(`Espaces verts et parcs proches`);
  if (q.scores.transport >= 75) pros.push(`Transports en commun bien desservis`);
  if (q.scores.commerces >= 80) pros.push(`Richesse commerciale et services de proximité`);
  if (trafficScore >= 70)       pros.push(`Faible nuisance sonore et bonne qualité de vie`);
  if (costScore >= 75)          pros.push(`Compatible avec votre budget (${monthlyRent.toLocaleString()} MAD/mois en loyer)`);
  if (q.scores.hopital >= 80)   pros.push(`Hôpitaux et cliniques accessibles rapidement`);
  if (pros.length === 0)        pros.push(`Quartier équilibré entre accessibilité et coût`);

  // ── Cons ──
  const cons: string[] = [];
  if (safetyScore < 60)         cons.push(`Sécurité perfectible (score ${safetyScore}/100)`);
  if (accessibilityScore < 55)  cons.push(`Certains services souhaités sont trop éloignés`);
  if (q.scores.espacesVerts < 45) cons.push(`Peu d'espaces verts dans le quartier`);
  if (trafficScore < 50)        cons.push(`Bruit et circulation importants (${q.bruit})`);
  if (costScore < 50 && prefs.monthlyBudget > 0)
                                cons.push(`Coût de vie estimé supérieur à votre budget`);
  if (q.scores.transport < 55)  cons.push(`Transports en commun limités`);
  if (cons.length === 0)        cons.push(`Peu d'inconvénients majeurs identifiés`);

  // ── Travel times ──
  const travelTimes: { label: string; walk: string; car: string }[] = [];
  if (dm) {
    const add = (label: string, m: number) => {
      if (isFinite(m)) travelTimes.push({
        label,
        walk: fmtTime(minutesWalk(m)),
        car:  fmtTime(minutesCar(m)),
      });
    };
    add('Hôpital le plus proche', dm.hospital);
    add('École la plus proche',   dm.school);
    add('Centre-ville',           dm.cityCenter);
    add('Arrêt de transport',     dm.transport);
    add('Commerce / Supermarché', dm.commerce);
    add('Plage de Saïdia',        dm.beach);
  }

  // ── Why selected ──
  const reasons: string[] = [];
  if (accessibilityScore >= 70) reasons.push(`vos critères de distance sont bien satisfaits`);
  if (lifestyleScore >= 70)     reasons.push(`le style de vie correspond à vos préférences`);
  if (costScore >= 70)          reasons.push(`le coût de vie reste dans votre budget`);
  if (safetyScore >= 75)        reasons.push(`la sécurité est au rendez-vous`);
  const whySelected = reasons.length
    ? `Ce quartier a été sélectionné car ${reasons.slice(0, 3).join(', ')}.`
    : `Ce quartier offre le meilleur équilibre entre accessibilité et coût pour votre profil.`;

  return {
    quartier: q,
    rank: 0,
    compatibilityScore,
    accessibilityScore,
    safetyScore,
    trafficScore,
    environmentalScore,
    costScore,
    servicesScore,
    pros,
    cons,
    whySelected,
    estimatedMonthlyRent: monthlyRent,
    estimatedTotalCost:   totalCost,
    travelTimes,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function analyzePreferences(
  prefs: UserPreferences,
  quartiers: Quartier[],
  pois: BerkanePOIs | null,
): AIAnalysisResult {
  const results = quartiers
    .map(q => scoreQuartier(q, prefs, pois))
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const [recommendation, ...rest] = results;
  const alternatives = rest.slice(0, 3);

  const age = prefs.age;
  const fam = prefs.familySize;
  const lifestyle = prefs.lifestyle;

  const profileParts: string[] = [];
  if (lifestyle.includes('family'))  profileParts.push('famille');
  if (lifestyle.includes('student')) profileParts.push('étudiant');
  if (lifestyle.includes('business')) profileParts.push('professionnel');
  if (lifestyle.includes('quiet'))   profileParts.push('amateur de calme');
  if (lifestyle.includes('green'))   profileParts.push('nature');

  const profile = profileParts.length
    ? `Profil ${profileParts.join(' / ')} — ${fam} personne${fam > 1 ? 's' : ''}, ${prefs.monthlyBudget.toLocaleString()} MAD/mois`
    : `${age} ans, ${fam} personne${fam > 1 ? 's' : ''}, ${prefs.monthlyBudget.toLocaleString()} MAD/mois`;

  return { recommendation, alternatives, userProfile: profile };
}

export const DEFAULT_PREFS: UserPreferences = {
  fullName: '', age: 30, profession: '', monthlyBudget: 8000, familySize: 3, phone: '',
  distances: {
    hospital: 2, pharmacy: 1, school: 1.5, university: 0,
    mosque: 1, supermarket: 1, restaurant: 0, cafe: 0,
    transport: 0.5, park: 2, beach: 0, cityCenter: 3, workplace: 0,
  },
  lifestyle: [],
};
