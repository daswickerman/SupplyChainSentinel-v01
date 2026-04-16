import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface RiskAssessment {
  riskScore: number; // 0-100
  summary: string;
  keyRisks: string[];
  mitigationStrategies: string[];
  confidenceScore: number;
}

export async function assessSupplyChainRisk(
  manufacturerName: string,
  locations: { type: string; country: string; details: string }[],
  technologyType: string
): Promise<RiskAssessment> {
  const prompt = `
    Perform a weighted supply chain risk assessment for the following hardware manufacturer:
    
    Manufacturer: ${manufacturerName}
    Primary Technology: ${technologyType}
    
    Supply Chain Nodes:
    ${locations.map(l => `- ${l.type} in ${l.country}: ${l.details}`).join("\n")}
    
    ASSESSMENT CRITERIA & WEIGHTING:
    1. WEIGHTING: Assign significantly higher risk weight to nodes involving "Assembly" (Manufacturing) and "R&D" (Software/Hardware Development), as these are the primary vectors for hardware backdoors, firmware tampering, and IP theft.
    2. GEOPOLITICAL RISK: Evaluate the likelihood of state-sponsored supply chain attacks based on the geographic location of each node. Consider the presence of known Advanced Persistent Threats (APTs) or state actors in those regions.
    3. REGULATORY RISK: Assess risks due to poor local regulation, weak import/export controls, and lack of oversight in the host countries.
    4. STABILITY: Consider regional instability, trade restrictions, and other factors that could impact the integrity or availability of the supply chain.
    5. ADVERSARIAL THREATS: Evaluate the potential for non-state adversaries to exploit vulnerabilities in the supply chain at these specific locations.
    
    MITIGATION STRATEGIES:
    The recommended mitigation strategies MUST be targeted at CONSUMERS AND END-USERS of the technology. These are external entities who purchase and use the hardware produced by this manufacturer. Focus on actions they can take to safeguard their own infrastructure (e.g., enhanced firmware validation, physical hardware integrity checks, network behavioral analysis, supply chain auditing requirements for their own procurement).
    
    Provide a structured risk assessment with an overall risk score (0-100), where 100 is extreme risk.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER, description: "Overall risk score from 0 to 100" },
            summary: { type: Type.STRING, description: "A concise summary of the risk assessment" },
            keyRisks: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of the most significant risks identified"
            },
            mitigationStrategies: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Recommended strategies to mitigate identified risks"
            },
            confidenceScore: { type: Type.NUMBER, description: "AI's confidence in this assessment (0-1)" }
          },
          required: ["riskScore", "summary", "keyRisks", "mitigationStrategies", "confidenceScore"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Assessment Error:", error);
    return {
      riskScore: 50,
      summary: "Failed to generate automated risk assessment. Please review manually.",
      keyRisks: ["Service unavailable"],
      mitigationStrategies: ["Manual review required"],
      confidenceScore: 0
    };
  }
}

export async function identifyThreatActors(
  manufacturerName: string,
  locations: { type: string; country: string; details: string }[],
  headquarters: string
): Promise<string[]> {
  const prompt = `
    Identify potential threat actor links for a hardware manufacturer based on its locations and headquarters.
    
    Manufacturer: ${manufacturerName}
    Headquarters: ${headquarters}
    Supply Chain Locations:
    ${locations.map(l => `- ${l.type} in ${l.country}: ${l.details}`).join("\n")}
    
    CRITICAL: Automatically flag risks based on manufacturing location. For example:
    - If manufacturing is in high-risk jurisdictions (e.g., specific regions known for state-sponsored IP theft).
    - If the company has specific links to known threat actors (e.g., APT groups, entities on restricted lists).
    - If the headquarters is in a country with weak export controls.
    
    Return a list of identified threat actors or risk categories (e.g., "APT41", "State-sponsored surveillance risk", "High-risk jurisdiction: [Country]").
    If no specific actors are found, return broader risk categories related to the geography.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            threatActors: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of identified threat actors or risk categories"
            }
          },
          required: ["threatActors"]
        }
      }
    });

    if (!response.text) return [];
    const result = JSON.parse(response.text);
    return result.threatActors || [];
  } catch (error) {
    console.error("Threat Actor Identification Error:", error);
    return [];
  }
}
