import { invokeLLM } from "../_core/llm";
import type { Guidance, ResumeProfile } from "./types";

const MODEL = "gpt-5-mini";

const profileSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "resume_profile",
    strict: true,
    schema: {
      type: "object",
      properties: {
        candidateName: { type: "string" },
        professionalHeadline: { type: "string" },
        professionalSummary: { type: "string" },
        skillKeywords: { type: "array", items: { type: "string" } },
        certifications: { type: "array", items: { type: "string" } },
        targetRoleTitles: { type: "array", items: { type: "string" } },
        roleFamilies: { type: "array", items: { type: "string" } },
        employmentTimeline: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              employer: { type: "string" },
              startDate: { type: "string" },
              endDate: { type: "string" },
            },
            required: ["title", "employer", "startDate", "endDate"],
            additionalProperties: false,
          },
        },
        strongestRoleFamily: { type: "string" },
        evidenceNotes: { type: "array", items: { type: "string" } },
      },
      required: ["candidateName", "professionalHeadline", "professionalSummary", "skillKeywords", "certifications", "targetRoleTitles", "roleFamilies", "employmentTimeline", "strongestRoleFamily", "evidenceNotes"],
      additionalProperties: false,
    },
  },
};

const guidanceSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "career_guidance",
    strict: true,
    schema: {
      type: "object",
      properties: {
        careerGapGuidance: { type: "string" },
        salaryGuidance: { type: "string" },
      },
      required: ["careerGapGuidance", "salaryGuidance"],
      additionalProperties: false,
    },
  },
};

function textFromResponse(response: Awaited<ReturnType<typeof invokeLLM>>) {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("The AI service returned an empty response.");
  }
  return content;
}

export async function extractResumeProfile(rawText: string): Promise<ResumeProfile> {
  const response = await invokeLLM({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You extract résumé facts precisely. Use only information directly supported by the supplied résumé. Do not infer missing skills, employers, dates, tools, qualifications, work authorisation, or salary. Recommend role titles and families only where the documented experience supports them.",
      },
      { role: "user", content: `Extract a structured profile from this résumé:\n\n${rawText.slice(0, 50000)}` },
    ],
    response_format: profileSchema,
  });
  return JSON.parse(textFromResponse(response)) as ResumeProfile;
}

export async function generateNaturalMasterCv(profile: ResumeProfile): Promise<string> {
  const response = await invokeLLM({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You write concise, professional, ATS-readable master CVs in Markdown. Use only the supplied evidence. The CV must sound natural and role-family focused, never copied from a job description. Do not mention that it is tailored, AI-generated, or a match score. Do not invent dates, responsibilities, technologies, metrics, qualifications, or claims. Keep the strongest documented role family in the headline and include a professional profile, core capabilities, experience, certifications, education, and additional information where supported.",
      },
      { role: "user", content: `Write a natural master CV from this verified profile JSON:\n${JSON.stringify(profile)}` },
    ],
  });
  return textFromResponse(response);
}

export async function generateCareerGuidance(profile: ResumeProfile): Promise<Guidance> {
  const response = await invokeLLM({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "Provide careful career-gap and salary-positioning guidance based only on an employment timeline. Never invent a reason for a gap or a previous salary. Give practical wording with bracketed placeholders where the user must supply personal facts. Keep the tone supportive, concise, and suitable for an application dashboard.",
      },
      { role: "user", content: `Create guidance from this verified profile JSON:\n${JSON.stringify(profile)}` },
    ],
    response_format: guidanceSchema,
  });
  return JSON.parse(textFromResponse(response)) as Guidance;
}
