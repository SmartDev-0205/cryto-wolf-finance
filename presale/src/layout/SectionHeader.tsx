import { ReactNode } from 'react';

type ISectionProps = {
  title?: string;
  description?: string;
  yPadding?: string;
  children: ReactNode;
};

const SectionHeader = (props: ISectionProps) => (
  <div
    className={`dark:bg-gray-700 dark:text-white mx-auto px-3 sticky top-0 z-50 w-full border-header bg-white font-press-start ${
      props.yPadding ? props.yPadding : 'py-16'
    }`}
  >
    {(props.title || props.description) && (
      <div className="mb-12 text-center">
        {props.title && (
          <h2 className="text-4xl text-gray-900 font-bold">{props.title}</h2>
        )}
        {props.description && (
          <div className="mt-4 text-xl md:px-20">{props.description}</div>
        )}
      </div>
    )}

    {props.children}
    <style jsx>
      {`
        .border-header {
          border-bottom: 2px solid rgba(133, 133, 133, 0.1);
        }
      `}
    </style>
  </div>
);

export { SectionHeader };
