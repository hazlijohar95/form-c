import "./provider-icon.css";
import type { SVGAttributes } from "react";

export interface ProviderIconProps extends SVGAttributes<SVGSVGElement> {
  id: string;
}

const KNOWN = new Set([
  "anthropic",
  "openai",
  "google",
  "github-copilot",
  "azure",
  "bedrock",
  "deepseek",
  "groq",
  "mistral",
  "ollama",
  "openrouter",
  "xai",
  "synthetic",
]);

export function ProviderIcon(props: ProviderIconProps): JSX.Element {
  const { id, ...rest } = props;
  const resolved = KNOWN.has(id) ? id : "synthetic";
  return (
    <svg {...rest} data-component="provider-icon" data-provider={resolved} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <text x="8" y="11" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor">
        {resolved.slice(0, 1).toUpperCase()}
      </text>
    </svg>
  );
}
