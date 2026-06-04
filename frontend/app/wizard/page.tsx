import { redirect } from "next/navigation";

export default function WizardRootPage() {
  redirect("/wizard/steps/welcome");
}
