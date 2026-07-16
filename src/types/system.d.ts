declare namespace System {
  interface MenuOptions {
    key: string;
    label: string;
    icon?: string;
    path?: string;
    link?: string;
    children?: MenuOptions[];
  }
}
