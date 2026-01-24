import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { Link } from "react-router-dom";
import {
  Bot,
  Puzzle,
  Layers,
  UserSearch,
  Quote,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";

const HomePage = () => {
  const { t } = useTranslation();

  const advantages = [
    {
      icon: <Bot className="w-6 h-6 text-primary" />,
      title: t("home.advantages.ai.title"),
      desc: t("home.advantages.ai.desc"),
    },
    {
      icon: <Puzzle className="w-6 h-6 text-primary" />,
      title: t("home.advantages.widget.title"),
      desc: t("home.advantages.widget.desc"),
    },
    {
      icon: <Layers className="w-6 h-6 text-primary" />,
      title: t("home.advantages.management.title"),
      desc: t("home.advantages.management.desc"),
    },
    {
      icon: <UserSearch className="w-6 h-6 text-primary" />,
      title: t("home.advantages.context.title"),
      desc: t("home.advantages.context.desc"),
    },
    {
      icon: <Quote className="w-6 h-6 text-primary" />,
      title: t("home.advantages.canned.title"),
      desc: t("home.advantages.canned.desc"),
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-primary" />,
      title: t("home.advantages.notes.title"),
      desc: t("home.advantages.notes.desc"),
    },
    {
      icon: <ClipboardList className="w-6 h-6 text-primary" />,
      title: t("home.advantages.templates.title"),
      desc: t("home.advantages.templates.desc"),
    },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-24 text-center bg-background">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl max-w-4xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent pb-2">
          {t("home.hero.title")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
          {t("home.hero.subtitle")}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="h-12 px-8 text-lg font-medium">
            <Link to="/register">{t("home.hero.cta")}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 px-8 text-lg font-medium"
          >
            <Link to="/docs">{t("home.hero.secondaryCta")}</Link>
          </Button>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            {t("home.steps.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">
                {t("home.steps.step1.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("home.steps.step1.desc")}
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">
                {t("home.steps.step2.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("home.steps.step2.desc")}
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">
                {t("home.steps.step3.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("home.steps.step3.desc")}
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary font-bold text-xl">
                4
              </div>
              <h3 className="text-xl font-bold mb-2">
                {t("home.steps.step4.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("home.steps.step4.desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-24 bg-background">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              {t("home.advantages.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("home.advantages.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((adv, index) => (
              <div
                key={index}
                className="group flex flex-col p-8 rounded-xl bg-card border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {adv.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{adv.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {adv.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;