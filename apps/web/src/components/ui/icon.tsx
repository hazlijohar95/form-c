import "./icon.css";

export type IconSize = "small" | "normal" | "medium" | "large";

export type IconName =
  | "arrow-up"
  | "arrow-left"
  | "arrow-right"
  | "check"
  | "check-small"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "chevron-grabber-vertical"
  | "circle-check"
  | "circle-x"
  | "close"
  | "close-small"
  | "collapse"
  | "copy"
  | "dash"
  | "dot-grid"
  | "download"
  | "enter"
  | "expand"
  | "eye"
  | "help"
  | "keyboard"
  | "link"
  | "magnifying-glass"
  | "menu"
  | "plus"
  | "plus-small"
  | "selector"
  | "shield"
  | "sidebar"
  | "sliders"
  | "stop"
  | "trash"
  | "warning";

interface IconDef {
  viewBox: string;
  body: string;
}

const PATHS: Record<IconName, IconDef> = {
  "arrow-up": {
    viewBox: "0 0 20 20",
    body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M9.99991 2.24121L16.0921 8.33343L15.2083 9.21731L10.6249 4.63397V17.5001H9.37492V4.63398L4.7916 9.21731L3.90771 8.33343L9.99991 2.24121Z" fill="currentColor"/>`,
  },
  "arrow-left": {
    viewBox: "0 0 20 20",
    body: `<path d="M8.33464 4.58398L2.91797 10.0007L8.33464 15.4173M3.33464 10.0007H17.0846" stroke="currentColor" stroke-linecap="square"/>`,
  },
  "arrow-right": {
    viewBox: "0 0 20 20",
    body: `<path d="M11.6654 4.58398L17.082 10.0007L11.6654 15.4173M16.6654 10.0007H2.91536" stroke="currentColor" stroke-linecap="square"/>`,
  },
  check: {
    viewBox: "0 0 20 20",
    body: `<path d="M5 11.9657L8.37838 14.7529L15 5.83398" stroke="currentColor" stroke-linecap="square"/>`,
  },
  "check-small": {
    viewBox: "0 0 20 20",
    body: `<path d="M6.5 11.4412L8.97059 13.5L13.5 6.5" stroke="currentColor" stroke-linecap="square"/>`,
  },
  "chevron-down": {
    viewBox: "0 0 20 20",
    body: `<path d="M6.6665 8.33325L9.99984 11.6666L13.3332 8.33325" stroke="currentColor" stroke-linecap="square"/>`,
  },
  "chevron-left": {
    viewBox: "0 0 20 20",
    body: `<path d="M12 15L7 10L12 5" stroke="currentColor" stroke-linecap="square"/>`,
  },
  "chevron-right": {
    viewBox: "0 0 20 20",
    body: `<path d="M8 15L13 10L8 5" stroke="currentColor" stroke-linecap="square"/>`,
  },
  "chevron-grabber-vertical": {
    viewBox: "0 0 20 20",
    body: `<path d="M6.66675 12.4998L10.0001 15.8332L13.3334 12.4998M6.66675 7.49984L10.0001 4.1665L13.3334 7.49984" stroke="currentColor" stroke-linecap="square"/>`,
  },
  "circle-check": {
    viewBox: "0 0 20 20",
    body: `<path d="M12.4987 7.91732L8.7487 12.5007L7.08203 10.834M17.9154 10.0007C17.9154 14.3729 14.371 17.9173 9.9987 17.9173C5.62644 17.9173 2.08203 14.3729 2.08203 10.0007C2.08203 5.6284 5.62644 2.08398 9.9987 2.08398C14.371 2.08398 17.9154 5.6284 17.9154 10.0007Z" stroke="currentColor" stroke-linecap="square"/>`,
  },
  "circle-x": {
    viewBox: "0 0 20 20",
    body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M1.6665 10.0003C1.6665 5.39795 5.39746 1.66699 9.99984 1.66699C14.6022 1.66699 18.3332 5.39795 18.3332 10.0003C18.3332 14.6027 14.6022 18.3337 9.99984 18.3337C5.39746 18.3337 1.6665 14.6027 1.6665 10.0003ZM7.49984 6.91107L6.91058 7.50033L9.41058 10.0003L6.91058 12.5003L7.49984 13.0896L9.99984 10.5896L12.4998 13.0896L13.0891 12.5003L10.5891 10.0003L13.0891 7.50033L12.4998 6.91107L9.99984 9.41107L7.49984 6.91107Z" fill="currentColor"/>`,
  },
  close: {
    viewBox: "0 0 20 20",
    body: `<path d="M3.75 3.75L16.25 16.25M16.25 3.75L3.75 16.25" stroke="currentColor" stroke-linecap="square"/>`,
  },
  "close-small": {
    viewBox: "0 0 20 20",
    body: `<path d="M6 6L14 14M14 6L6 14" stroke="currentColor" stroke-linecap="square"/>`,
  },
  collapse: {
    viewBox: "0 0 20 20",
    body: `<path d="M16.666 8.33398H11.666V3.33398" stroke="currentColor" stroke-linecap="square"/><path d="M8.33398 16.666V11.666H3.33398" stroke="currentColor" stroke-linecap="square"/>`,
  },
  copy: {
    viewBox: "0 0 20 20",
    body: `<path d="M6.2513 6.24935V2.91602H17.0846V13.7493H13.7513M13.7513 6.24935V17.0827H2.91797V6.24935H13.7513Z" stroke="currentColor" stroke-linecap="round"/>`,
  },
  dash: {
    viewBox: "0 0 20 20",
    body: `<rect x="5" y="9.5" width="10" height="1" fill="currentColor"/>`,
  },
  "dot-grid": {
    viewBox: "0 0 20 20",
    body: `<path d="M2.08398 9.16602H3.75065V10.8327H2.08398V9.16602Z" fill="currentColor" stroke="currentColor"/><path d="M10.834 9.16602H9.16732V10.8327H10.834V9.16602Z" fill="currentColor" stroke="currentColor"/><path d="M16.2507 9.16602H17.9173V10.8327H16.2507V9.16602Z" fill="currentColor" stroke="currentColor"/>`,
  },
  download: {
    viewBox: "0 0 20 20",
    body: `<path d="M13.9583 10.6257L10 14.584L6.04167 10.6257M10 2.08398V13.959M16.25 17.9173H3.75" stroke="currentColor" stroke-linecap="square"/>`,
  },
  enter: {
    viewBox: "0 0 20 20",
    body: `<path d="M5.83333 15.8334L2.5 12.5L5.83333 9.16671M3.33333 12.5H17.9167V4.58337H10" stroke="currentColor" stroke-linecap="square"/>`,
  },
  expand: {
    viewBox: "0 0 20 20",
    body: `<path d="M4.58301 10.4163V15.4163H9.58301M10.4163 4.58301H15.4163V9.58301" stroke="currentColor" stroke-linecap="square"/>`,
  },
  eye: {
    viewBox: "0 0 20 20",
    body: `<path d="M10 4.58325C5.83333 4.58325 2.5 9.99992 2.5 9.99992C2.5 9.99992 5.83333 15.4166 10 15.4166C14.1667 15.4166 17.5 9.99992 17.5 9.99992C17.5 9.99992 14.1667 4.58325 10 4.58325Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="10" r="2.5" stroke="currentColor"/>`,
  },
  help: {
    viewBox: "0 0 20 20",
    body: `<path d="M7.91683 7.91927V6.2526H12.0835V8.7526L10.0002 10.0026V12.0859M10.0002 13.7526V13.7609M17.9168 10.0026C17.9168 14.3749 14.3724 17.9193 10.0002 17.9193C5.62791 17.9193 2.0835 14.3749 2.0835 10.0026C2.0835 5.63035 5.62791 2.08594 10.0002 2.08594C14.3724 2.08594 17.9168 5.63035 17.9168 10.0026Z" stroke="currentColor" stroke-linecap="square"/>`,
  },
  keyboard: {
    viewBox: "0 0 20 20",
    body: `<path d="M5.125 7.375V4.375H14.875V2.875M8.3125 13.9375H11.6875M2.125 7.375H17.875V17.125H2.125V7.375ZM5.5 10.375H5.125V10.75H5.5V10.375ZM8.5 10.375H8.125V10.75H8.5V10.375ZM11.875 10.375H11.5V10.75H11.875V10.375ZM14.875 10.375H14.5V10.75H14.875V10.375ZM14.875 13.75H14.5V14.125H14.875V13.75ZM5.5 13.75H5.125V14.125H5.5V13.75Z" stroke="currentColor" stroke-linecap="square"/>`,
  },
  link: {
    viewBox: "0 0 20 20",
    body: `<path d="M2.08334 12.0833L1.72979 11.7298L1.37624 12.0833L1.72979 12.4369L2.08334 12.0833ZM7.91668 17.9167L7.56312 18.2702L7.91668 18.6238L8.27023 18.2702L7.91668 17.9167ZM17.9167 7.91666L18.2702 8.27022L18.6238 7.91666L18.2702 7.56311L17.9167 7.91666ZM12.0833 2.08333L12.4369 1.72977L12.0833 1.37622L11.7298 1.72977L12.0833 2.08333ZM2.08334 12.0833L1.72979 12.4369L7.56312 18.2702L7.91668 17.9167L8.27023 17.5631L2.4369 11.7298L2.08334 12.0833ZM17.9167 7.91666L18.2702 7.56311L12.4369 1.72977L12.0833 2.08333L11.7298 2.43688L17.5631 8.27022L17.9167 7.91666ZM7.91668 17.9167L8.27023 18.2702L11.6036 14.9369L11.25 14.5833L10.8965 14.2298L7.56312 17.5631L7.91668 17.9167Z" fill="currentColor"/>`,
  },
  "magnifying-glass": {
    viewBox: "0 0 16 16",
    body: `<path d="M13 13L10.6418 10.6418M11.9552 7.47761C11.9552 9.95053 9.95053 11.9552 7.47761 11.9552C5.0047 11.9552 3 9.95053 3 7.47761C3 5.0047 5.0047 3 7.47761 3C9.95053 3 11.9552 5.0047 11.9552 7.47761Z" stroke="currentColor" stroke-linecap="square"/>`,
  },
  menu: {
    viewBox: "0 0 20 20",
    body: `<path d="M2.5 5H17.5M2.5 10H17.5M2.5 15H17.5" stroke="currentColor" stroke-linecap="square"/>`,
  },
  plus: {
    viewBox: "0 0 20 20",
    body: `<path d="M9.9987 2.20703V9.9987M9.9987 9.9987V17.7904M9.9987 9.9987H2.20703M9.9987 9.9987H17.7904" stroke="currentColor" stroke-linecap="square"/>`,
  },
  "plus-small": {
    viewBox: "0 0 20 20",
    body: `<path d="M9.99984 5.41699V10.0003M9.99984 10.0003V14.5837M9.99984 10.0003H5.4165M9.99984 10.0003H14.5832" stroke="currentColor" stroke-linecap="square"/>`,
  },
  selector: {
    viewBox: "0 0 20 20",
    body: `<path d="M6.66626 12.5033L9.99959 15.8366L13.3329 12.5033M6.66626 7.50326L9.99959 4.16992L13.3329 7.50326" stroke="currentColor" stroke-linecap="square"/>`,
  },
  shield: {
    viewBox: "0 0 20 20",
    body: `<path d="M7.49935 9.3737L9.16602 11.0404L12.4994 7.70703M9.99935 2.08203L17.0827 4.3737V9.92565C17.0827 14.0694 13.3327 16.2487 9.99935 18.047C6.66602 16.2487 2.91602 14.0694 2.91602 9.92565V4.3737L9.99935 2.08203Z" stroke="currentColor" stroke-linecap="square"/>`,
  },
  sidebar: {
    viewBox: "0 0 20 20",
    body: `<path d="M7.86667 2H5.2H2V18H5.2H7.86667M7.86667 2H18V18H7.86667M7.86667 2V18" stroke="currentColor"/>`,
  },
  sliders: {
    viewBox: "0 0 20 20",
    body: `<path d="M3.625 6.25H10.9375M16.375 13.75H10.5625M3.625 13.75H4.9375M11.125 6.25C11.125 4.79969 12.2997 3.625 13.75 3.625C15.2003 3.625 16.375 4.79969 16.375 6.25C16.375 7.70031 15.2003 8.875 13.75 8.875C12.2997 8.875 11.125 7.70031 11.125 6.25ZM10.375 13.75C10.375 15.2003 9.20031 16.375 7.75 16.375C6.29969 16.375 5.125 15.2003 5.125 13.75C5.125 12.2997 6.29969 11.125 7.75 11.125C9.20031 11.125 10.375 12.2997 10.375 13.75Z" stroke="currentColor" stroke-linecap="square"/>`,
  },
  stop: {
    viewBox: "0 0 20 20",
    body: `<rect x="5" y="5" width="10" height="10" fill="currentColor"/>`,
  },
  trash: {
    viewBox: "0 0 20 20",
    body: `<path d="M4.16677 4.58008L3.66701 4.5996L4.22816 17.5379L4.72792 17.4934L5.22767 17.4489L4.66652 4.54055L4.16677 4.58008ZM15.4167 17.9134L15.8332 17.5379L16.2498 4.5996L15.7501 4.58008L15.2503 4.56055L14.8337 17.4989L15.4167 17.9134ZM15.8334 4.58008V4.08008H4.16677V4.58008V5.08008H15.8334V4.58008Z" fill="currentColor"/>`,
  },
  warning: {
    viewBox: "0 0 20 20",
    body: `<path d="M10 7.91667V11.6667M10 13.7417V13.75M10 2.5L1.875 16.25H18.125L10 2.5Z" stroke="currentColor" stroke-linecap="square"/>`,
  },
};

const DIRECTIONAL: ReadonlySet<IconName> = new Set(["arrow-left", "arrow-right", "chevron-left", "chevron-right"]);

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: IconSize;
}

export function Icon(props: IconProps): JSX.Element {
  const { name, size, ...rest } = props;
  const def = PATHS[name];
  if (!def) return <div data-component="icon" data-size={size ?? "normal"} aria-hidden="true" />;
  return (
    <div
      data-component="icon"
      data-size={size ?? "normal"}
      data-directional={DIRECTIONAL.has(name) ? true : undefined}
    >
      <svg
        data-slot="icon-svg"
        fill="none"
        viewBox={def.viewBox}
        aria-hidden="true"
        {...rest}
        dangerouslySetInnerHTML={{ __html: def.body }}
      />
    </div>
  );
}
