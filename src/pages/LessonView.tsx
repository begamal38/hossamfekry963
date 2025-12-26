import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight,
  Play, 
  CheckCircle2, 
  BookOpen, 
  Lightbulb, 
  AlertTriangle,
  Target,
  Clock,
  ChevronRight,
  Lock,
  Youtube
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PracticeSection } from '@/components/practice/PracticeSection';
import { LessonQA } from '@/components/qa/LessonQA';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// Helper function to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  // Match various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

interface Lesson {
  id: string;
  title: string;
  title_ar: string;
  course_id: string;
  order_index: number;
  duration_minutes: number;
  lesson_type: string;
  video_url: string | null;
}

interface Course {
  id: string;
  title: string;
  title_ar: string;
  is_free: boolean;
}

interface LessonContent {
  intro: { en: string; ar: string };
  explanation: { en: string; ar: string }[];
  examples: { en: string; ar: string }[];
  commonMistake: { en: string; ar: string };
  summary: { en: string; ar: string };
  closing: { en: string; ar: string };
}

// Topic-specific content mapping for chemistry lessons
const getTopicContent = (lessonTitle: string, lessonTitleAr: string): LessonContent => {
  // Chemistry topic content based on lesson titles
  const topicContentMap: Record<string, LessonContent> = {
    'Transition Elements Properties': {
      intro: {
        en: "In this lesson, we'll explore the unique properties of transition elements - the d-block elements that give us colorful compounds and catalytic abilities!",
        ar: "في الحصة دي، هنستكشف خصائص عناصر السلسلة الانتقالية - عناصر المستوى d اللي بتدينا مركبات ملونة وقدرات تحفيزية!"
      },
      explanation: [
        { en: "Transition elements are found in the d-block of the periodic table. They have partially filled d orbitals which give them unique properties.", ar: "عناصر الانتقالية موجودة في المستوى d في الجدول الدوري. عندها مدارات d مملوءة جزئياً وده بيديها خصائص فريدة." },
        { en: "These elements can form compounds with variable oxidation states, creating colorful solutions and acting as excellent catalysts.", ar: "العناصر دي بتكون مركبات بحالات تأكسد مختلفة، وده بيخلي المحاليل ملونة وبتشتغل كمحفزات ممتازة." }
      ],
      examples: [
        { en: "Iron can exist as Fe²⁺ (green) or Fe³⁺ (yellow-brown) in solution.", ar: "الحديد ممكن يكون Fe²⁺ (أخضر) أو Fe³⁺ (أصفر-بني) في المحلول." },
        { en: "Copper compounds: Cu²⁺ gives blue color in CuSO₄ solution.", ar: "مركبات النحاس: Cu²⁺ بيدي لون أزرق في محلول CuSO₄." }
      ],
      commonMistake: { en: "⚠️ Don't confuse transition elements with inner transition elements (lanthanides and actinides) - they're different!", ar: "⚠️ ما تخلطش بين عناصر الانتقالية وعناصر الانتقالية الداخلية (اللانثانيدات والأكتينيدات) - دول مختلفين!" },
      summary: { en: "Transition elements have variable oxidation states, form colored compounds, and are excellent catalysts due to their partially filled d orbitals.", ar: "العناصر الانتقالية عندها حالات تأكسد متعددة، وبتكون مركبات ملونة، ومحفزات ممتازة بسبب مدارات d المملوءة جزئياً." },
      closing: { en: "Excellent work! You now understand the fundamentals of transition elements. Ready for the next chapter?", ar: "ممتاز! دلوقتي فاهم أساسيات العناصر الانتقالية. جاهز للفصل الجاي؟" }
    },
    'Iron Element': {
      intro: {
        en: "Iron is the most important transition metal! Let's discover why it's crucial for industry and life.",
        ar: "الحديد هو أهم فلز انتقالي! خلينا نكتشف ليه مهم للصناعة والحياة."
      },
      explanation: [
        { en: "Iron (Fe) has atomic number 26. It's the fourth most abundant element in Earth's crust and essential for hemoglobin.", ar: "الحديد (Fe) عدده الذري 26. رابع أكتر عنصر متوفر في قشرة الأرض وأساسي للهيموجلوبين." },
        { en: "Iron exists in two main oxidation states: +2 (ferrous) and +3 (ferric), each with distinct properties.", ar: "الحديد موجود في حالتين تأكسد رئيسيتين: +2 (حديدوز) و+3 (حديديك)، كل واحدة بخصائص مميزة." }
      ],
      examples: [
        { en: "Fe²⁺ + 2OH⁻ → Fe(OH)₂ (green precipitate, turns brown in air)", ar: "Fe²⁺ + 2OH⁻ → Fe(OH)₂ (راسب أخضر، بيتحول بني في الهواء)" },
        { en: "Detection of Fe³⁺: Add KSCN → blood red color (Fe(SCN)₃)", ar: "الكشف عن Fe³⁺: أضف KSCN → لون أحمر دموي (Fe(SCN)₃)" }
      ],
      commonMistake: { en: "⚠️ Fe(OH)₂ is green, not brown! It turns brown when oxidized to Fe(OH)₃.", ar: "⚠️ Fe(OH)₂ لونه أخضر مش بني! بيتحول بني لما يتأكسد لـ Fe(OH)₃." },
      summary: { en: "Iron is vital for industry (steel) and biology (blood). Remember the +2 and +3 states and their colors.", ar: "الحديد مهم للصناعة (الصلب) والأحياء (الدم). افتكر حالات +2 و+3 وألوانها." },
      closing: { en: "Great progress! Iron chemistry is foundational for understanding metallurgy.", ar: "تقدم رائع! كيمياء الحديد أساسية لفهم التعدين." }
    },
    'Galvanic Cells': {
      intro: {
        en: "Galvanic cells convert chemical energy to electrical energy - the science behind batteries!",
        ar: "الخلايا الجلفانية بتحول الطاقة الكيميائية لطاقة كهربائية - العلم ورا البطاريات!"
      },
      explanation: [
        { en: "A galvanic cell has two half-cells: anode (oxidation) and cathode (reduction). Electrons flow from anode to cathode.", ar: "الخلية الجلفانية فيها نصفين: الأنود (أكسدة) والكاثود (اختزال). الإلكترونات بتسري من الأنود للكاثود." },
        { en: "The salt bridge maintains electrical neutrality by allowing ion flow between the two half-cells.", ar: "القنطرة الملحية بتحافظ على التعادل الكهربي بالسماح بمرور الأيونات بين نصفي الخلية." }
      ],
      examples: [
        { en: "Zn-Cu cell: Zn → Zn²⁺ + 2e⁻ (anode) | Cu²⁺ + 2e⁻ → Cu (cathode)", ar: "خلية خارصين-نحاس: Zn → Zn²⁺ + 2e⁻ (أنود) | Cu²⁺ + 2e⁻ → Cu (كاثود)" },
        { en: "EMF = E°cathode - E°anode = +0.34 - (-0.76) = +1.10 V", ar: "القوة الدافعة = جهد الكاثود - جهد الأنود = 0.34+ - (0.76-) = 1.10+ فولت" }
      ],
      commonMistake: { en: "⚠️ Electrons flow through the wire, NOT the salt bridge! Ions flow through the salt bridge.", ar: "⚠️ الإلكترونات بتسري في السلك، مش القنطرة الملحية! الأيونات هي اللي بتعدي في القنطرة." },
      summary: { en: "Galvanic cells: Anode oxidizes, Cathode reduces, electrons flow anode→cathode, salt bridge allows ion flow.", ar: "الخلايا الجلفانية: الأنود بيتأكسد، الكاثود بيختزل، الإلكترونات من الأنود للكاثود، القنطرة للأيونات." },
      closing: { en: "You've mastered galvanic cells! This is key for understanding batteries and corrosion.", ar: "أنت فاهم الخلايا الجلفانية! ده مفتاح لفهم البطاريات والتآكل." }
    },
    'Electrolytic Cells': {
      intro: {
        en: "Electrolytic cells use electrical energy to drive non-spontaneous reactions - the opposite of galvanic cells!",
        ar: "الخلايا الإلكتروليتية بتستخدم الطاقة الكهربائية لتشغيل تفاعلات غير تلقائية - عكس الخلايا الجلفانية!"
      },
      explanation: [
        { en: "In electrolysis, external current forces a reaction. Anode is positive, cathode is negative.", ar: "في التحليل الكهربي، تيار خارجي بيجبر التفاعل. الأنود موجب، الكاثود سالب." },
        { en: "Applications include electroplating, metal extraction, and water purification.", ar: "التطبيقات تشمل الطلاء الكهربي، استخلاص المعادن، وتنقية المياه." }
      ],
      examples: [
        { en: "Electrolysis of water: 2H₂O → 2H₂ + O₂ (needs 1.23V minimum)", ar: "تحليل الماء كهربياً: 2H₂O → 2H₂ + O₂ (يحتاج 1.23 فولت كحد أدنى)" },
        { en: "Electroplating silver: Ag⁺ + e⁻ → Ag deposits on cathode", ar: "طلاء الفضة: Ag⁺ + e⁻ → Ag بيترسب على الكاثود" }
      ],
      commonMistake: { en: "⚠️ In electrolytic cells, anode is POSITIVE (opposite of galvanic cells where anode is negative)!", ar: "⚠️ في الخلايا الإلكتروليتية، الأنود موجب (عكس الجلفانية اللي الأنود فيها سالب)!" },
      summary: { en: "Electrolytic cells: external power, anode (+), cathode (-), used for electroplating and metal extraction.", ar: "الخلايا الإلكتروليتية: تيار خارجي، أنود (+)، كاثود (-)، للطلاء واستخلاص المعادن." },
      closing: { en: "Excellent! You now understand both types of electrochemical cells.", ar: "ممتاز! دلوقتي فاهم نوعي الخلايا الكهروكيميائية." }
    },
    'Introduction to Organic Chemistry': {
      intro: {
        en: "Welcome to Organic Chemistry - the chemistry of carbon compounds and the basis of life!",
        ar: "أهلاً بيك في الكيمياء العضوية - كيمياء مركبات الكربون وأساس الحياة!"
      },
      explanation: [
        { en: "Organic chemistry studies carbon-based compounds. Carbon can form 4 bonds and create long chains.", ar: "الكيمياء العضوية بتدرس مركبات الكربون. الكربون بيكون 4 روابط وسلاسل طويلة." },
        { en: "Key concepts: hybridization (sp³, sp², sp), functional groups, and isomerism.", ar: "المفاهيم الأساسية: التهجين (sp³, sp², sp)، المجموعات الوظيفية، والتشاكل." }
      ],
      examples: [
        { en: "Methane CH₄: sp³ hybridization, tetrahedral shape, 109.5° bond angle", ar: "الميثان CH₄: تهجين sp³، شكل رباعي الأوجه، زاوية رابطة 109.5°" },
        { en: "Ethene C₂H₄: sp² hybridization, planar shape, 120° bond angle", ar: "الإيثين C₂H₄: تهجين sp²، شكل مستوي، زاوية رابطة 120°" }
      ],
      commonMistake: { en: "⚠️ CO₂ and carbonates are NOT organic compounds even though they contain carbon!", ar: "⚠️ CO₂ والكربونات مش مركبات عضوية رغم احتوائها على كربون!" },
      summary: { en: "Organic = carbon compounds. Carbon forms 4 bonds. Hybridization determines molecular shape.", ar: "عضوية = مركبات كربون. الكربون بيكون 4 روابط. التهجين بيحدد الشكل الجزيئي." },
      closing: { en: "Great start! Organic chemistry is vast but we'll master it step by step.", ar: "بداية رائعة! الكيمياء العضوية واسعة بس هنفهمها خطوة بخطوة." }
    },
    'Alkanes': {
      intro: {
        en: "Alkanes are the simplest hydrocarbons - saturated compounds with only single bonds!",
        ar: "الألكانات أبسط الهيدروكربونات - مركبات مشبعة بروابط أحادية فقط!"
      },
      explanation: [
        { en: "General formula: CₙH₂ₙ₊₂. All carbons are sp³ hybridized with tetrahedral geometry.", ar: "الصيغة العامة: CₙH₂ₙ₊₂. كل الكربونات متهجنة sp³ بشكل رباعي الأوجه." },
        { en: "Alkanes undergo substitution reactions (not addition) because all bonds are saturated.", ar: "الألكانات بتعمل تفاعلات إحلال (مش إضافة) لأن كل الروابط مشبعة." }
      ],
      examples: [
        { en: "Methane + Cl₂ → CH₃Cl + HCl (substitution with UV light)", ar: "ميثان + Cl₂ → CH₃Cl + HCl (إحلال بوجود ضوء UV)" },
        { en: "Naming: CH₃-CH₂-CH₃ is propane (3 carbons)", ar: "التسمية: CH₃-CH₂-CH₃ هو البروبان (3 كربونات)" }
      ],
      commonMistake: { en: "⚠️ Alkanes do NOT undergo addition reactions - they're already saturated!", ar: "⚠️ الألكانات ما بتعملش تفاعلات إضافة - هي أصلاً مشبعة!" },
      summary: { en: "Alkanes: CₙH₂ₙ₊₂, saturated, single bonds only, substitution reactions.", ar: "الألكانات: CₙH₂ₙ₊₂، مشبعة، روابط أحادية فقط، تفاعلات إحلال." },
      closing: { en: "You've got alkanes down! Next up: unsaturated hydrocarbons.", ar: "فهمت الألكانات! الجاي: الهيدروكربونات غير المشبعة." }
    },
    'Alkenes (Olefins)': {
      intro: {
        en: "Alkenes contain C=C double bonds - they're unsaturated and highly reactive!",
        ar: "الألكينات فيها روابط ثنائية C=C - غير مشبعة وشديدة التفاعل!"
      },
      explanation: [
        { en: "General formula: CₙH₂ₙ. The C=C carbons are sp² hybridized (planar, 120°).", ar: "الصيغة العامة: CₙH₂ₙ. كربونات C=C متهجنة sp² (مستوية، 120°)." },
        { en: "Alkenes undergo addition reactions because the π bond can break to add new atoms.", ar: "الألكينات بتعمل تفاعلات إضافة لأن رابطة π ممكن تنكسر وتضيف ذرات جديدة." }
      ],
      examples: [
        { en: "C₂H₄ + Br₂ → C₂H₄Br₂ (decolorizes bromine water - test for unsaturation)", ar: "C₂H₄ + Br₂ → C₂H₄Br₂ (بيزيل لون ماء البروم - اختبار عدم التشبع)" },
        { en: "C₂H₄ + H₂ → C₂H₆ (hydrogenation with Ni catalyst)", ar: "C₂H₄ + H₂ → C₂H₆ (هدرجة بمحفز Ni)" }
      ],
      commonMistake: { en: "⚠️ Markovnikov's rule: H adds to the carbon with MORE hydrogens already!", ar: "⚠️ قاعدة ماركونيكوف: H بيتضاف للكربون اللي عنده هيدروجينات أكتر!" },
      summary: { en: "Alkenes: CₙH₂ₙ, unsaturated, C=C double bond, addition reactions, decolorize Br₂ water.", ar: "الألكينات: CₙH₂ₙ، غير مشبعة، رابطة ثنائية C=C، تفاعلات إضافة، بتزيل لون ماء البروم." },
      closing: { en: "Excellent! Alkenes are fundamental to polymer chemistry and industrial synthesis.", ar: "ممتاز! الألكينات أساسية لكيمياء البوليمرات والتصنيع الصناعي." }
    },
    'Benzene and Aromatic Compounds': {
      intro: {
        en: "Benzene is the foundation of aromatic chemistry - a unique ring with special stability!",
        ar: "البنزين أساس الكيمياء العطرية - حلقة فريدة باستقرار خاص!"
      },
      explanation: [
        { en: "Benzene C₆H₆ has a planar hexagonal ring with delocalized π electrons above and below.", ar: "البنزين C₆H₆ حلقة سداسية مستوية بإلكترونات π غير متمركزة فوق وتحت." },
        { en: "Due to resonance stability, benzene prefers substitution over addition reactions.", ar: "بسبب استقرار الرنين، البنزين بيفضل الإحلال على الإضافة." }
      ],
      examples: [
        { en: "Nitration: C₆H₆ + HNO₃ → C₆H₅NO₂ + H₂O (with H₂SO₄ catalyst)", ar: "النترتة: C₆H₆ + HNO₃ → C₆H₅NO₂ + H₂O (بمحفز H₂SO₄)" },
        { en: "Halogenation: C₆H₆ + Cl₂ → C₆H₅Cl + HCl (with FeCl₃ catalyst)", ar: "الهلجنة: C₆H₆ + Cl₂ → C₆H₅Cl + HCl (بمحفز FeCl₃)" }
      ],
      commonMistake: { en: "⚠️ Benzene does NOT decolorize bromine water (no addition!) - use FeBr₃ for substitution.", ar: "⚠️ البنزين ما بيزيلش لون ماء البروم (مفيش إضافة!) - استخدم FeBr₃ للإحلال." },
      summary: { en: "Benzene: C₆H₆, aromatic ring, delocalized electrons, substitution reactions, stable.", ar: "البنزين: C₆H₆، حلقة عطرية، إلكترونات غير متمركزة، تفاعلات إحلال، مستقر." },
      closing: { en: "You understand aromaticity! This is crucial for pharmaceuticals and dyes.", ar: "فاهم العطرية! ده مهم للأدوية والصبغات." }
    }
  };

  // Check if we have specific content for this lesson
  const content = topicContentMap[lessonTitle];
  if (content) return content;

  // Fallback to generic content based on title
  return {
    intro: {
      en: `In this lesson, you'll understand the core concepts of ${lessonTitle}. Let's make chemistry simple and clear!`,
      ar: `في الحصة دي، هتفهم المفاهيم الأساسية لـ ${lessonTitleAr}. خلينا نخلي الكيمياء سهلة وواضحة!`
    },
    explanation: [
      { en: "First, let's understand the fundamental concept. This is the building block for everything else we'll learn.", ar: "أولاً، خلينا نفهم المفهوم الأساسي. ده اللي هنبني عليه كل حاجة تانية هنتعلمها." },
      { en: "Now, let's see why this matters in your exams and real-world applications.", ar: "دلوقتي، خلينا نشوف ليه ده مهم في الامتحانات والتطبيقات الحقيقية." }
    ],
    examples: [
      { en: "Example 1: Let's solve a basic problem step by step. Notice how we apply what we just learned.", ar: "مثال 1: خلينا نحل مسألة بسيطة خطوة بخطوة. لاحظ إزاي بنطبق اللي اتعلمناه." },
      { en: "Example 2: This is an exam-style question. This pattern appears frequently in Thanaweya Amma.", ar: "مثال 2: ده سؤال على نمط الامتحان. النمط ده بيظهر كتير في الثانوية العامة." }
    ],
    commonMistake: { en: "⚠️ Common Trap: Many students confuse this concept with similar ones. Make sure you understand the key difference!", ar: "⚠️ خطأ شائع: طلاب كتير بيخلطوا المفهوم ده مع مفاهيم شبهه. تأكد إنك فاهم الفرق الأساسي!" },
    summary: { en: "Key takeaways: Remember the core concept, practice the examples, and avoid the common mistake we discussed.", ar: "النقاط الأساسية: افتكر المفهوم الأساسي، تدرب على الأمثلة، وابعد عن الخطأ الشائع اللي اتكلمنا عنه." },
    closing: { en: "Great job completing this lesson! Your understanding is growing. Keep up the momentum and move to the next lesson.", ar: "ممتاز إنك خلصت الحصة دي! فهمك بيتحسن. كمل الزخم ده وروح للحصة الجاية." }
  };
};

