import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { GraduationCap, Award, Users, BookOpen, Tv, Calendar, Heart, Rocket } from 'lucide-react';
import teacherImage from '@/assets/teacher.jpg';

const About = () => {
  const stats = [
    {
      icon: Calendar,
      value: '25',
      label: 'سنة خبرة',
    },
    {
      icon: Users,
      value: '+10,000',
      label: 'طالب اتعلم معايا',
    },
    {
      icon: Tv,
      value: '2020',
      label: 'بداية قناة مدرستنا',
    },
    {
      icon: Award,
      value: 'موجه',
      label: 'مادة الكيمياء',
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          
          {/* Hero Section - من هو حسام فكري */}
          <section className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                  موجه مادة الكيمياء
                </span>
                
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                  أنا حسام فكري
                </h1>
                
                <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                  لو بتدور على حد يفهمك الكيمياء بجد، مش بس يحفظهالك.. 
                  يبقى إنت في المكان الصح.
                </p>
                
                <p className="text-muted-foreground leading-relaxed mb-4">
                  أنا مش مجرد مدرس، أنا موجه لمادة الكيمياء، 
                  ومن أوائل المدرسين اللي ظهروا على قناة مدرستنا التابعة لوزارة التربية والتعليم 
                  من سنة 2020.
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  خبرتي في التدريس أكتر من 25 سنة، 
                  وكل سنة بتعلم حاجة جديدة من طلابي زي ما بيتعلموا مني.
                </p>
              </div>
              
              <div className="order-1 lg:order-2 flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-xl"></div>
                  <img 
                    src={teacherImage} 
                    alt="حسام فكري"
                    className="relative w-80 h-80 md:w-96 md:h-96 object-cover rounded-3xl shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="mb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-primary mb-2">{stat.value}</p>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Experience Section - الخبرة والمصداقية */}
          <section className="mb-20">
            <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  ليه تثق فيا؟
                </h2>
              </div>
              
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  أنا مش بقولك كلام وخلاص.. 
                  أنا موجه مادة الكيمياء، يعني شغلتي الأساسية إني أتابع المدرسين 
                  وأتأكد إن المنهج بيتشرح صح.
                </p>
                
                <p>
                  ولما الوزارة قررت تعمل قناة مدرستنا سنة 2020، 
                  كنت من المدرسين اللي اختاروهم يشرحوا الكيمياء لطلاب ثانوي على مستوى الجمهورية.
                </p>
                
                <p>
                  يعني لو بتسأل نفسك: ده فاهم ولا لأ؟ 
                  الوزارة نفسها اختارتني أشرح لكل طلاب مصر.
                </p>
                
                <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                  <p className="text-foreground font-medium">
                    25 سنة بدرس فيهم كيمياء، شفت فيهم كل أنواع الطلاب.. 
                    اللي بيحب المادة واللي بيكرهها، واللي مش فاهم ليه أصلا بيدرسها.
                    <br />
                    وبفهمهم كلهم.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Turning Point - نقطة التحول */}
          <section className="mb-20">
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-3xl p-8 md:p-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <Rocket className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  إزاي البلاتفورم ده اتولد؟
                </h2>
              </div>
              
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  سنة 2020، لما كورونا قلبت الدنيا وكل حاجة اتقفلت، 
                  الطلاب فضلوا في البيوت ومحدش عارف يعمل إيه.
                </p>
                
                <p>
                  في الوقت ده، قررت إني مستناش حد يحل المشكلة.. 
                  قلت لازم أعمل حاجة بنفسي.
                </p>
                
                <p>
                  فبنيت البلاتفورم ده عشان الطالب يقدر يتابع دروسه من بيته، 
                  من غير ما يضطر يروح سناتر أو يستنى حد.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-background/50 rounded-2xl p-6 border border-border">
                    <BookOpen className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-bold text-foreground mb-2">دروس كاملة</h3>
                    <p className="text-sm">
                      كل الدروس متسجلة ومتاحة في أي وقت، 
                      تقدر ترجعلها وتفهمها على مهلك.
                    </p>
                  </div>
                  
                  <div className="bg-background/50 rounded-2xl p-6 border border-border">
                    <Users className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-bold text-foreground mb-2">متابعة مستمرة</h3>
                    <p className="text-sm">
                      مش بس شرح وخلاص، 
                      ده فيه متابعة ليك ولحضورك ودرجاتك.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Closing Message - رسالة ختامية */}
          <section>
            <div className="bg-card border border-border rounded-3xl p-8 md:p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                رسالتي ليك
              </h2>
              
              <div className="max-w-2xl mx-auto space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  أنا مش هقولك إن الكيمياء سهلة.. 
                  لأ، هي محتاجة شغل وتركيز.
                </p>
                
                <p>
                  بس هقولك إنك لو فهمتها صح من الأول، 
                  مش هتحتاج تحفظ حاجة.
                </p>
                
                <p>
                  أنا هنا عشان أفهمك، مش عشان أحفظك.
                  <br />
                  عشان أخليك تحب المادة، مش تخاف منها.
                </p>
                
                <p className="text-foreground font-bold text-lg pt-4">
                  ولو جاهز تبدأ صح، أنا معاك.
                </p>
              </div>
            </div>
          </section>
          
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;