import { ReactElement, useState } from 'react';

import TabTitle from './TabTitle';

type Props = {
  children: ReactElement[];
};

const Tabs: React.FC<Props> = ({ children }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <div>
      <ul className="tabs">
        {children.map((item, index) => {
          if (selectedTab === index) {
            return (
              <TabTitle
                key={index}
                title={item.props.title}
                index={index}
                className="active"
                setSelectedTab={setSelectedTab}
              />
            );
          }
          return (
            <TabTitle
              key={index}
              title={item.props.title}
              index={index}
              className=""
              setSelectedTab={setSelectedTab}
            />
          );
        })}
      </ul>
      {children[selectedTab]}
    </div>
  );
};

export default Tabs;
