import { OnboardingWorkspace } from "@/components/onboarding/onboarding-workspace";
import { onboardingService } from "@/lib/onboarding-service";

export default async function OnboardingPage() {
  const data = await onboardingService.getWorkspace("org_1");

  return <OnboardingWorkspace initialData={data} />;
}
