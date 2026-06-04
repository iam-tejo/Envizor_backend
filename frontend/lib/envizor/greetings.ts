// lib/envizor/greetings.ts

import { ChatMessage } from "./types";

export const SUGGESTIONS: string[] = [
  "Discover Saviynt tenants",
  "Explore Terraform workspaces",
  "Compare tenants or workspaces",
  "Generate Terraform files",
  "Deploy Terraform to Saviynt",
  "Understand how this wizard works",
  "Explain this wizard screen",
  "What does this Terraform file do?",
  "How do Saviynt environments map to Terraform?",
  "What is a Terraform workspace?",
  "How do I structure my environments?",
  "What is the next step I should take?",
];

export const GREETING =
  "👋 **Hi, I’m Envizor — your Terraform + Saviynt assistant.**\n\n" +
  "I can walk you through the wizard, explain any screen, compare environments, discover tenants, or help you generate and deploy Terraform safely.\n\n" +
  "**Here are some things you can ask me:**";

export function getGreetingMessage(): ChatMessage {
  return {
    from: "bot",
    text: GREETING,
    suggestions: SUGGESTIONS,
  };
}
