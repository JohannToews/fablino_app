import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { KidProfileProvider } from "@/hooks/useKidProfile";
import PremiumUiBodyClass from "@/components/PremiumUiBodyClass";
import PremiumRouteTransition from "@/components/PremiumRouteTransition";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import OfflineBanner from "@/components/OfflineBanner";
import PwaUpdateBanner from "@/components/PwaUpdateBanner";
import HomeClassic from "./pages/HomeClassic";
import HomeFablino from "./pages/HomeFablino";
import { FEATURES } from "./config/features";
import AdminPage from "./pages/AdminPage";
import AdminConfigPage from "./pages/AdminConfigPage";
import FeatureFlagsPage from "./pages/FeatureFlagsPage";
import StorySelectPage from "./pages/StorySelectPage";
import ReadingPage from "./pages/ReadingPage";
// POST-BETA: Vokabel-Quiz & Verwaltung — reaktivieren wenn Wort-Tracking zeigt dass Feature genutzt wird
// import VocabularyQuizPage from "./pages/VocabularyQuizPage";
// import VocabularyManagePage from "./pages/VocabularyManagePage";
import ResultsPage from "./pages/ResultsPage";
import CollectionPage from "./pages/CollectionPage";
import FeedbackStatsPage from "./pages/FeedbackStatsPage";
import StoryStatsPage from "./pages/StoryStatsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import CreateStoryPage from "./pages/CreateStoryPage";
// InstallPage removed – install handled inline via useInstallPrompt
import ShareRedirectPage from "./pages/ShareRedirectPage";
import StickerBookPage from "./pages/StickerBookPage";
import MyLookPage from "./pages/MyLookPage";
import MyLookPageV2 from "./pages/MyLookPageV2";
import MyPeoplePage from "./pages/MyPeoplePage";
import WelcomePage from "./pages/WelcomePage";
import OnboardingKindPage from "./pages/OnboardingKindPage";
import OnboardingStoryPage from "./pages/OnboardingStoryPage";
import NotFound from "./pages/NotFound";
import { useAvatarV2 } from "@/hooks/useFeatureFlags";

const queryClient = new QueryClient();

const MyLookRoute = () => {
  const avatarV2Enabled = useAvatarV2();
  return avatarV2Enabled ? <MyLookPageV2 /> : <MyLookPage />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <KidProfileProvider>
          <Toaster />
        <Sonner />
        <OfflineBanner />
        <PwaUpdateBanner />
        <ErrorBoundary>
        <BrowserRouter>
          <PremiumUiBodyClass />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            {/* /install route removed – handled inline */}
            <Route path="/s/:token" element={<ShareRedirectPage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/onboarding/child" element={<OnboardingKindPage />} />
            <Route path="/onboarding/story" element={<OnboardingStoryPage />} />
<Route element={<PremiumRouteTransition />}>
              <Route path="/" element={
                <ProtectedRoute>
                  {FEATURES.NEW_FABLINO_HOME ? <HomeFablino /> : <HomeClassic />}
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute skipKidCheck>
                  <AdminPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/config" element={
                <ProtectedRoute skipKidCheck>
                  <AdminConfigPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/feature-flags" element={
                <ProtectedRoute skipKidCheck>
                  <FeatureFlagsPage />
                </ProtectedRoute>
              } />
              <Route path="/stories" element={
                <ProtectedRoute>
                  <StorySelectPage />
                </ProtectedRoute>
              } />
              <Route path="/my-look" element={
                <ProtectedRoute>
                  <MyLookRoute />
                </ProtectedRoute>
              } />
              <Route path="/my-look-v2" element={
                <ProtectedRoute>
                  <MyLookPageV2 />
                </ProtectedRoute>
              } />
              <Route path="/my-people" element={
                <ProtectedRoute>
                  <MyPeoplePage />
                </ProtectedRoute>
              } />
              <Route path="/read/:id" element={
                <ProtectedRoute skipKidCheck>
                  <ReadingPage />
                </ProtectedRoute>
              } />
              {/* POST-BETA: Vokabel-Quiz Route — reaktivieren wenn Wort-Tracking zeigt dass Feature genutzt wird
              <Route path="/quiz" element={
                <ProtectedRoute>
                  <VocabularyQuizPage />
                </ProtectedRoute>
              } />
              <Route path="/words" element={
                <ProtectedRoute>
                  <VocabularyManagePage />
                </ProtectedRoute>
              } />
              */}
              <Route path="/results" element={
                <ProtectedRoute>
                  <ResultsPage />
                </ProtectedRoute>
              } />
              <Route path="/feedback-stats" element={
                <ProtectedRoute>
                  <FeedbackStatsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/story-stats" element={
                <ProtectedRoute skipKidCheck>
                  <StoryStatsPage />
                </ProtectedRoute>
              } />
              <Route path="/create-story" element={
                <ProtectedRoute>
                  <CreateStoryPage />
                </ProtectedRoute>
              } />
              <Route path="/collection" element={
                <ProtectedRoute>
                  <CollectionPage />
                </ProtectedRoute>
              } />
              <Route path="/sticker-buch" element={
                <ProtectedRoute>
                  <StickerBookPage />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </ErrorBoundary>
        </KidProfileProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
