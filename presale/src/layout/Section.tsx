import { ReactNode } from 'react';

type ISectionProps = {
  children: ReactNode;
};

const Section = (props: ISectionProps) => (
  <div
    className={`dark:bg-gray-800 dark:text-white mx-auto relative px-3 py-16`}
  >
    {props.children}
  </div>
);

export { Section };
