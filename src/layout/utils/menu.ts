const menu = [
  {
    key: 'Demo',
    label: 'Demo',
    icon: 'book-open',
    children: [
      {
        key: 'Demo_Users',
        label: 'Demo_Users',
        icon: 'people',
        path: '/demo/users',
      },
    ],
  },
] satisfies System.MenuOptions[];

export default menu;
