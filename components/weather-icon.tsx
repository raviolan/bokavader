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
  size?: number;
  strokeWidth?: number;
};

export function WeatherIcon({ weatherLabel, className, size = 16, strokeWidth = 2 }: WeatherIconProps) {
  const normalized = weatherLabel.trim().toLowerCase();

  if (normalized === "sunny") {
    return <Sun aria-hidden="true" className={className} size={size} strokeWidth={strokeWidth} />;
  }

  if (normalized === "rainy") {
    return <CloudRain aria-hidden="true" className={className} size={size} strokeWidth={strokeWidth} />;
  }

  if (normalized === "snowy") {
    return <Snowflake aria-hidden="true" className={className} size={size} strokeWidth={strokeWidth} />;
  }

  if (normalized === "cloudy") {
    return <Cloud aria-hidden="true" className={className} size={size} strokeWidth={strokeWidth} />;
  }

  if (normalized === "stormy") {
    return <CloudLightning aria-hidden="true" className={className} size={size} strokeWidth={strokeWidth} />;
  }

  if (normalized === "windy") {
    return <Wind aria-hidden="true" className={className} size={size} strokeWidth={strokeWidth} />;
  }

  return <Sparkles aria-hidden="true" className={className} size={size} strokeWidth={strokeWidth} />;
}
