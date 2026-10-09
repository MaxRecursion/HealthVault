import {
  Bike,
  CalendarCheck2,
  CircleAlert,
  Dumbbell,
  ExternalLink,
  HeartPulse,
  Salad,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { readBiomarker, reports } from "../../data/bloodReports";
import type { BiomarkerId, BiomarkerResult } from "../../types/health";
import { formatValue } from "../../utils/formatters";

const latestReport = reports.at(-1)!;
const heightMetres = 1.84;
const weightKg = 95;
const bmi = weightKg / (heightMetres * heightMetres);

function result(id: BiomarkerId): BiomarkerResult {
  return readBiomarker(latestReport, id);
}

function reading(id: BiomarkerId): string {
  const item = result(id);
  return `${formatValue(item.value, item.precision)} ${item.unit}`;
}

function range(id: BiomarkerId): string {
  return result(id).referenceRange?.label ?? "no range printed";
}

const movementPlan = [
  { day: "Mon", item: "30 min brisk walk" },
  { day: "Tue", item: "Strength A + 15 min walk" },
  { day: "Wed", item: "30 min walk or cycling" },
  { day: "Thu", item: "30 min brisk walk" },
  { day: "Fri", item: "Strength B + 15 min walk" },
  { day: "Sat", item: "30 min walk or cycling" },
  { day: "Sun", item: "Rest or gentle mobility" },
];

export function ActionPlan() {
  const reduceMotion = useReducedMotion();

  const priorities = [
    {
      icon: CircleAlert,
      title: "Bring the bilirubin and CBC flags to your clinician",
      detail: `Latest total bilirubin ${reading("total-bilirubin")} (report range ${range("total-bilirubin")}); direct bilirubin ${reading("direct-bilirubin")} (range ${range("direct-bilirubin")}). The same report flags MCV ${reading("mcv")}, MCHC ${reading("mchc")}, and RDW-SD ${reading("rdw-sd")} against their printed ranges. Ask how these fit your history and whether follow-up is appropriate.`,
      tone: "plan-priority-red",
    },
    {
      icon: HeartPulse,
      title: "Review glucose and cholesterol trends together",
      detail: `Fasting glucose is ${reading("fasting-glucose")} (report range ${range("fasting-glucose")}) while HbA1c is ${reading("hba1c")}. Triglycerides are ${reading("triglycerides")} and HDL ${reading("hdl")}; LDL is ${reading("ldl")}. Ask your clinician when these should next be checked.`,
      tone: "plan-priority-amber",
    },
    {
      icon: CalendarCheck2,
      title: "Check vitamin results before starting supplements",
      detail: `B12 is ${reading("vitamin-b12")} (printed interval ${range("vitamin-b12")}); vitamin D is ${reading("vitamin-d")} and its report categories do not specify the 20–21 ng/mL gap. Ask your clinician to interpret both using the source report before deciding on supplements.`,
      tone: "plan-priority-blue",
    },
  ];

  return (
    <section className="action-plan surface-card" aria-labelledby="action-plan-title">
      <div className="action-plan-heading">
        <div>
          <div className="eyebrow"><Sparkles size={14} /> AI-ASSISTED · LOCAL GUIDANCE</div>
          <h2 id="action-plan-title">A practical next-step plan</h2>
          <p>Written for your 9 Oct 2026 results and profile. Observations to discuss, not a diagnosis.</p>
        </div>
        <div className="plan-profile" aria-label="Profile context">
          <span>37 years</span><i aria-hidden="true" />
          <span>184 cm · 95 kg</span><i aria-hidden="true" />
          <span>BMI ≈ {formatValue(bmi, 1)}</span>
        </div>
      </div>

      <motion.div
        className="action-plan-priorities"
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } } }}
      >
        <h3>For your next clinician visit</h3>
        <ul className="plan-priority-list">
          {priorities.map(({ icon: Icon, title, detail, tone }) => (
            <motion.li
              className="plan-priority"
              key={title}
              variants={{
                hidden: { opacity: 0, y: 7 },
                visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.22 } },
              }}
            >
              <span className={`plan-priority-icon ${tone}`}><Icon size={16} /></span>
              <div><h4>{title}</h4><p>{detail}</p></div>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <div className="plan-routine-grid">
        <article className="plan-routine-card">
          <div className="plan-routine-title">
            <span className="plan-routine-icon plan-diet-icon"><Salad size={17} /></span>
            <div><span className="eyebrow">FOOD RHYTHM</span><h3>A flexible day of meals</h3></div>
          </div>
          <ul className="plan-bullet-list">
            <li><strong>Breakfast:</strong> oats with plain yogurt or milk, fruit, and a small handful of nuts; or eggs/tofu with whole-grain toast.</li>
            <li><strong>Lunch and dinner:</strong> build a plate around vegetables, beans/lentils, tofu, eggs, fish, or lean poultry, plus a whole grain such as brown rice or whole-wheat roti.</li>
            <li><strong>Between meals:</strong> choose whole fruit, unsalted nuts, or roasted chickpeas. Drink water or unsweetened tea; keep sugary drinks and highly processed snacks occasional.</li>
            <li><strong>Cooking:</strong> favor unsaturated plant oils and keep saturated fat and added sugar modest.</li>
          </ul>
          <p className="plan-routine-note">A pattern to adapt to your preferences—no calorie target or restrictive diet is inferred from these labs.</p>
        </article>

        <article className="plan-routine-card">
          <div className="plan-routine-title">
            <span className="plan-routine-icon plan-move-icon"><Bike size={17} /></span>
            <div><span className="eyebrow">WEEKLY MOVEMENT</span><h3>Build a steady routine</h3></div>
          </div>
          <p className="plan-movement-target">Work toward 150 minutes of moderate movement a week, plus strength work on two days.</p>
          <div className="movement-week" aria-label="Example weekly workout schedule">
            {movementPlan.map(({ day, item }) => <div key={day}><b>{day}</b><span>{item}</span></div>)}
          </div>
          <p className="plan-routine-note"><Dumbbell size={13} /> Strength days: try chair squats, wall push-ups, hip hinges, band rows, and calf raises at a comfortable effort. If you are starting from little activity, begin with 10–15 minute sessions three days a week and build gradually.</p>
        </article>
      </div>

      <div className="plan-footnotes">
        <p><strong>BMI context:</strong> about {formatValue(bmi, 1)} kg/m², a screening measure only—not a diagnosis or a stand-alone health assessment. Discuss any weight goal in light of your full history.</p>
        <p><strong>AI and privacy:</strong> This AI-written guidance is bundled with the dashboard; the page does not call a live AI model or send your report values to an AI provider. The dashboard itself is public, so its included report data can be viewed by site visitors.</p>
      </div>
      <div className="plan-sources" aria-label="Guidance sources">
        <span>Guidance:</span>
        <a href="https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/nutrition-basics/aha-diet-and-lifestyle-recommendations?uid=1908" target="_blank" rel="noreferrer">American Heart Association <ExternalLink size={11} /></a>
        <a href="https://www.who.int/initiatives/behealthy/physical-activity/" target="_blank" rel="noreferrer">WHO activity guidance <ExternalLink size={11} /></a>
        <a href="https://www.cdc.gov/bmi/adult-calculator/index.html" target="_blank" rel="noreferrer">CDC BMI context <ExternalLink size={11} /></a>
        <a href="https://medlineplus.gov/lab-tests/bilirubin-blood-test/" target="_blank" rel="noreferrer">MedlinePlus on bilirubin tests <ExternalLink size={11} /></a>
      </div>
    </section>
  );
}
