import { NextRequest, NextResponse } from "next/server";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";
import { z } from "zod";

const descriptionSchema = z.object({
  title: z.string().min(2).max(100),
  property_type: z.string().optional(),
  zone: z.string().optional(),
  area: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
});

export async function POST(request: NextRequest) {
  const csrfValid = await validateCsrfToken(request);
  if (!csrfValid) {
    logger.warn("CSRF validation failed on AI description");
    return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  }

  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();

  const rate = await checkApiRateLimit(`ai-description:${ip}`);
  if (!rate.allowed) {
    logger.warn("Rate limit exceeded on AI description", { ip });
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rate.headers || { "Retry-After": String(rate.retryAfter) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = descriptionSchema.safeParse(body);
  if (!result.success) {
    logger.warn("Invalid description request", { errors: result.error.flatten().fieldErrors });
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { title, property_type, zone, area, bedrooms, bathrooms } = result.data;

  // Mock AI-generated description - in production, this would call an LLM API
  // For now, we generate a template-based description
  const generatedDescription = generatePropertyDescription({
    title,
    property_type,
    zone,
    area,
    bedrooms,
    bathrooms,
  });

  logger.info("AI description generated", { title, ip });
  return NextResponse.json({ description: generatedDescription });
}

interface DescriptionParams {
  title: string;
  property_type?: string;
  zone?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
}

function generatePropertyDescription(params: DescriptionParams): string {
  const { title, property_type, zone, area, bedrooms, bathrooms } = params;
  
  const typeText = property_type ? getTypeText(property_type) : "property";
  const locationText = zone ? ` in ${zone}` : "";
  const areaText = area ? ` with an area of ${area} m²` : "";
  const bedroomText = bedrooms ? `${bedrooms} bedroom${bedrooms > 1 ? 's' : ''}` : "";
  const bathroomText = bathrooms ? `${bathrooms} bathroom${bathrooms > 1 ? 's' : ''}` : "";
  
  let description = `${title}: Excellent ${typeText} available${locationText}.`;
  
  if (bedroomText || bathroomText) {
    const features = [bedroomText, bathroomText].filter(Boolean).join(", ");
    description += ` This ${typeText} features ${features}.`;
  }
  
  if (areaText) {
    description += areaText + ".";
  }
  
  description += " Perfect for families and investors looking for quality real estate in Sadat City.";
  
  return description;
}

function getTypeText(typeId: string): string {
  // These would match the property type names from the database
  const typeMap: Record<string, string> = {
    apartment: "apartment",
    villa: "villa",
    office: "office space",
    shop: "commercial shop",
    land: "land plot",
  };
  return typeMap[typeId] || "property";
}