import type { ReactNode } from "react";
import "./sticky-accordion-header.css";
import { Accordion } from "./accordion";

export interface StickyAccordionHeaderProps {
  className?: string;
  children: ReactNode;
}

export function StickyAccordionHeader(props: StickyAccordionHeaderProps): JSX.Element {
  return (
    <Accordion.Header data-component="sticky-accordion-header" className={props.className}>
      {props.children}
    </Accordion.Header>
  );
}
