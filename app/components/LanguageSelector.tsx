import { Link } from "@remix-run/react";
import { Icon } from "@iconify/react";
import { Card } from "./Card";

interface Language {
  id: string;
  name: string;
  icon: string;
}

const languages: Language[] = [
  { id: "javascript", name: "JavaScript", icon: "logos:javascript" },
  { id: "python", name: "Python", icon: "logos:python" },
  { id: "flutter", name: "Flutter", icon: "logos:flutter" },
];

interface LanguageSelectorProps {
  availableLanguages: readonly string[];
}

export function LanguageSelector({ availableLanguages }: LanguageSelectorProps) {
  const filteredLanguages = languages.filter((lang) =>
    availableLanguages.includes(lang.id)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredLanguages.map((language) => (
        <Link key={language.id} to={`/${language.id}`} className="block">
          <Card hoverable className="text-center">
            <div className="flex flex-col items-center gap-4">
              <Icon icon={language.icon} className="w-20 h-20" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {language.name}
              </h2>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