export default function LessonView() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();
  const isArabic = language === 'ar';

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [completed, setCompleted] = useState(false);

  const content = lesson ? getTopicContent(lesson.title, lesson.title_ar) : null;

  const sections = content ? [
    { id: 'intro', title: isArabic ? 'المقدمة' : 'Introduction', icon: Target },
    { id: 'explanation', title: isArabic ? 'الشرح' : 'Explanation', icon: BookOpen },
    { id: 'examples', title: isArabic ? 'الأمثلة' : 'Examples', icon: Lightbulb },
    { id: 'mistake', title: isArabic ? 'خطأ شائع' : 'Common Mistake', icon: AlertTriangle },
    { id: 'summary', title: isArabic ? 'الملخص' : 'Summary', icon: CheckCircle2 },
  ] : [];

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [lessonId]);

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId, user]);

  const fetchLesson = async () => {
    try {
      // Fetch lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      setLesson(lessonData);

      // Fetch course
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title, title_ar, is_free')
        .eq('id', lessonData.course_id)
        .single();

      setCourse(courseData);

      // Fetch all lessons in course
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', lessonData.course_id)
        .order('order_index');

      setCourseLessons(lessonsData || []);

      // Check enrollment
      if (user) {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', lessonData.course_id)
          .maybeSingle();

        setIsEnrolled(!!enrollment);

        // Check if already attended
        const { data: attendance } = await supabase
          .from('lesson_attendance')
          .select('id')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle();

        setCompleted(!!attendance);
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!user || !lesson) return;

    try {
      await supabase
        .from('lesson_attendance')
        .insert({
          user_id: user.id,
          lesson_id: lesson.id,
          attendance_type: 'online'
        });

      setCompleted(true);
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const currentLessonIndex = courseLessons.findIndex(l => l.id === lessonId);
  const previousLesson = currentLessonIndex > 0 ? courseLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < courseLessons.length - 1 ? courseLessons[currentLessonIndex + 1] : null;

  const progressPercent = ((currentSection + 1) / sections.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lesson || !content) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold mb-4">{isArabic ? 'الحصة غير موجودة' : 'Lesson not found'}</h1>
          <Button onClick={() => navigate('/courses')}>
            {isArabic ? 'العودة للكورسات' : 'Back to Courses'}
          </Button>
        </main>
      </div>
    );
  }

  // Check if user can access this lesson
  const canAccess = course?.is_free || isEnrolled;

  if (!canAccess && user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">{isArabic ? 'الحصة مقفولة' : 'Lesson Locked'}</h1>
          <p className="text-muted-foreground mb-6">
            {isArabic ? 'اشترك في الكورس للوصول لهذه الحصة' : 'Enroll in the course to access this lesson'}
          </p>
          <Button onClick={() => navigate(`/courses`)}>
            {isArabic ? 'اشترك الآن' : 'Enroll Now'}
          </Button>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">{isArabic ? 'سجل دخول للمتابعة' : 'Login to Continue'}</h1>
          <p className="text-muted-foreground mb-6">
            {isArabic ? 'سجل دخول لمشاهدة الحصة ومتابعة تقدمك' : 'Login to watch the lesson and track your progress'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isArabic ? 'تسجيل الدخول' : 'Login'}
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="pt-20">
        {/* Header */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link to="/courses" className="hover:text-primary">
                {isArabic ? 'الكورسات' : 'Courses'}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link to={`/course/${course?.id}`} className="hover:text-primary">
                {isArabic ? course?.title_ar : course?.title}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">{isArabic ? lesson.title_ar : lesson.title}</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">
                  {isArabic ? lesson.title_ar : lesson.title}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {lesson.duration_minutes} {isArabic ? 'دقيقة' : 'min'}
                  </span>
                  {completed && (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {isArabic ? 'مكتملة' : 'Completed'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{sections[currentSection]?.title}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Video Player Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Youtube className="w-5 h-5 text-red-500" />
              <h2 className="font-semibold">{isArabic ? 'فيديو الحصة' : 'Lesson Video'}</h2>
            </div>
            {lesson.video_url && getYouTubeVideoId(lesson.video_url) ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(lesson.video_url)}?rel=0&modestbranding=1`}
                  title={isArabic ? lesson.title_ar : lesson.title}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center">
                <Play className="w-16 h-16 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium">
                  {isArabic ? 'الفيديو قريباً' : 'Video Coming Soon'}
                </p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  {isArabic ? 'تابع الشرح النصي أدناه' : 'Follow the text content below'}
                </p>
              </div>
            )}
          </div>

          {/* Section Navigation */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(index)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all",
                    currentSection === index
                      ? "bg-primary text-primary-foreground"
                      : index < currentSection
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {section.title}
                </button>
              );
            })}
          </div>

          {/* Section Content */}
          <div className="bg-card border rounded-2xl p-6 md:p-8 mb-8">
            {currentSection === 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{isArabic ? 'ايه اللي هتفهمه النهاردة؟' : "What will you understand today?"}</h2>
                  </div>
                </div>
                <p className="text-lg leading-relaxed">
                  {isArabic ? content.intro.ar : content.intro.en}
                </p>
              </div>
            )}

            {currentSection === 1 && (
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{isArabic ? 'الشرح الأساسي' : 'Core Explanation'}</h2>
                  </div>
                </div>
                {content.explanation.map((exp, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-xl">
                    <p className="text-lg leading-relaxed">
                      {isArabic ? exp.ar : exp.en}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {currentSection === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{isArabic ? 'أمثلة تطبيقية' : 'Practical Examples'}</h2>
                  </div>
                </div>
                {content.examples.map((example, index) => (
                  <div key={index} className="p-5 bg-muted/50 rounded-xl border-l-4 border-primary">
                    <p className="text-lg leading-relaxed">
                      {isArabic ? example.ar : example.en}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {currentSection === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{isArabic ? 'انتبه من الخطأ الشائع!' : 'Watch Out for This Trap!'}</h2>
                  </div>
                </div>
                <div className="p-5 bg-red-500/10 rounded-xl border border-red-500/30">
                  <p className="text-lg leading-relaxed">
                    {isArabic ? content.commonMistake.ar : content.commonMistake.en}
                  </p>
                </div>
              </div>
            )}

            {currentSection === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{isArabic ? 'ملخص الحصة' : 'Lesson Summary'}</h2>
                  </div>
                </div>
                <div className="p-5 bg-green-500/10 rounded-xl border border-green-500/30 mb-6">
                  <p className="text-lg leading-relaxed">
                    {isArabic ? content.summary.ar : content.summary.en}
                  </p>
                </div>
                <div className="p-5 bg-primary/10 rounded-xl">
                  <p className="text-lg leading-relaxed font-medium">
                    {isArabic ? content.closing.ar : content.closing.en}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {currentSection > 0 ? (
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentSection(currentSection - 1)}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {isArabic ? 'السابق' : 'Previous'}
                </Button>
              ) : previousLesson ? (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate(`/lesson/${previousLesson.id}`)}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {isArabic ? 'الحصة السابقة' : 'Previous Lesson'}
                </Button>
              ) : null}
            </div>

            <div className="flex-1 text-center">
              {currentSection === sections.length - 1 && !completed && (
                <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {isArabic ? 'خلصت الحصة' : 'Mark Complete'}
                </Button>
              )}
            </div>

            <div className="flex-1 flex justify-end">
              {currentSection < sections.length - 1 ? (
                <Button 
                  onClick={() => setCurrentSection(currentSection + 1)}
                  className="gap-2"
                >
                  {isArabic ? 'التالي' : 'Next'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : nextLesson ? (
                <Button 
                  onClick={() => navigate(`/lesson/${nextLesson.id}`)}
                  className="gap-2"
                >
                  {isArabic ? 'الحصة التالية' : 'Next Lesson'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="gap-2"
                >
                  {isArabic ? 'للوحة التحكم' : 'To Dashboard'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Practice Section */}
          <PracticeSection lessonId={lesson.id} />

          {/* Q&A Section */}
          <LessonQA lessonId={lesson.id} />
        </div>

        {/* Lesson List Sidebar */}
        <div className="fixed bottom-4 right-4 z-40">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => navigate(`/course/${course?.id}/lessons`)}
            className="shadow-lg"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {courseLessons.length} {isArabic ? 'حصص' : 'lessons'}
          </Button>
        </div>
      </main>
    </div>
  );
}
