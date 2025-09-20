import Seo from "@/components/wrappers/Seo";
import PageContainer from "@/components/wrappers/PageContainer";
import AppContainer from "@/components/wrappers/AppContainer";
import Test from "@/components/adminPages/Test";

const Index = () => {
  return (
    <Seo hidden_to_search_engines={true}>
      <AppContainer
        pageIdentifier="dev-page"
        hasSideBarDashboard={false}
        hasHeader={false}
      >
        <Test />
      </AppContainer>
    </Seo>
  );
};

export default Index;
