import React from "react";
import { Clock, BarChart3, Shield, Globe } from "lucide-react";
import { useTheme } from "./ui/Theme";

export default function WhyLiirat() {
  const { t } = useTheme();
  const icons = [Clock, BarChart3, Shield, Globe];

  return (
    <div className="px-4 py-16 bg-light-bg dark:bg-dark-bg">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-4xl font-bold mb-4 service-title relative">
            <span className="absolute inset-0 bg-white/30 dark:bg-white/10 blur-lg rounded-lg -z-10"></span>
            {t.whyLiiratTitle}
          </h3>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4">
            {t.whyLiiratSubtitle}
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {t.whyLiiratDescription}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {t.whyLiiratFeatures.map((feature, index) => {
            const Icon = icons[index];
            return (
              <div key={index} className="neumorphic-raised p-8 rounded-2xl text-center group hover:scale-105 transition-transform">
                <div className="w-16 h-16 neumorphic-button rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-8 h-8" style={{ color: 'var(--light-accent)' }} />
                </div>
                <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{feature.title}</h4>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}