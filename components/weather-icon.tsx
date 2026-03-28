import {
  Cloud,
  CloudLightning,
  CloudRain,
  Snowflake,
  Sparkles,
  Sun,
  Wind,
} from "lucide-react";

type WeatherIconProps = {
  weatherLabel: string;
  className?: string;
};

export function WeatherIcon({ weatherLabel, className }: WeatherIconProps) {
  const normalized = weatherLabel.trim().toLowerCase();

  if (normalized === "sunny") {
    return <Sun aria-hidden="true" className={className} size={16} strokeWidth={2} />;
  }

  if (normalized === "rainy") {
    return <CloudRain aria-hidden="true" className={className} size={16} strokeWidth={2} />;
  }

  if (normalized === "snowy") {
    return <Snowflake aria-hidden="true" className={className} size={16} strokeWidth={2} />;
  }

  if (normalized === "cloudy") {
    return <Cloud aria-hidden="true" className={className} size={16} strokeWidth={2} />;
  }

  if (normalized === "stormy") {
    return <CloudLightning aria-hidden="true" className={className} size={16} strokeWidth={2} />;
  }

  if (normalized === "windy") {
    return <Wind aria-hidden="true" className={className} size={16} strokeWidth={2} />;
  }

  return <Sparkles aria-hidden="true" className={className} size={16} strokeWidth={2} />;
}
