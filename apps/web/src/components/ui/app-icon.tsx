import "./app-icon.css";
import type { ImgHTMLAttributes } from "react";

export interface AppIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  id: string;
  src?: string;
}

export function AppIcon(props: AppIconProps): JSX.Element {
  const { id, src, alt, draggable, ...rest } = props;
  if (!src) {
    return (
      <span {...rest} data-component="app-icon" data-app={id} role="img" aria-label={alt ?? id}>
        {id.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    <img {...rest} data-component="app-icon" src={src} alt={alt ?? ""} draggable={draggable ?? false} />
  );
}
