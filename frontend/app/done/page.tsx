import Link from "next/link";
import WizardStepper from "../components/WizardStepper";


export default function DonePage() {
  return (
    <div className="max-w-xl mx-auto mt-20 text-center space-y-6">
      <h1 className="text-3xl font-semibold">Generation Complete</h1>
      <p className="text-gray-700">
        Your Terraform workspace has been generated successfully.
      </p>

      <Link
        href="/output"
        className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        View Output
      </Link>
    </div>
  );
}
