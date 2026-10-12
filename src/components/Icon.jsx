const paths = {
  paw: <><ellipse cx="6.5" cy="8" rx="2.2" ry="3" transform="rotate(-25 6.5 8)" /><ellipse cx="11" cy="5.5" rx="2" ry="2.8" /><ellipse cx="16" cy="6.5" rx="2" ry="2.8" transform="rotate(20 16 6.5)" /><ellipse cx="19.5" cy="11" rx="1.9" ry="2.6" transform="rotate(35 19.5 11)" /><path d="M7.3 14.4c1.1-1.1 1.6-3.3 4.3-3.3s3.1 2.2 4.4 3.4c1.2 1.1 2.5 2 2 4-.5 2-2.6 2.2-4.1 1.6a5.8 5.8 0 0 0-4.4 0c-1.8.7-3.7.3-4.1-1.5-.4-1.7.7-3 1.9-4.2Z" /></>,
  dog: <><path d="m8 4-3-1-3 7 4 2 2-5m8-3 3-1 3 7-4 2-2-5M8 4h8l2 8v5c0 3-3 5-6 5s-6-2-6-5v-5" /><path d="M9 12h.01M15 12h.01M10 16h4l-2 2-2-2Zm2 2v3" /></>,
  cat: <><path d="M4 11V3l6 4h4l6-4v8a8 8 0 1 1-16 0Z" /><path d="M8 12h.01M16 12h.01m-5 4 1 1 1-1M2 15l4 1m12 0 4-1M2 19l4-1m12 0 4 1" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  back: <path d="M20 12H4m6-6-6 6 6 6" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
  upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m21 15-6-6L3 21" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  logout: <><path d="M9 3H4v18h5m5-5 5-4-5-4m-5 4h12" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  female: <><circle cx="12" cy="8" r="5" /><path d="M12 13v9m-4-4h8" /></>,
  male: <><circle cx="9" cy="15" r="6" /><path d="m13 11 8-8m-6 0h6v6" /></>,
  sex: <><circle cx="9" cy="9" r="5" /><path d="M9 14v8m-3-3h6m1-14 3-3m0 0h5v5m0-5-5 5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-14 4h2m4 0h2m-8 3h2" /></>,
  birthday: <><path d="M4 21v-8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8M2 21h20M4 16c2 3 4-3 6 0s4-3 6 0 4 0 4 0M8 11V8m8 3V8m-4 3V7" /><path d="M12 3c-2 2-2 3 0 3s2-1 0-3Z" /></>,
  home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" />,
  friends: <><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 3a4 4 0 0 1 0 8m2 3a6 6 0 0 1 3 5v2" /></>,
  smile: <><circle cx="12" cy="12" r="9" /><path d="M8 9h.01M16 9h.01M8 15a5 5 0 0 0 8 0" /></>,
  energy: <path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z" />,
  note: <><path d="M14 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9M14 3v7h7l-7-7Z" /><path d="M7 14h10M7 17h7" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10h.01" /></>,
  refresh: <path d="M20 7a9 9 0 1 0 1 8M20 3v5h-5" />,
};

export default function Icon({ name = 'paw', className = '', ...props }) {
  return (
    <svg className={'icon ' + className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      {paths[name] || paths.paw}
    </svg>
  );
}
