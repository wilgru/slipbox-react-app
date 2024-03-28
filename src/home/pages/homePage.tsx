import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthentication } from "src/authentication/hooks/useAuthentication";
import GalleryView from "src/home/components/GalleryView/GalleryView";
import { Sidebar } from "src/home/components/Sidebar/Sidebar";
import { Toolbar } from "src/home/components/Toolbar/Toolbar";
import { useSlips } from "src/slips/hooks/useSlips";
import { TopicList } from "src/topics/components/TopicList/TopicList";
import { useTopics } from "src/topics/hooks/useTopics";

function HomePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthentication();
  const { topics } = useTopics();
  const { createSlip } = useSlips();

  const [searchParams, setSearchParams] = useSearchParams();
  const [showSidebar, setShowSidebar] = useState(false);

  const sideBarSections = useMemo(
    () => [{ title: "Topics", component: <TopicList topics={topics} /> }],
    [topics]
  );

  const onClickNewSlipButton = (): void => {
    const createdSlipId = createSlip();

    searchParams.set("openSlip", createdSlipId);
    setSearchParams(searchParams);
  };

  const onClickShowSidebarToggle = (): void => {
    setShowSidebar((currentShowSidebar) => !currentShowSidebar);
  };

  useEffect(() => {
    !currentUser && navigate("/login");
  }, []);

  return (
    <div className="fixed h-screen w-screen">
      <div className="flex flex-col h-full">
        <Toolbar
          showSidebar={showSidebar}
          onClickShowSidebarToggle={onClickShowSidebarToggle}
          onClickNewSlipButton={onClickNewSlipButton}
        />
        <div className="flex flex-row gap-3 h-full min-h-0 mt-3 ml-3 mb-2">
          {showSidebar && <Sidebar sections={sideBarSections} />}
          <GalleryView />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
