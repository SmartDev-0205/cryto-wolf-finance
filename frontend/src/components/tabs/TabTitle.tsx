import { useCallback } from 'react';

type Props = {
  title: string;
  className: string;
  index: number;
  setSelectedTab: (index: number) => void;
};

const TabTitle: React.FC<Props> = ({
  title,
  className,
  setSelectedTab,
  index,
}) => {
  const onClick = useCallback(() => {
    setSelectedTab(index);
  }, [setSelectedTab, index]);

  return (
    <li className={className}>
      <a onClick={onClick}>{title}</a>
    </li>
  );
};

export default TabTitle;
