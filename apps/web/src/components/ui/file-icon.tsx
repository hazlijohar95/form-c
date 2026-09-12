import "./file-icon.css";
import type { SVGAttributes } from "react";

export interface FileNode {
  path: string;
  type: "file" | "directory";
}

export interface FileIconProps extends SVGAttributes<SVGSVGElement> {
  node: FileNode;
  expanded?: boolean;
  mono?: boolean;
}

function isCode(path: string): boolean {
  return /\.(tsx?|jsx?|mjs|cjs|css|scss|json|md|py|rs|go|sql)$/i.test(path);
}

export function FileIcon(props: FileIconProps): JSX.Element {
  const { node, expanded, mono, ...rest } = props;
  if (node.type === "directory") {
    return (
      <svg {...rest} data-component="file-icon" data-kind="folder" data-expanded={expanded ? "" : undefined} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        {expanded ? (
          <path d="M1.5 4.5a1 1 0 0 1 1-1h3l1.5 1.5h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-6.5Z" stroke="currentColor" strokeWidth="1.2" />
        ) : (
          <path d="M1.5 4a1 1 0 0 1 1-1h3l1.5 2h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4Z" stroke="currentColor" strokeWidth="1.2" />
        )}
      </svg>
    );
  }
  const code = isCode(node.path);
  void mono;
  return (
    <svg {...rest} data-component="file-icon" data-kind={code ? "code" : "file"} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 1.5h5.5L12.5 4.5V14.5h-8.5V1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      {code ? <path d="M6 7.5 4.8 9l1.2 1.5M10 7.5l1.2 1.5L10 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /> : null}
    </svg>
  );
}
